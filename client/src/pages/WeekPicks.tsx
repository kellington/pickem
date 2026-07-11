import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";

async function fetchWeekData(weekId: string) {
  const res = await fetch(`/api/weeks/${weekId}/games`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load week");
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
    <span className={`text-[10px] font-semibold px-1 py-0.5 rounded ${moved ? "text-green-700 bg-green-100" : "text-orange-700 bg-orange-100"}`}>
      {moved ? "▼" : "▲"} {delta}
    </span>
  );
}

type DraftPick = { teamId: string; confidence: number };

export default function WeekPicks() {
  const { weekId } = useParams<{ weekId: string }>();
  const queryClient = useQueryClient();

  const [draftPicks, setDraftPicks] = useState<Record<string, DraftPick>>({});
  const [savingGames, setSavingGames] = useState<Set<string>>(new Set());
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());
  const [errorGames, setErrorGames] = useState<Record<string, string>>({});
  const initialized = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/weeks", weekId, "games"],
    queryFn: () => fetchWeekData(weekId!),
    enabled: !!weekId,
  });

  useEffect(() => {
    if (!data) return;
    const serverPicks: Record<string, DraftPick> = {};
    for (const pick of data.myPicks || []) {
      serverPicks[pick.gameId] = {
        teamId: pick.selectedTeamId,
        confidence: pick.confidenceValue,
      };
    }
    if (!initialized.current) {
      initialized.current = true;
      setDraftPicks(serverPicks);
    } else {
      setDraftPicks((prev) => ({ ...serverPicks, ...prev }));
    }
  }, [data]);

  const savePick = useMutation({
    mutationFn: async ({ gameId, selectedTeamId, confidenceValue }: { gameId: string; selectedTeamId: string; confidenceValue: number }) => {
      const res = await fetch("/api/picks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, selectedTeamId, confidenceValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save");
      }
      return gameId;
    },
    onSuccess: (gameId) => {
      setSavingGames((s) => { const n = new Set(s); n.delete(gameId); return n; });
      setSavedGames((s) => new Set([...s, gameId]));
      setTimeout(() => setSavedGames((s) => { const n = new Set(s); n.delete(gameId); return n; }), 2000);
      setErrorGames((e) => { const n = { ...e }; delete n[gameId]; return n; });
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", weekId, "games"] });
    },
    onError: (err: any, { gameId }) => {
      setSavingGames((s) => { const n = new Set(s); n.delete(gameId); return n; });
      setErrorGames((e) => ({ ...e, [gameId]: err.message }));
    },
  });

  const handleTeamClick = (gameId: string, teamId: string) => {
    setDraftPicks((prev) => {
      const updated = { ...prev, [gameId]: { teamId, confidence: prev[gameId]?.confidence || 0 } };
      const confidence = updated[gameId].confidence;
      if (confidence) {
        triggerSave(gameId, teamId, confidence);
      }
      return updated;
    });
  };

  const handleConfidenceChange = (gameId: string, confidence: number) => {
    setDraftPicks((prev) => {
      const teamId = prev[gameId]?.teamId || "";
      const updated = { ...prev, [gameId]: { teamId, confidence } };
      if (teamId) {
        triggerSave(gameId, teamId, confidence);
      }
      return updated;
    });
  };

  const triggerSave = (gameId: string, selectedTeamId: string, confidenceValue: number) => {
    setSavingGames((s) => new Set([...s, gameId]));
    savePick.mutate({ gameId, selectedTeamId, confidenceValue });
  };

  if (isLoading) return <div className="text-center py-16 text-slate-400">Loading...</div>;

  const games = data?.games || [];
  const now = new Date();

  const usedConfidence = new Set(
    Object.values(draftPicks).filter((p) => p.confidence > 0).map((p) => p.confidence)
  );

  const pickableCount = games.filter((g: any) => {
    const completed = ["final", "in_progress"].includes(g.gameResult?.status);
    const cutoffPassed = g.pickCutoffAtUtc && new Date(g.pickCutoffAtUtc) <= now;
    return !completed && !cutoffPassed;
  }).length;

  const totalGames = games.length;

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

  const pickedCount = Object.values(draftPicks).filter((p) => p.teamId && p.confidence > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-800">My Picks</h1>
        <span className="text-sm text-slate-500">{pickedCount} / {totalGames} picked</span>
      </div>
      <p className="text-slate-500 text-sm mb-5">
        Assign each confidence value (1–{totalGames}) once. Higher = more confident. Picks save automatically.
      </p>

      <div className="space-y-3">
        {games.map((game: any) => {
          const completed = ["final", "in_progress"].includes(game.gameResult?.status);
          const cutoffPassed = game.pickCutoffAtUtc && new Date(game.pickCutoffAtUtc) <= now;
          const locked = completed || !!cutoffPassed;

          const draft = draftPicks[game.id];
          const isSaving = savingGames.has(game.id);
          const isSaved = savedGames.has(game.id);
          const saveError = errorGames[game.id];

          const odds = game.gameOdds;
          const homeSpread = odds?.spread ?? null;
          const awaySpread = homeSpread !== null ? -homeSpread : null;
          const homePrevSpread = odds?.previousSpread ?? null;
          const awayPrevSpread = homePrevSpread !== null ? -homePrevSpread : null;

          return (
            <div
              key={game.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${locked ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-slate-400">{formatTime(game.kickoffAtUtc)}</span>
                <div className="flex items-center gap-2">
                  {completed && (
                    <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded-full">
                      Final
                    </span>
                  )}
                  {!completed && cutoffPassed && (
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
              </div>

              <div className="flex items-center gap-3">
                <TeamButton
                  team={game.awayTeam}
                  spread={awaySpread}
                  prevSpread={awayPrevSpread}
                  moneyline={odds?.awayMoneyline ?? null}
                  selected={draft?.teamId === game.awayTeamId}
                  locked={locked}
                  onClick={() => !locked && handleTeamClick(game.id, game.awayTeamId)}
                />
                <span className="text-slate-400 font-bold text-sm shrink-0">@</span>
                <TeamButton
                  team={game.homeTeam}
                  spread={homeSpread}
                  prevSpread={homePrevSpread}
                  moneyline={odds?.homeMoneyline ?? null}
                  selected={draft?.teamId === game.homeTeamId}
                  locked={locked}
                  onClick={() => !locked && handleTeamClick(game.id, game.homeTeamId)}
                />

                <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
                  <select
                    disabled={locked}
                    value={draft?.confidence || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleConfidenceChange(game.id, val);
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

                  <div className="h-3.5 flex items-center">
                    {isSaving && (
                      <span className="text-[10px] text-blue-400 animate-pulse">Saving…</span>
                    )}
                    {!isSaving && isSaved && (
                      <span className="text-[10px] text-green-500">✓ Saved</span>
                    )}
                    {!isSaving && saveError && (
                      <span className="text-[10px] text-red-500" title={saveError}>Error</span>
                    )}
                  </div>
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-500 mt-2 text-right">{saveError}</p>
              )}
            </div>
          );
        })}
      </div>

      {pickedCount > 0 && pickedCount < totalGames && pickableCount > 0 && (
        <p className="text-center text-sm text-slate-400 mt-6">
          {totalGames - pickedCount} game{totalGames - pickedCount !== 1 ? "s" : ""} still need a pick
        </p>
      )}
      {pickedCount === totalGames && (
        <p className="text-center text-sm text-green-600 font-medium mt-6">
          ✓ All picks submitted — good luck!
        </p>
      )}
    </div>
  );
}

function TeamButton({ team, spread, prevSpread, moneyline, selected, locked, onClick }: {
  team: any;
  spread: number | null;
  prevSpread: number | null;
  moneyline: number | null;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg border-2 transition-colors text-sm font-medium disabled:cursor-default ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : locked
          ? "border-slate-100 text-slate-500"
          : "border-slate-200 hover:border-slate-300 text-slate-700"
      }`}
    >
      <span className="font-bold">{team?.abbreviation}</span>
      <span className="text-xs text-slate-500 hidden sm:block">{team?.city}</span>
      {spread !== null && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-semibold ${selected ? "text-blue-600" : "text-slate-500"}`}>
            {spread > 0 ? `+${spread}` : spread}
          </span>
          <SpreadMovement prev={prevSpread} curr={spread} />
        </div>
      )}
      {moneyline !== null && (
        <span className={`text-[10px] ${selected ? "text-blue-400" : "text-slate-400"}`}>
          ML {formatMl(moneyline)}
        </span>
      )}
    </button>
  );
}
