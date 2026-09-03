import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";

async function fetchSeasons() {
  const res = await fetch("/api/seasons", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load seasons");
  return res.json();
}

async function fetchWeeks(seasonId: string) {
  const res = await fetch(`/api/seasons/${seasonId}/weeks`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load weeks");
  return res.json();
}

async function fetchMe() {
  const res = await fetch("/api/me", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

async function fetchStandings(seasonId: string) {
  const res = await fetch(`/api/seasons/${seasonId}/standings`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export default function Home() {
  const [oddsResult, setOddsResult] = useState<{ matched: number; skipped: number; total: number; lastRefreshedAt: string } | null>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<{ log?: string[]; message?: string; alreadyDone?: boolean } | null>(null);
  const [fixError, setFixError] = useState<string | null>(null);

  const [resultsWeekId, setResultsWeekId] = useState<string>("");
  const [resultsMsg, setResultsMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmClearResults, setConfirmClearResults] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["/api/me"],
    queryFn: fetchMe,
    retry: false,
  });

  const { data: seasons = [], isLoading: seasonsLoading } = useQuery({
    queryKey: ["/api/seasons"],
    queryFn: fetchSeasons,
  });

  const activeSeason = seasons.find((s: any) => s.status === "active") || seasons[0];

  const { data: weeks = [], isLoading: weeksLoading } = useQuery({
    queryKey: ["/api/seasons", activeSeason?.id, "weeks"],
    queryFn: () => fetchWeeks(activeSeason.id),
    enabled: !!activeSeason,
  });

  const { data: standingsData, refetch: refetchStandings } = useQuery({
    queryKey: ["/api/seasons", activeSeason?.id, "standings"],
    queryFn: () => fetchStandings(activeSeason!.id),
    enabled: !!activeSeason,
  });

  const fixSeasonData = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/fix-season-data", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => {
      setFixResult(data);
      setFixError(null);
    },
    onError: (e: any) => {
      setFixError(e.message);
      setFixResult(null);
    },
  });

  const refreshOdds = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/odds/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to refresh odds");
      return data;
    },
    onSuccess: (data) => {
      setOddsResult(data);
      setOddsError(null);
    },
    onError: (e: any) => {
      setOddsError(e.message);
      setOddsResult(null);
    },
  });

  const generateResults = useMutation({
    mutationFn: async (weekId: string) => {
      const res = await fetch(`/api/admin/results/generate/${weekId}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => setResultsMsg({ text: `✓ Generated fake results for ${data.upserted} games`, ok: true }),
    onError: (e: any) => setResultsMsg({ text: e.message, ok: false }),
  });

  const refreshResults = useMutation({
    mutationFn: async (weekId: string) => {
      const res = await fetch(`/api/admin/results/refresh/${weekId}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => setResultsMsg({ text: `✓ ESPN: ${data.matched} matched, ${data.skipped} skipped (${data.total} from API)`, ok: true }),
    onError: (e: any) => setResultsMsg({ text: e.message, ok: false }),
  });

  const clearResults = useMutation({
    mutationFn: async (weekId: string) => {
      const res = await fetch(`/api/admin/results/${weekId}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => {
      setConfirmClearResults(false);
      setResultsMsg({ text: `✓ Cleared results for ${data.deleted} games`, ok: true });
    },
    onError: (e: any) => {
      setConfirmClearResults(false);
      setResultsMsg({ text: e.message, ok: false });
    },
  });

  const seedInvites = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/seed-invites", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
  });

  const fixInvites = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/fix-invites", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
  });

  const scoreWeek = useMutation({
    mutationFn: async (weekId: string) => {
      const res = await fetch(`/api/admin/score-week/${weekId}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      return data;
    },
    onSuccess: (data) => {
      setResultsMsg({ text: `✓ Week scored — ${data.picksScored} picks processed`, ok: true });
      refetchStandings();
    },
    onError: (e: any) => setResultsMsg({ text: e.message, ok: false }),
  });

  if (seasonsLoading) {
    return <div className="text-center py-16 text-slate-400">Loading...</div>;
  }

  if (!activeSeason) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏈</div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">No season set up yet</h2>
        <p className="text-slate-500">The admin will set up the 2026 season soon.</p>
      </div>
    );
  }

  const openWeeks = weeks.filter((w: any) => w.status !== "scored");
  const scoredWeeks = weeks.filter((w: any) => w.status === "scored");
  const isAdmin = me?.member?.role === "admin";

  const news = [
    { date: "Sep 2", text: "A round of updates based on ideas submitted.", done: true },
    { date: "Sep 2", text: "Confirmation email of users / emails.", done: true },
    { date: "Up next", text: "NFL Week 1 of the 2026 season starts on Wednesday, September 9, 2026.", done: false },
  ];

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">📰 Latest</h2>
        <ul className="space-y-2">
          {news.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                item.done
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {item.date}
              </span>
              <span className="text-sm text-slate-700 leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{activeSeason.name}</h1>
        <p className="text-slate-500 text-sm">{activeSeason.year} NFL Season</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-green-500">●</span> Open Weeks
          </h2>
          {weeksLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : openWeeks.length === 0 ? (
            <div className="text-slate-400 text-sm">No open weeks right now</div>
          ) : (
            <ul className="space-y-2">
              {openWeeks.map((week: any) => (
                <li key={week.id}>
                  <Link
                    href={`/picks/${week.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                  >
                    <span className="font-medium text-blue-800">{week.label}</span>
                    <span className="text-blue-500 text-sm group-hover:translate-x-1 transition-transform">
                      Make Picks →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-slate-400">✓</span> Scored Weeks
          </h2>
          {weeksLoading ? (
            <div className="text-slate-400 text-sm">Loading...</div>
          ) : scoredWeeks.length === 0 ? (
            <div className="text-slate-400 text-sm">No weeks scored yet</div>
          ) : (
            <ul className="space-y-2">
              {scoredWeeks.slice(-5).reverse().map((week: any) => (
                <li key={week.id} className="flex gap-2">
                  <Link
                    href={`/group/${week.id}`}
                    className="flex-1 flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{week.label}</span>
                    <span className="text-slate-400 text-sm">Group Picks</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {activeSeason && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">Season Standings</h2>
            <Link href={`/standings/${activeSeason.id}`} className="text-blue-600 hover:text-blue-700 text-sm">
              Full standings →
            </Link>
          </div>
          {!standingsData || standingsData.standings?.length === 0 ? (
            <p className="text-slate-400 text-sm">No standings yet — check back once weeks are scored.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-slate-400 font-medium w-8">#</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Team</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Wks</th>
                    <th className="text-right py-2 text-slate-400 font-medium">✓</th>
                    <th className="text-right py-2 font-semibold text-slate-600">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.standings.map((s: any) => (
                    <tr key={s.seasonMemberId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-slate-400 font-bold text-xs">{s.rank}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#013369] text-white text-[10px] font-bold shrink-0">
                            {s.initials}
                          </span>
                          <span className="font-medium text-slate-800 truncate">{s.displayName}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right text-slate-500 text-xs">{s.weeksScored}</td>
                      <td className="py-2 text-right text-slate-500 text-xs">{s.correctPickTotal}</td>
                      <td className="py-2 text-right font-bold text-slate-800">{s.adjustedTotalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {standingsData.season?.droppedWeekCount > 0 && standingsData.standings[0]?.droppedPoints > 0 && (
                <p className="text-xs text-slate-400 mt-2">Pts = adjusted (bottom {standingsData.season.droppedWeekCount} weeks dropped)</p>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-slate-400">⚙️</span> Admin
          </h2>
          <div className="flex flex-col gap-3">
            {/* Temporary — seed the invite list + reconcile existing members */}
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800 mb-2">👥 Invite Management (run once in prod)</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => seedInvites.mutate()}
                    disabled={seedInvites.isPending || seedInvites.isSuccess}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors"
                  >
                    {seedInvites.isPending ? <><span className="animate-spin">⟳</span> Seeding…</> :
                     seedInvites.isSuccess ? <>✓ Done</> : <>Seed 18 Invites</>}
                  </button>
                  {seedInvites.isSuccess && (
                    <span className="text-sm text-green-700 font-medium">
                      {seedInvites.data.inserted} inserted, {seedInvites.data.skipped} already present
                    </span>
                  )}
                  {seedInvites.isError && (
                    <span className="text-sm text-red-600">{(seedInvites.error as any)?.message}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => fixInvites.mutate()}
                    disabled={fixInvites.isPending || fixInvites.isSuccess}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {fixInvites.isPending ? <><span className="animate-spin">⟳</span> Fixing…</> :
                     fixInvites.isSuccess ? <>✓ Done</> : <>Fix Duplicates</>}
                  </button>
                  <span className="text-xs text-purple-700">Sets approved_email on active members, removes stale invited rows</span>
                  {fixInvites.isSuccess && (
                    <span className="text-sm text-green-700 font-medium">
                      {fixInvites.data.fixed} updated, {fixInvites.data.deleted} deleted
                    </span>
                  )}
                  {fixInvites.isError && (
                    <span className="text-sm text-red-600">{(fixInvites.error as any)?.message}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => refreshOdds.mutate()}
                disabled={refreshOdds.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {refreshOdds.isPending ? (
                  <>
                    <span className="animate-spin">⟳</span> Refreshing…
                  </>
                ) : (
                  <>🔄 Refresh Odds</>
                )}
              </button>
              {oddsResult && (
                <div className="text-sm text-green-600">
                  <span className="font-medium">✓ {oddsResult.matched} games updated</span>
                  <span className="text-slate-400 ml-2">({oddsResult.skipped} skipped · {oddsResult.total} from API)</span>
                  <span className="text-slate-400 ml-2">
                    Last refreshed: {new Date(oddsResult.lastRefreshedAt).toLocaleString("en-CA", {
                      timeZone: "America/Edmonton",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
              {oddsError && (
                <span className="text-sm text-red-500">{oddsError}</span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Fetches current NFL odds from The Odds API and stores them. Run this daily during the week for fresh lines.
              Requires the <code className="bg-slate-100 px-1 rounded">ODDS_API_KEY</code> secret.
            </p>

            <div className="border-t border-slate-100 pt-3 mt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fixSeasonData.mutate()}
                  disabled={fixSeasonData.isPending || fixResult?.alreadyDone}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {fixSeasonData.isPending ? (
                    <><span className="animate-spin">⟳</span> Running…</>
                  ) : fixResult?.alreadyDone ? (
                    <>✓ Season data already correct</>
                  ) : (
                    <>🔧 Fix Season Data (one-time)</>
                  )}
                </button>
                {fixResult && !fixResult.alreadyDone && fixResult.log && (
                  <div className="text-sm text-green-600 font-medium">✓ Done</div>
                )}
                {fixError && (
                  <span className="text-sm text-red-500">{fixError}</span>
                )}
              </div>
              {fixResult?.log && fixResult.log.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {fixResult.log.map((line, i) => (
                    <li key={i} className="text-xs text-slate-500">• {line}</li>
                  ))}
                </ul>
              )}
              {fixResult?.message && (
                <p className="text-xs text-slate-500 mt-1">{fixResult.message}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Fixes duplicate season data in production — migrates members, removes wrong season, activates the correct 272-game schedule. Safe to run multiple times.
              </p>
            </div>

            {/* Game Results section */}
            <div className="border-t border-slate-100 pt-3 mt-1">
              <p className="text-sm font-medium text-slate-600 mb-2">🏈 Game Results</p>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  value={resultsWeekId}
                  onChange={(e) => { setResultsWeekId(e.target.value); setResultsMsg(null); setConfirmClearResults(false); }}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select a week…</option>
                  {(weeks as any[]).map((w: any) => (
                    <option key={w.id} value={w.id}>{w.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => { setResultsMsg(null); generateResults.mutate(resultsWeekId); }}
                  disabled={!resultsWeekId || generateResults.isPending || refreshResults.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
                  title="Randomly generate fake final scores for all games this week (testing only)"
                >
                  {generateResults.isPending ? <><span className="animate-spin">⟳</span> Generating…</> : <>🎲 Generate Fake Results</>}
                </button>

                <button
                  onClick={() => { setResultsMsg(null); refreshResults.mutate(resultsWeekId); }}
                  disabled={!resultsWeekId || refreshResults.isPending || generateResults.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  title="Pull live scores from ESPN — use this once the real season starts"
                >
                  {refreshResults.isPending ? <><span className="animate-spin">⟳</span> Fetching…</> : <>📡 Refresh from ESPN</>}
                </button>

                {!confirmClearResults ? (
                  <button
                    onClick={() => setConfirmClearResults(true)}
                    disabled={!resultsWeekId || clearResults.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-40 transition-colors"
                    title="Delete all results for this week"
                  >
                    🗑️ Clear Results
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-red-700 font-medium">Clear all results?</span>
                    <button
                      onClick={() => { setResultsMsg(null); clearResults.mutate(resultsWeekId); }}
                      className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                    >Yes, clear</button>
                    <button
                      onClick={() => setConfirmClearResults(false)}
                      className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >Cancel</button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setResultsMsg(null); scoreWeek.mutate(resultsWeekId); }}
                  disabled={!resultsWeekId || scoreWeek.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                  title="Score all picks for this week against results, then mark the week as Scored"
                >
                  {scoreWeek.isPending ? <><span className="animate-spin">⟳</span> Scoring…</> : <>✅ Score Week</>}
                </button>
                <span className="text-xs text-slate-400">Scores picks against results and marks week as Scored. Run after all game results are in.</span>
              </div>

              {resultsMsg && (
                <p className={`text-sm mt-2 ${resultsMsg.ok ? "text-green-600" : "text-red-500"}`}>{resultsMsg.text}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                <strong>Generate Fake Results</strong> — random scores for testing. <strong>Refresh from ESPN</strong> — live scores during the real season. <strong>Score Week</strong> — calculate points and lock the week. <strong>Clear Results</strong> — wipe test data before season starts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
