import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";

async function fetchWeekData(weekId: string) {
  const res = await fetch(`/api/weeks/${weekId}/games`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load week");
  return res.json();
}

export default function WeekPicks() {
  const { weekId } = useParams<{ weekId: string }>();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftPicks, setDraftPicks] = useState<Record<string, { teamId: string; confidence: number }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/weeks", weekId, "games"],
    queryFn: () => fetchWeekData(weekId!),
    enabled: !!weekId,
    onSuccess: (data: any) => {
      const initial: typeof draftPicks = {};
      for (const pick of data.myPicks || []) {
        initial[pick.gameId] = { teamId: pick.selectedTeamId, confidence: pick.confidenceValue };
      }
      setDraftPicks(initial);
    },
  } as any);

  const submitPick = useMutation({
    mutationFn: async ({ gameId, selectedTeamId, confidenceValue }: any) => {
      const res = await fetch("/api/picks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, selectedTeamId, confidenceValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", weekId, "games"] });
    },
    onError: (e: any) => setError(e.message),
  });

  if (isLoading) return <div className="text-center py-16 text-slate-400">Loading...</div>;

  const games = data?.games || [];
  const now = new Date();
  const pickableGames = games.filter((g: any) => !g.pickCutoffAtUtc || new Date(g.pickCutoffAtUtc) > now);
  const totalGames = pickableGames.length;

  const usedConfidence = new Set(Object.values(draftPicks).map((p) => p.confidence));

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

  const handlePick = async (gameId: string, teamId: string, confidence: number) => {
    setSaving(gameId);
    setError(null);
    setDraftPicks((prev) => ({ ...prev, [gameId]: { teamId, confidence } }));
    await submitPick.mutateAsync({ gameId, selectedTeamId: teamId, confidenceValue: confidence });
    setSaving(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Picks</h1>
      <p className="text-slate-500 text-sm mb-5">
        Assign each confidence value (1–{totalGames}) once. Higher = more confident.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {games.map((game: any) => {
          const locked = game.pickCutoffAtUtc && new Date(game.pickCutoffAtUtc) <= now;
          const draft = draftPicks[game.id];

          return (
            <div
              key={game.id}
              className={`bg-white rounded-xl border p-4 shadow-sm transition-opacity ${locked ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-400">{formatTime(game.kickoffAtUtc)}</span>
                {locked && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Locked
                  </span>
                )}
                {game.neutralSite && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Neutral Site
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <TeamButton
                  team={game.awayTeam}
                  selected={draft?.teamId === game.awayTeamId}
                  locked={!!locked}
                  onClick={() => {
                    if (!locked && draft?.confidence) handlePick(game.id, game.awayTeamId, draft.confidence);
                    else setDraftPicks((p) => ({ ...p, [game.id]: { teamId: game.awayTeamId, confidence: p[game.id]?.confidence || 0 } }));
                  }}
                />
                <span className="text-slate-400 font-bold text-sm shrink-0">@</span>
                <TeamButton
                  team={game.homeTeam}
                  selected={draft?.teamId === game.homeTeamId}
                  locked={!!locked}
                  onClick={() => {
                    if (!locked && draft?.confidence) handlePick(game.id, game.homeTeamId, draft.confidence);
                    else setDraftPicks((p) => ({ ...p, [game.id]: { teamId: game.homeTeamId, confidence: p[game.id]?.confidence || 0 } }));
                  }}
                />

                <div className="ml-auto shrink-0">
                  <select
                    disabled={!!locked || !draft?.teamId}
                    value={draft?.confidence || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (draft?.teamId) {
                        handlePick(game.id, draft.teamId, val);
                      } else {
                        setDraftPicks((p) => ({ ...p, [game.id]: { ...p[game.id], confidence: val } }));
                      }
                    }}
                    className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
                  >
                    <option value="">—</option>
                    {Array.from({ length: totalGames }, (_, i) => i + 1).map((n) => (
                      <option
                        key={n}
                        value={n}
                        disabled={usedConfidence.has(n) && draft?.confidence !== n}
                      >
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {saving === game.id && (
                  <span className="text-xs text-blue-500">Saving...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamButton({ team, selected, locked, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg border-2 transition-colors text-sm font-medium disabled:cursor-default ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : "border-slate-200 hover:border-slate-300 text-slate-700"
      }`}
    >
      <span className="font-bold">{team?.abbreviation}</span>
      <span className="text-xs text-slate-500 hidden sm:block">{team?.city}</span>
    </button>
  );
}
