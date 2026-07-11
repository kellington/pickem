import type { Express } from "express";
import { isAuthenticated } from "./replit_integrations/auth/index.js";
import { db } from "./db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  featureIdeas,
  gameOdds,
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

      // Auto-enroll in all active seasons
      const activeSeasons = await db.select().from(seasons).where(eq(seasons.status, "active"));
      for (const season of activeSeasons) {
        await db.insert(seasonMembers)
          .values({ seasonId: season.id, leagueMemberId: member.id, isActive: true, displayOrder: 0 })
          .onConflictDoNothing();
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
          gameOdds: true,
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

      let [sm] = await db.select().from(seasonMembers)
        .where(and(eq(seasonMembers.leagueMemberId, member.id), eq(seasonMembers.seasonId, game.seasonId)));
      if (!sm) {
        // Auto-enroll active members who completed profile setup before season was active
        [sm] = await db.insert(seasonMembers)
          .values({ seasonId: game.seasonId, leagueMemberId: member.id, isActive: true, displayOrder: 0 })
          .returning();
      }

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
        with: { awayTeam: true, homeTeam: true, gameResult: true, gameOdds: true },
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

  app.post("/api/admin/odds/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      const [member] = user ? await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id)) : [null];
      if (!member || member.role !== "admin") return res.status(403).json({ message: "Admin only" });

      const apiKey = process.env.ODDS_API_KEY;
      if (!apiKey) return res.status(500).json({ message: "ODDS_API_KEY secret not configured. Add it in the Secrets tab." });

      // Determine the current week window: find open/setup weeks sorted by weekNumber,
      // use the earliest open week's date range to filter both the API call and DB games.
      const openWeeks = await db.select().from(weeks)
        .where(sql`status IN ('open', 'setup')`)
        .orderBy(asc(weeks.weekNumber));

      let windowStart: Date | null = null;
      let windowEnd: Date | null = null;
      if (openWeeks.length > 0) {
        const currentWeek = openWeeks[0];
        windowStart = currentWeek.startsOn ?? null;
        windowEnd = currentWeek.endsOn ?? null;
      }

      // Build API URL with optional commenceTime window
      let oddsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=spreads,h2h&oddsFormat=american`;
      if (windowStart) oddsUrl += `&commenceTimeFrom=${windowStart.toISOString()}`;
      if (windowEnd) oddsUrl += `&commenceTimeTo=${windowEnd.toISOString()}`;

      const oddsResponse = await fetch(oddsUrl);
      if (!oddsResponse.ok) {
        const txt = await oddsResponse.text();
        return res.status(502).json({ message: `Odds API returned ${oddsResponse.status}`, detail: txt.slice(0, 300) });
      }
      const oddsData: any[] = await oddsResponse.json();

      // Load only games in the current week window
      const dbGames = await db.query.games.findMany({
        where: openWeeks.length > 0 ? eq(games.weekId, openWeeks[0].id) : undefined,
        with: { awayTeam: true, homeTeam: true, gameOdds: true },
      });

      function fuzzyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
        if (!a || !b) return false;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
        const na = norm(a);
        const nb = norm(b);
        if (na === nb) return true;
        const lastA = na.split(" ").filter(Boolean).pop() || "";
        const lastB = nb.split(" ").filter(Boolean).pop() || "";
        return lastA.length > 3 && lastA === lastB;
      }

      let matched = 0;
      let skipped = 0;
      const refreshedAt = new Date();

      for (const oddsGame of oddsData) {
        const commenceTime = new Date(oddsGame.commence_time);

        const dbGame = dbGames.find((g) => {
          if (!g.kickoffAtUtc) return false;
          const diff = Math.abs(new Date(g.kickoffAtUtc).getTime() - commenceTime.getTime());
          return diff <= 2 * 60 * 60 * 1000
            && fuzzyMatch(g.homeTeam?.fullName, oddsGame.home_team)
            && fuzzyMatch(g.awayTeam?.fullName, oddsGame.away_team);
        });

        if (!dbGame) { skipped++; continue; }

        const preferred = ["draftkings", "fanduel", "betmgm"];
        const bookmaker = oddsGame.bookmakers?.find((b: any) => preferred.includes(b.key))
          ?? oddsGame.bookmakers?.[0];
        if (!bookmaker) { skipped++; continue; }

        let homeSpread: number | null = null;
        let homeMoneyline: number | null = null;
        let awayMoneyline: number | null = null;

        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes?.find((o: any) => fuzzyMatch(oddsGame.home_team, o.name));
          if (homeOutcome) homeSpread = homeOutcome.point;
        }

        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === "h2h");
        if (h2hMarket) {
          const homeO = h2hMarket.outcomes?.find((o: any) => fuzzyMatch(oddsGame.home_team, o.name));
          const awayO = h2hMarket.outcomes?.find((o: any) => fuzzyMatch(oddsGame.away_team, o.name));
          if (homeO) homeMoneyline = homeO.price;
          if (awayO) awayMoneyline = awayO.price;
        }

        // Always carry forward the current spread as previousSpread before overwriting —
        // this ensures movement reflects current-vs-immediately-prior, not a stale historical value.
        const existing = dbGame.gameOdds;
        const prevSpread = existing?.spread ?? null;

        await db.insert(gameOdds).values({
          gameId: dbGame.id,
          spread: homeSpread,
          previousSpread: prevSpread,
          homeMoneyline,
          awayMoneyline,
          refreshedAt,
        }).onConflictDoUpdate({
          target: gameOdds.gameId,
          set: {
            spread: homeSpread,
            previousSpread: prevSpread,
            homeMoneyline,
            awayMoneyline,
            refreshedAt,
          },
        });

        matched++;
      }

      res.json({ matched, skipped, total: oddsData.length, lastRefreshedAt: refreshedAt.toISOString() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/feature-ideas", isAuthenticated, async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: featureIdeas.id,
          ideaText: featureIdeas.ideaText,
          submittedAt: featureIdeas.submittedAt,
          status: featureIdeas.status,
          completedAt: featureIdeas.completedAt,
          displayName: appUsers.displayName,
          replitUsername: appUsers.replitUsername,
        })
        .from(featureIdeas)
        .innerJoin(appUsers, eq(featureIdeas.appUserId, appUsers.id))
        .orderBy(asc(featureIdeas.status), desc(featureIdeas.submittedAt));
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // One-time data migration: fix duplicate seasons, activate correct 2026 season.
  // Safe to run multiple times (idempotent). Admin-only.
  app.post("/api/admin/fix-season-data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) return res.status(403).json({ message: "User not found" });
      const [member] = await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id));
      if (!member || member.role !== "admin") return res.status(403).json({ message: "Admins only" });

      // Identify the correct season: the one with 272 games (ESPN-sourced).
      const seasonGameCounts = await db.execute(sql`
        SELECT s.id, s.status, COUNT(g.id) as game_count
        FROM seasons s
        JOIN weeks w ON w.season_id = s.id
        LEFT JOIN games g ON g.week_id = w.id
        WHERE s.year = 2026
        GROUP BY s.id, s.status
      `);
      const rows = seasonGameCounts.rows as { id: string; status: string; game_count: string }[];

      const correctSeason = rows.find((r) => Number(r.game_count) === 272);
      const badSeasons = rows.filter((r) => r.id !== correctSeason?.id);

      if (!correctSeason) {
        return res.status(400).json({ message: "Could not identify the correct season (need exactly one with 272 games)." });
      }

      if (badSeasons.length === 0 && correctSeason.status === "active") {
        return res.json({ ok: true, message: "Already fixed — correct season is active with 272 games.", alreadyDone: true });
      }

      const badSeasonIds = badSeasons.map((r) => r.id);
      const log: string[] = [];

      // 1. Migrate season_members from bad seasons to correct season (skip duplicates).
      if (badSeasonIds.length > 0) {
        const existing = await db.execute(sql`
          SELECT league_member_id FROM season_members WHERE season_id = ${correctSeason.id}
        `);
        const alreadyIn = new Set((existing.rows as any[]).map((r) => r.league_member_id));

        const toMigrate = await db.execute(sql`
          SELECT id, league_member_id FROM season_members
          WHERE season_id = ANY(${badSeasonIds}::uuid[])
        `);
        let migrated = 0;
        for (const row of toMigrate.rows as any[]) {
          if (!alreadyIn.has(row.league_member_id)) {
            await db.execute(sql`
              INSERT INTO season_members (league_member_id, season_id)
              VALUES (${row.league_member_id}, ${correctSeason.id})
              ON CONFLICT DO NOTHING
            `);
            migrated++;
          }
        }
        log.push(`Migrated ${migrated} season members to correct season.`);
      }

      // 2. Delete picks on bad seasons' games.
      if (badSeasonIds.length > 0) {
        const delPicks = await db.execute(sql`
          DELETE FROM picks WHERE game_id IN (
            SELECT g.id FROM games g JOIN weeks w ON w.id = g.week_id
            WHERE w.season_id = ANY(${badSeasonIds}::uuid[])
          )
        `);
        log.push(`Deleted ${(delPicks as any).rowCount} picks on bad season games.`);

        // 3. Delete game_odds on bad seasons' games.
        await db.execute(sql`
          DELETE FROM game_odds WHERE game_id IN (
            SELECT g.id FROM games g JOIN weeks w ON w.id = g.week_id
            WHERE w.season_id = ANY(${badSeasonIds}::uuid[])
          )
        `);

        // 4. Delete games for bad seasons.
        const delGames = await db.execute(sql`
          DELETE FROM games WHERE week_id IN (
            SELECT id FROM weeks WHERE season_id = ANY(${badSeasonIds}::uuid[])
          )
        `);
        log.push(`Deleted ${(delGames as any).rowCount} games from bad seasons.`);

        // 5. Delete weeks.
        await db.execute(sql`DELETE FROM weeks WHERE season_id = ANY(${badSeasonIds}::uuid[])`);

        // 6. Delete schedule_imports.
        await db.execute(sql`DELETE FROM schedule_imports WHERE season_id = ANY(${badSeasonIds}::uuid[])`);

        // 7. Delete season_members on bad seasons.
        await db.execute(sql`DELETE FROM season_members WHERE season_id = ANY(${badSeasonIds}::uuid[])`);

        // 8. Delete bad seasons.
        await db.execute(sql`DELETE FROM seasons WHERE id = ANY(${badSeasonIds}::uuid[])`);
        log.push(`Removed ${badSeasonIds.length} bad season(s).`);
      }

      // 9. Activate correct season.
      await db.update(seasons).set({ status: "active" }).where(eq(seasons.id, correctSeason.id));
      log.push(`Season ${correctSeason.id} set to active.`);

      // 10. Open Week 1 of correct season (find it by week_number=1).
      const [week1] = await db.select({ id: weeks.id }).from(weeks)
        .where(and(eq(weeks.seasonId, correctSeason.id), eq(weeks.weekNumber, 1)));
      if (week1) {
        await db.update(weeks).set({ status: "open" }).where(eq(weeks.id, week1.id));
        log.push(`Week 1 (${week1.id}) set to open.`);
      }

      res.json({ ok: true, log });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", detail: String(err) });
    }
  });

  app.patch("/api/feature-ideas/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) return res.status(403).json({ message: "User not found" });

      const [member] = await db.select().from(leagueMembers).where(eq(leagueMembers.appUserId, user.id));
      if (!member || member.role !== "admin") return res.status(403).json({ message: "Admins only" });

      const { id } = req.params;
      const [updated] = await db
        .update(featureIdeas)
        .set({ status: "done", completedAt: new Date() })
        .where(eq(featureIdeas.id, id))
        .returning({ id: featureIdeas.id, status: featureIdeas.status, completedAt: featureIdeas.completedAt });

      if (!updated) return res.status(404).json({ message: "Idea not found" });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/feature-ideas", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ideaText } = req.body;

      if (!ideaText?.trim()) {
        return res.status(400).json({ message: "Idea text is required" });
      }

      const [user] = await db.select().from(appUsers).where(eq(appUsers.replitUserId, userId));
      if (!user) return res.status(403).json({ message: "User not found" });

      await db.insert(featureIdeas).values({
        appUserId: user.id,
        ideaText: ideaText.trim(),
      });

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/status", (_req, res) => {
    const statusDir = path.join(__dirname, "../project/status");
    let files: string[] = [];
    try {
      files = fs.readdirSync(statusDir)
        .filter((f) => /^status-\d{4}-\d{2}-\d{2}\.html$/.test(f))
        .sort()
        .reverse();
    } catch {
      return res.status(404).send("Status directory not found.");
    }
    if (files.length === 0) {
      return res.status(404).send("No status report found.");
    }
    const latest = path.join(statusDir, files[0]);
    res.setHeader("Content-Type", "text/html");
    res.sendFile(latest);
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
