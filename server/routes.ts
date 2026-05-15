import type { Express } from "express";
import { isAuthenticated } from "./replit_integrations/auth/index.js";
import { db } from "./db.js";
import {
  appUsers,
  leagueMembers,
  playerProfiles,
  seasons,
  seasonMembers,
  nflTeams,
  weeks,
  games,
  gameResults,
  picks,
  pickScores,
  weeklyScores,
} from "../shared/schema.js";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { validatePick, scoreBatchForWeek } from "./domain.js";

export function registerRoutes(app: Express) {
  app.get("/api/me", isAuthenticated, async (req: any, res) => {
    try {
      const claims = req.user.claims;
      const userId = claims.sub;

      let [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) {
        [user] = await db.insert(appUsers).values({
          replitUserId: userId,
          replitUsername: claims.username || null,
          email: claims.email || null,
          displayName: claims.first_name || claims.username || "Player",
          avatarUrl: claims.profile_image_url || null,
        }).returning();
      } else {
        await db.update(appUsers).set({ lastSeenAt: new Date() }).where(eq(appUsers.id, user.id));
      }

      let [member] = await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id));
      if (!member) {
        let matched: typeof leagueMembers.$inferSelect | undefined;
        if (user.email) {
          [matched] = await db.select().from(leagueMembers)
            .where(and(eq(leagueMembers.approvedEmail, user.email), eq(leagueMembers.status, "invited")));
        }
        if (!matched && user.replitUsername) {
          [matched] = await db.select().from(leagueMembers)
            .where(and(eq(leagueMembers.approvedReplitUsername, user.replitUsername!), eq(leagueMembers.status, "invited")));
        }
        if (matched) {
          [member] = await db.update(leagueMembers).set({
            appUserId: user.id,
            status: "active",
            joinedAt: new Date(),
          }).where(eq(leagueMembers.id, matched.id)).returning();
        }
      }

      const profile = member
        ? (await db.select().from(playerProfiles).where(eq(playerProfiles.leagueMemberId, member.id)))[0]
        : null;

      res.json({ user, member: member || null, profile: profile || null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = req.user.claims;

      let [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) {
        [user] = await db.insert(appUsers).values({
          replitUserId: userId,
          replitUsername: claims.username || null,
          email: claims.email || null,
          displayName: claims.first_name || claims.username || "Player",
          avatarUrl: claims.profile_image_url || null,
        }).returning();
      } else {
        await db.update(appUsers).set({ lastSeenAt: new Date() }).where(eq(appUsers.id, user.id));
      }

      let [member] = await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id));
      if (!member) {
        // Try to match an invited member by email or username
        let matched: typeof leagueMembers.$inferSelect | undefined;
        if (user.email) {
          [matched] = await db.select().from(leagueMembers)
            .where(and(eq(leagueMembers.approvedEmail, user.email), eq(leagueMembers.status, "invited")));
        }
        if (!matched && user.replitUsername) {
          [matched] = await db.select().from(leagueMembers)
            .where(and(eq(leagueMembers.approvedReplitUsername, user.replitUsername!), eq(leagueMembers.status, "invited")));
        }
        if (matched) {
          [member] = await db.update(leagueMembers).set({
            appUserId: user.id,
            status: "active",
            joinedAt: new Date(),
          }).where(eq(leagueMembers.id, matched.id)).returning();
        } else {
          // No pre-approved record — auto-create. First member becomes admin.
          const [existingAny] = await db.select().from(leagueMembers).limit(1);
          const role = existingAny ? "player" : "admin";
          [member] = await db.insert(leagueMembers).values({
            appUserId: user.id,
            role,
            status: "active",
            joinedAt: new Date(),
          }).returning();
        }
      }

      const { teamName, initials } = req.body;
      if (!teamName?.trim() || !initials?.trim()) {
        return res.status(400).json({ message: "Team name and initials are required" });
      }

      const existing = await db.select().from(playerProfiles).where(eq(playerProfiles.leagueMemberId, member.id));
      if (existing.length === 0) {
        await db.insert(playerProfiles).values({
          leagueMemberId: member.id,
          teamName: teamName.trim(),
          initials: initials.trim().toUpperCase().slice(0, 4),
          displayOrder: 0,
        });
      } else {
        await db.update(playerProfiles)
          .set({ teamName: teamName.trim(), initials: initials.trim().toUpperCase().slice(0, 4), updatedAt: new Date() })
          .where(eq(playerProfiles.leagueMemberId, member.id));
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/seasons", isAuthenticated, async (_req, res) => {
    try {
      const rows = await db.select().from(seasons).orderBy(desc(seasons.year));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/seasons/:seasonId/weeks", isAuthenticated, async (req, res) => {
    try {
      const rows = await db.select().from(weeks)
        .where(eq(weeks.seasonId, req.params.seasonId))
        .orderBy(asc(weeks.weekNumber));
      res.json(rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/weeks/:weekId/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const weekId = req.params.weekId;

      const weekGames = await db.query.games.findMany({
        where: eq(games.weekId, weekId),
        with: {
          awayTeam: true,
          homeTeam: true,
          gameResult: true,
        },
        orderBy: asc(games.displayOrder),
      });

      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      const [member] = user
        ? await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id))
        : [null];

      let myPicks: typeof picks.$inferSelect[] = [];
      if (member) {
        const [sm] = await db.select().from(seasonMembers)
          .where(and(
            eq(seasonMembers.leagueMemberId, member.id),
            eq(seasonMembers.seasonId, weekGames[0]?.seasonId || "")
          ));
        if (sm) {
          myPicks = await db.select().from(picks)
            .where(and(eq(picks.weekId, weekId), eq(picks.seasonMemberId, sm.id)));
        }
      }

      res.json({ games: weekGames, myPicks });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/picks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gameId, selectedTeamId, confidenceValue } = req.body;

      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) return res.status(403).json({ message: "Not a league member" });

      const [member] = await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id));
      if (!member || member.status !== "active") return res.status(403).json({ message: "Not an active league member" });

      const [game] = await db.select().from(games).where(eq(games.id, gameId));
      if (!game) return res.status(404).json({ message: "Game not found" });

      const [week] = await db.select().from(weeks).where(eq(weeks.id, game.weekId));
      if (!week) return res.status(404).json({ message: "Week not found" });

      const [sm] = await db.select().from(seasonMembers)
        .where(and(eq(seasonMembers.leagueMemberId, member.id), eq(seasonMembers.seasonId, game.seasonId)));
      if (!sm) return res.status(403).json({ message: "Not enrolled in this season" });

      const weekGamesList = await db.select().from(games).where(eq(games.weekId, game.weekId));
      const existingPicks = await db.select().from(picks)
        .where(and(eq(picks.seasonMemberId, sm.id), eq(picks.weekId, game.weekId)));

      const error = validatePick({ game, selectedTeamId, confidenceValue, weekGames: weekGamesList, existingPicks });
      if (error) return res.status(400).json({ message: error });

      const [existingPick] = await db.select().from(picks)
        .where(and(eq(picks.seasonMemberId, sm.id), eq(picks.gameId, gameId)));

      if (existingPick) {
        await db.update(picks)
          .set({ selectedTeamId, confidenceValue, updatedAt: new Date() })
          .where(eq(picks.id, existingPick.id));
      } else {
        await db.insert(picks).values({
          seasonMemberId: sm.id,
          weekId: game.weekId,
          gameId,
          selectedTeamId,
          confidenceValue,
        });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/weeks/:weekId/standings", isAuthenticated, async (req, res) => {
    try {
      const weekId = req.params.weekId;
      const now = new Date();

      const [week] = await db.select().from(weeks).where(eq(weeks.id, weekId));
      if (!week) return res.status(404).json({ message: "Week not found" });

      const weekGamesList = await db.query.games.findMany({
        where: eq(games.weekId, weekId),
        with: { awayTeam: true, homeTeam: true, gameResult: true },
        orderBy: asc(games.displayOrder),
      });

      const members = await db.query.seasonMembers.findMany({
        where: eq(seasonMembers.seasonId, week.seasonId),
        with: {
          leagueMember: { with: { playerProfile: true } },
        },
        orderBy: asc(seasonMembers.displayOrder),
      });

      const allPicks = await db.select().from(picks).where(eq(picks.weekId, weekId));
      const allPickScores = await db.select().from(pickScores)
        .where(sql`pick_id IN (SELECT id FROM picks WHERE week_id = ${weekId})`);

      const result = members.map((sm) => {
        const memberPicks = allPicks.filter((p) => p.seasonMemberId === sm.id);
        const revealedGames = weekGamesList.filter((g) => g.kickoffAtUtc && g.kickoffAtUtc <= now);
        const revealedPicks = memberPicks.filter((p) => revealedGames.some((g) => g.id === p.gameId));
        const scoredPicks = revealedPicks.map((p) => {
          const ps = allPickScores.find((ps) => ps.pickId === p.id);
          return { ...p, score: ps || null };
        });

        return {
          seasonMemberId: sm.id,
          displayName: sm.leagueMember?.playerProfile?.teamName || "Unknown",
          initials: sm.leagueMember?.playerProfile?.initials || "??",
          picks: scoredPicks,
          totalPoints: scoredPicks.reduce((acc, p) => acc + (p.score?.pointsAwarded || 0), 0),
        };
      });

      res.json({ games: weekGamesList, members: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/seasons/:seasonId/standings", isAuthenticated, async (req, res) => {
    try {
      const { seasonId } = req.params;
      const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId));
      if (!season) return res.status(404).json({ message: "Season not found" });

      const members = await db.query.seasonMembers.findMany({
        where: eq(seasonMembers.seasonId, seasonId),
        with: { leagueMember: { with: { playerProfile: true } } },
        orderBy: asc(seasonMembers.displayOrder),
      });

      const allWeeklyScores = await db.select().from(weeklyScores)
        .where(sql`season_member_id IN (${sql.join(members.map((m) => sql`${m.id}`), sql`, `)})`);

      const result = members.map((sm) => {
        const memberWeeklyScores = allWeeklyScores.filter((ws) => ws.seasonMemberId === sm.id);
        const sortedAsc = [...memberWeeklyScores].sort((a, b) => a.rawPoints - b.rawPoints);
        const droppedWeeks = sortedAsc.slice(0, season.droppedWeekCount).map((ws) => ws.weekId);
        const rawTotal = memberWeeklyScores.reduce((acc, ws) => acc + ws.rawPoints, 0);
        const droppedTotal = memberWeeklyScores
          .filter((ws) => droppedWeeks.includes(ws.weekId))
          .reduce((acc, ws) => acc + ws.rawPoints, 0);

        return {
          seasonMemberId: sm.id,
          displayName: sm.leagueMember?.playerProfile?.teamName || "Unknown",
          initials: sm.leagueMember?.playerProfile?.initials || "??",
          weeksScored: memberWeeklyScores.length,
          rawTotalPoints: rawTotal,
          droppedPoints: droppedTotal,
          adjustedTotalPoints: rawTotal - droppedTotal,
          correctPickTotal: memberWeeklyScores.reduce((acc, ws) => acc + ws.correctPickCount, 0),
          weeklyScores: memberWeeklyScores,
        };
      });

      result.sort((a, b) => b.adjustedTotalPoints - a.adjustedTotalPoints);
      result.forEach((r, i) => (r as any).rank = i + 1);

      res.json({ season, standings: result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/score-week/:weekId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      const [member] = user ? await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id)) : [null];
      if (!member || member.role !== "admin") return res.status(403).json({ message: "Admin only" });

      const weekId = req.params.weekId;
      const result = await scoreBatchForWeek(weekId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/nfl-teams", isAuthenticated, async (_req, res) => {
    try {
      const teams = await db.select().from(nflTeams).where(eq(nflTeams.isActive, true)).orderBy(asc(nflTeams.displayOrder));
      res.json(teams);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });
}
