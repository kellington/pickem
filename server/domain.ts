import { db } from "./db.js";
import {
  games,
  picks,
  pickScores,
  weeklyScores,
  gameResults,
  seasonMembers,
  weeks,
} from "../shared/schema.js";
import { eq, and, sql } from "drizzle-orm";

interface ValidatePickInput {
  game: typeof games.$inferSelect;
  selectedTeamId: string;
  confidenceValue: number;
  weekGames: typeof games.$inferSelect[];
  existingPicks: typeof picks.$inferSelect[];
}

export function validatePick({
  game,
  selectedTeamId,
  confidenceValue,
  weekGames,
  existingPicks,
}: ValidatePickInput): string | null {
  const now = new Date();

  if (game.pickCutoffAtUtc && now >= game.pickCutoffAtUtc) {
    return "Picks are locked for this game";
  }

  if (!game.kickoffAtUtc && game.kickoffStatus !== "scheduled") {
    return "Game time is TBD, picks unavailable";
  }

  const validTeams = [game.awayTeamId, game.homeTeamId];
  if (!validTeams.includes(selectedTeamId)) {
    return "Invalid team selection";
  }

  const pickableCount = weekGames.filter(
    (g) => !g.pickCutoffAtUtc || now < g.pickCutoffAtUtc
  ).length;

  if (confidenceValue < 1 || confidenceValue > pickableCount) {
    return `Confidence value must be between 1 and ${pickableCount}`;
  }

  const conflictingPick = existingPicks.find(
    (p) => p.confidenceValue === confidenceValue && p.gameId !== game.id
  );
  if (conflictingPick) {
    return `Confidence value ${confidenceValue} is already used for another game`;
  }

  return null;
}

export async function scoreBatchForWeek(weekId: string) {
  const weekGames = await db.query.games.findMany({
    where: eq(games.weekId, weekId),
    with: { gameResult: true },
  });

  const [week] = await db.select().from(weeks).where(eq(weeks.id, weekId));
  if (!week) throw new Error("Week not found");

  const members = await db.select().from(seasonMembers).where(eq(seasonMembers.seasonId, week.seasonId));
  const allPicks = await db.select().from(picks).where(eq(picks.weekId, weekId));

  let totalScored = 0;

  for (const sm of members) {
    const memberPicks = allPicks.filter((p) => p.seasonMemberId === sm.id);
    let correctCount = 0;
    let rawPoints = 0;
    let possiblePoints = 0;

    for (const pick of memberPicks) {
      const game = weekGames.find((g) => g.id === pick.gameId);
      if (!game) continue;

      possiblePoints += pick.confidenceValue;

      const result = game.gameResult;
      if (!result || result.status !== "final") continue;

      const isCorrect = result.winningTeamId === pick.selectedTeamId;
      const pointsAwarded = isCorrect ? pick.confidenceValue : 0;

      if (isCorrect) correctCount++;
      rawPoints += pointsAwarded;

      await db
        .insert(pickScores)
        .values({
          pickId: pick.id,
          gameResultId: result.id,
          isCorrect,
          pointsAwarded,
        })
        .onConflictDoUpdate({
          target: pickScores.pickId,
          set: { isCorrect, pointsAwarded, scoredAt: new Date() },
        });

      totalScored++;
    }

    await db
      .insert(weeklyScores)
      .values({
        seasonMemberId: sm.id,
        weekId,
        correctPickCount: correctCount,
        rawPoints,
        possiblePoints,
      })
      .onConflictDoUpdate({
        target: [weeklyScores.seasonMemberId, weeklyScores.weekId],
        set: { correctPickCount: correctCount, rawPoints, possiblePoints, scoredAt: new Date() },
      });
  }

  return { ok: true, picksScored: totalScored };
}

export function computeStandings(
  memberWeeklyScores: { seasonMemberId: string; rawPoints: number; weekId: string }[],
  droppedWeekCount: number
) {
  const sortedAsc = [...memberWeeklyScores].sort((a, b) => a.rawPoints - b.rawPoints);
  const droppedWeekIds = sortedAsc.slice(0, droppedWeekCount).map((ws) => ws.weekId);
  const rawTotal = memberWeeklyScores.reduce((acc, ws) => acc + ws.rawPoints, 0);
  const droppedTotal = memberWeeklyScores
    .filter((ws) => droppedWeekIds.includes(ws.weekId))
    .reduce((acc, ws) => acc + ws.rawPoints, 0);

  return {
    rawTotal,
    droppedPoints: droppedTotal,
    adjustedTotal: rawTotal - droppedTotal,
    droppedWeekIds,
  };
}
