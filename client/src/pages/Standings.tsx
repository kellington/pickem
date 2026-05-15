import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

async function fetchStandings(seasonId: string) {
  const res = await fetch(`/api/seasons/${seasonId}/standings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load standings");
  return res.json();
}

export default function Standings() {
  const { seasonId } = useParams<{ seasonId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/seasons", seasonId, "standings"],
    queryFn: () => fetchStandings(seasonId!),
    enabled: !!seasonId,
  });

  if (isLoading) return <div className="text-center py-16 text-slate-400">Loading...</div>;

  const standings = data?.standings || [];
  const season = data?.season;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Season Standings</h1>
      {season && (
        <p className="text-slate-500 text-sm mb-5">
          {season.name} · Bottom {season.droppedWeekCount} weeks dropped per player
        </p>
      )}

      {standings.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-slate-400">
          No standings yet — check back once weeks are scored.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium w-10">Rank</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Team</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Weeks</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Raw Pts</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Dropped</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium font-bold text-slate-700">Adj Pts</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Correct</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s: any) => (
                <tr key={s.seasonMemberId} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 font-bold">#{s.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#013369] text-white text-xs font-bold">
                        {s.initials}
                      </span>
                      <span className="font-medium text-slate-800">{s.displayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.weeksScored}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{s.rawTotalPoints}</td>
                  <td className="px-4 py-3 text-right text-red-400">-{s.droppedPoints}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{s.adjustedTotalPoints}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{s.correctPickTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
