import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

async function fetchGroupData(weekId: string) {
  const res = await fetch(`/api/weeks/${weekId}/standings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load group picks");
  return res.json();
}

function formatMl(ml: number | null | undefined): string {
  if (ml == null) return "";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function SpreadMovement({ prev, curr }: { prev: number | null; curr: number | null }) {
  if (prev == null || curr == null || prev === curr) return null;
  const delta = Math.abs(curr - prev).toFixed(1);
  const moved = curr < prev;
  return (
    <span className={`text-[9px] font-semibold ${moved ? "text-green-600" : "text-orange-500"}`}>
      {moved ? "▼" : "▲"}{delta}
    </span>
  );
}

export default function GroupPicks() {
  const { weekId } = useParams<{ weekId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/weeks", weekId, "standings"],
    queryFn: () => fetchGroupData(weekId!),
    enabled: !!weekId,
  });

  if (isLoading) return <div className="text-center py-16 text-slate-400">Loading...</div>;

  const games = data?.games || [];
  const members = data?.members || [];
  const weekScored = data?.weekStatus === "scored";
  const now = new Date();

  const revealedGames = weekScored
    ? games
    : games.filter((g: any) => g.kickoffAtUtc && new Date(g.kickoffAtUtc) <= now);

  const formatTime = (utc: string | null) => {
    if (!utc) return "TBD";
    return new Date(utc).toLocaleString("en-CA", {
      timeZone: "America/Edmonton",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Group Picks</h1>

      {revealedGames.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
          Picks are hidden until games start. Check back once the first game kicks off.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm border border-slate-100 text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Game</th>
                {members.map((m: any) => (
                  <th key={m.seasonMemberId} className="px-3 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#013369] text-white text-xs font-bold">
                      {m.initials}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revealedGames.map((game: any) => {
                const odds = game.gameOdds;
                const homeSpread = odds?.spread ?? null;
                const prevSpread = odds?.previousSpread ?? null;
                return (
                  <tr key={game.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {game.awayTeam?.abbreviation} @ {game.homeTeam?.abbreviation}
                      </div>
                      <div className="text-xs text-slate-400">{formatTime(game.kickoffAtUtc)}</div>
                      {homeSpread !== null && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {game.homeTeam?.abbreviation} {homeSpread > 0 ? `+${homeSpread}` : homeSpread}
                          </span>
                          <SpreadMovement prev={prevSpread} curr={homeSpread} />
                          {odds?.homeMoneyline != null && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ML {formatMl(odds.homeMoneyline)}/{formatMl(odds.awayMoneyline)}
                            </span>
                          )}
                        </div>
                      )}
                      {game.gameResult?.status === "final" && (
                        <div className="text-xs text-green-600 font-medium mt-0.5">
                          Final: {game.gameResult.awayScore}–{game.gameResult.homeScore}
                        </div>
                      )}
                    </td>
                    {members.map((m: any) => {
                      const pick = m.picks?.find((p: any) => p.gameId === game.id);
                      if (!pick) {
                        return (
                          <td key={m.seasonMemberId} className="px-3 py-3 text-center text-slate-300">—</td>
                        );
                      }
                      const team = pick.selectedTeamId === game.awayTeamId ? game.awayTeam : game.homeTeam;
                      const correct = pick.score?.isCorrect;
                      return (
                        <td key={m.seasonMemberId} className="px-3 py-3 text-center">
                          <div
                            className={`text-xs font-bold ${
                              pick.score
                                ? correct
                                  ? "text-green-600"
                                  : "text-red-500"
                                : "text-slate-600"
                            }`}
                          >
                            {team?.abbreviation}
                          </div>
                          <div className="text-xs text-slate-400">({pick.confidenceValue})</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">Total Points</td>
                {members.map((m: any) => (
                  <td key={m.seasonMemberId} className="px-3 py-3 text-center font-bold text-slate-800">
                    {m.totalPoints}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
