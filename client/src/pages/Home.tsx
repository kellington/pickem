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

export default function Home() {
  const [oddsResult, setOddsResult] = useState<{ matched: number; skipped: number; total: number; lastRefreshedAt: string } | null>(null);
  const [oddsError, setOddsError] = useState<string | null>(null);

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

  const openWeeks = weeks.filter((w: any) => w.status === "open");
  const scoredWeeks = weeks.filter((w: any) => w.status === "scored");
  const isAdmin = me?.member?.role === "admin";

  return (
    <div>
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
          <p className="text-slate-400 text-sm">View the full standings page for rankings and dropped week details.</p>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="text-slate-400">⚙️</span> Admin
          </h2>
          <div className="flex flex-col gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
