import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Dog } from "lucide-react";

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

function isGameLocked(game: any): boolean {
  if (["final", "in_progress"].includes(game.gameResult?.status)) return true;
  const cutoff = game.pickCutoffAtUtc ?? game.kickoffAtUtc;
  return !cutoff || new Date(cutoff) <= new Date();
}

type DraftPick = { teamId: string; confidence: number | null };

export default function WeekPicks() {
  const { weekId } = useParams<{ weekId: string }>();
  const queryClient = useQueryClient();

  const [draftPicks, setDraftPicks] = useState<Record<string, DraftPick>>({});
  const [savingGames, setSavingGames] = useState<Set<string>>(new Set());
  const [savedGames, setSavedGames] = useState<Set<string>>(new Set());
  const [errorGames, setErrorGames] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const initialized = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/weeks", weekId, "games"],
    queryFn: () => fetchWeekData(weekId!),
    enabled: !!weekId,
    refetchInterval: 30000,
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
    mutationFn: async ({ gameId, selectedTeamId, confidenceValue }: { gameId: string; selectedTeamId: string; confidenceValue: number | null }) => {
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
      const updated = { ...prev, [gameId]: { teamId, confidence: prev[gameId]?.confidence ?? null } };
      const confidence = updated[gameId].confidence;
      if (confidence) {
        triggerSave(gameId, teamId, confidence);
      }
      return updated;
    });
  };

  const handleConfidenceChange = (gameId: string, confidence: number | null) => {
    const currentPick = draftPicks[gameId];
    const conflictingEntry = confidence === null
      ? undefined
      : Object.entries(draftPicks).find(
          ([otherGameId, pick]) => otherGameId !== gameId && pick.confidence === confidence
        );

    if (conflictingEntry) {
      const [conflictingGameId] = conflictingEntry;
      const conflictingGame = data?.games?.find((game: any) => game.id === conflictingGameId);
      if (conflictingGame && isGameLocked(conflictingGame)) {
        setErrorGames((errors) => ({
          ...errors,
          [gameId]: "That confidence point belongs to a locked game",
        }));
        return;
      }
    }

    const updated = { ...draftPicks };
    if (conflictingEntry) {
      const [conflictingGameId, conflictingPick] = conflictingEntry;
      updated[conflictingGameId] = { ...conflictingPick, confidence: null };
    }

    updated[gameId] = {
      teamId: currentPick?.teamId || "",
      confidence,
    };
    setDraftPicks(updated);

    if (currentPick?.teamId) {
      triggerSave(gameId, currentPick.teamId, confidence);
    }
  };

  const triggerSave = (gameId: string, selectedTeamId: string, confidenceValue: number | null) => {
    setSavingGames((s) => new Set([...s, gameId]));
    savePick.mutate({ gameId, selectedTeamId, confidenceValue });
  };

  const getUnpickedOpenGames = (currentDraft: Record<string, DraftPick>, gameList: any[]) => {
    const now = new Date();
    return gameList.filter((g: any) => {
      const completed = ["final", "in_progress"].includes(g.gameResult?.status);
      const cutoffTime = g.pickCutoffAtUtc ?? g.kickoffAtUtc;
      const cutoffPassed = cutoffTime ? new Date(cutoffTime) <= now : true;
      const locked = completed || cutoffPassed;
      const alreadyPicked = currentDraft[g.id]?.teamId && currentDraft[g.id]?.confidence > 0;
      return !locked && !alreadyPicked;
    });
  };

  const getAvailableConfidence = (currentDraft: Record<string, DraftPick>, total: number) => {
    const used = new Set(Object.values(currentDraft).filter((p) => p.confidence > 0).map((p) => p.confidence));
    return Array.from({ length: total }, (_, i) => i + 1).filter((n) => !used.has(n));
  };

  const handleFavorites = () => {
    const gameList = data?.games || [];
    const total = gameList.length;
    const unpicked = getUnpickedOpenGames(draftPicks, gameList);
    const available = getAvailableConfidence(draftPicks, total);

    const gamesWithFav = unpicked.map((g: any) => {
      const spread = g.gameOdds?.spread ?? null;
      let favoredTeamId: string;
      let absSpread: number;
      if (spread === null) {
        favoredTeamId = Math.random() < 0.5 ? g.homeTeamId : g.awayTeamId;
        absSpread = 0;
      } else if (spread <= 0) {
        favoredTeamId = g.homeTeamId;
        absSpread = Math.abs(spread);
      } else {
        favoredTeamId = g.awayTeamId;
        absSpread = spread;
      }
      return { game: g, favoredTeamId, absSpread };
    });

    gamesWithFav.sort((a, b) => b.absSpread - a.absSpread);
    const sortedConf = [...available].sort((a, b) => b - a);

    const newPicks = { ...draftPicks };
    const toSave: Array<{ gameId: string; teamId: string; confidence: number }> = [];
    gamesWithFav.forEach((item, i) => {
      const confidence = sortedConf[i];
      if (confidence) {
        newPicks[item.game.id] = { teamId: item.favoredTeamId, confidence };
        toSave.push({ gameId: item.game.id, teamId: item.favoredTeamId, confidence });
      }
    });
    setDraftPicks(newPicks);
    toSave.forEach(({ gameId, teamId, confidence }) => triggerSave(gameId, teamId, confidence));
  };

  const handleUpsets = () => {
    const gameList = data?.games || [];
    const total = gameList.length;
    const unpicked = getUnpickedOpenGames(draftPicks, gameList);
    const available = getAvailableConfidence(draftPicks, total);

    const gamesWithUnderdog = unpicked.map((g: any) => {
      const spread = g.gameOdds?.spread ?? null;
      let underdogTeamId: string;
      let absSpread: number;
      if (spread === null) {
        underdogTeamId = Math.random() < 0.5 ? g.homeTeamId : g.awayTeamId;
        absSpread = 0;
      } else if (spread <= 0) {
        underdogTeamId = g.awayTeamId;
        absSpread = Math.abs(spread);
      } else {
        underdogTeamId = g.homeTeamId;
        absSpread = spread;
      }
      return { game: g, underdogTeamId, absSpread };
    });

    gamesWithUnderdog.sort((a, b) => b.absSpread - a.absSpread);
    const sortedConf = [...available].sort((a, b) => b - a);

    const newPicks = { ...draftPicks };
    const toSave: Array<{ gameId: string; teamId: string; confidence: number }> = [];
    gamesWithUnderdog.forEach((item, i) => {
      const confidence = sortedConf[i];
      if (confidence) {
        newPicks[item.game.id] = { teamId: item.underdogTeamId, confidence };
        toSave.push({ gameId: item.game.id, teamId: item.underdogTeamId, confidence });
      }
    });
    setDraftPicks(newPicks);
    toSave.forEach(({ gameId, teamId, confidence }) => triggerSave(gameId, teamId, confidence));
  };

  const handleRandom = () => {
    const gameList = data?.games || [];
    const total = gameList.length;
    const unpicked = getUnpickedOpenGames(draftPicks, gameList);
    const available = getAvailableConfidence(draftPicks, total);

    const shuffledConf = [...available].sort(() => Math.random() - 0.5);

    const newPicks = { ...draftPicks };
    const toSave: Array<{ gameId: string; teamId: string; confidence: number }> = [];
    unpicked.forEach((g: any, i) => {
      const teamId = Math.random() < 0.5 ? g.homeTeamId : g.awayTeamId;
      const confidence = shuffledConf[i];
      if (confidence) {
        newPicks[g.id] = { teamId, confidence };
        toSave.push({ gameId: g.id, teamId, confidence });
      }
    });
    setDraftPicks(newPicks);
    toSave.forEach(({ gameId, teamId, confidence }) => triggerSave(gameId, teamId, confidence));
  };

  const handleClearConfirmed = async () => {
    setClearing(true);
    setConfirmClear(false);
    try {
      const res = await fetch(`/api/weeks/${weekId}/picks`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to clear");

      const gameList = data?.games || [];
      const now = new Date();
      const openGameIds = new Set(
        gameList
          .filter((g: any) => !["final", "in_progress"].includes(g.gameResult?.status ?? ""))
          .filter((g: any) => {
            const cutoffTime = g.pickCutoffAtUtc ?? g.kickoffAtUtc;
            return cutoffTime ? new Date(cutoffTime) > now : false;
          })
          .map((g: any) => g.id)
      );

      setDraftPicks((prev) => {
        const next = { ...prev };
        for (const id of openGameIds) delete next[id];
        return next;
      });
      setSavingGames(new Set());
      setSavedGames(new Set());
      setErrorGames({});
      queryClient.invalidateQueries({ queryKey: ["/api/weeks", weekId, "games"] });
    } catch {
    } finally {
      setClearing(false);
    }
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

  const teamOdds = games.flatMap((game: any) => {
    const spread = game.gameOdds?.spread;
    if (typeof spread !== "number") return [];
    return [
      { teamId: game.awayTeamId, spread: -spread },
      { teamId: game.homeTeamId, spread },
    ];
  }).sort((a, b) => a.spread - b.spread);

  const bestOddsTeamIds = new Set(teamOdds.slice(0, 3).map(({ teamId }) => teamId));
  const worstOddsTeamIds = new Set(teamOdds.slice(-3).map(({ teamId }) => teamId));

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
      <p className="text-slate-500 text-sm mb-4">
        Assign each confidence value (1–{totalGames}) once. Higher = more confident. Picks save automatically.
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-2 border-green-500" aria-hidden="true" />
          Top 3 odds
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border-2 border-red-500" aria-hidden="true" />
          Bottom 3 odds
        </span>
        <span className="text-slate-400">Based on point spread</span>
      </div>

      {pickedCount === totalGames && (
        <p className="text-center text-sm text-green-600 font-medium mb-5">
          ✓ All picks submitted — good luck!
        </p>
      )}

      {pickableCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <button
            onClick={handleFavorites}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
            title="Auto-pick the spread favorite in each game, highest confidence to biggest favorite"
          >
            ⭐ Pick Favorites
          </button>
          <button
            onClick={handleUpsets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium hover:bg-rose-100 transition-colors"
            title="Auto-pick the biggest underdogs first, highest confidence to biggest upset"
          >
            <Dog size={16} aria-hidden="true" />
            Pick Upsets
          </button>
          <button
            onClick={handleRandom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-sm font-medium hover:bg-purple-100 transition-colors"
            title="Randomly pick a winner and assign remaining confidence values"
          >
            🎲 Pick Random
          </button>

          {pickedCount > 0 && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 ml-auto"
              title="Remove all open picks for this week"
            >
              {clearing ? "Clearing…" : "🗑️ Clear All"}
            </button>
          )}

          {confirmClear && (
            <div className="ml-auto flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-sm text-red-700 font-medium">Clear all picks?</span>
              <button
                onClick={handleClearConfirmed}
                className="px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {games.map((game: any) => {
          const completed = ["final", "in_progress"].includes(game.gameResult?.status);
          const cutoffTime = game.pickCutoffAtUtc ?? game.kickoffAtUtc;
          const cutoffPassed = cutoffTime ? new Date(cutoffTime) <= now : true;
          const locked = completed || cutoffPassed;

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
                  isWinner={game.gameResult?.status === "final" && game.gameResult?.winningTeamId === game.awayTeamId}
                  pickStats={data?.teamPickStats?.[game.awayTeamId]}
                  oddsHighlight={
                    bestOddsTeamIds.has(game.awayTeamId)
                      ? "best"
                      : worstOddsTeamIds.has(game.awayTeamId)
                      ? "worst"
                      : null
                  }
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
                  isWinner={game.gameResult?.status === "final" && game.gameResult?.winningTeamId === game.homeTeamId}
                  pickStats={data?.teamPickStats?.[game.homeTeamId]}
                  oddsHighlight={
                    bestOddsTeamIds.has(game.homeTeamId)
                      ? "best"
                      : worstOddsTeamIds.has(game.homeTeamId)
                      ? "worst"
                      : null
                  }
                  onClick={() => !locked && handleTeamClick(game.id, game.homeTeamId)}
                />

                <div className="ml-auto shrink-0 flex flex-col items-end gap-1">
                  <select
                    disabled={locked}
                    value={draft?.confidence || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleConfidenceChange(game.id, value === "" ? null : parseInt(value, 10));
                    }}
                    className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 bg-white"
                  >
                    <option value="">—</option>
                    {Array.from({ length: totalGames }, (_, i) => i + 1).map((n) => (
                      <option
                        key={n}
                        value={n}
                        className={
                          draft?.confidence === n
                            ? "font-semibold text-blue-700"
                            : usedConfidence.has(n)
                            ? "font-normal text-slate-400"
                            : "font-bold text-slate-800"
                        }
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

function TeamButton({ team, spread, prevSpread, moneyline, selected, locked, isWinner, oddsHighlight, pickStats, onClick }: {
  team: any;
  spread: number | null;
  prevSpread: number | null;
  moneyline: number | null;
  selected: boolean;
  locked: boolean;
  isWinner: boolean;
  oddsHighlight: "best" | "worst" | null;
  pickStats?: { pickCount: number; averageConfidence: number };
  onClick: () => void;
}) {
  const oddsRing = oddsHighlight === "best"
    ? "ring-2 ring-green-500 ring-offset-1"
    : oddsHighlight === "worst"
    ? "ring-2 ring-red-500 ring-offset-1"
    : "";

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`flex-1 flex flex-col items-center py-2 px-3 rounded-lg border-2 transition-colors text-sm font-medium disabled:cursor-default ${oddsRing} ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-800"
          : locked
          ? "border-slate-100 text-slate-500"
          : "border-slate-200 hover:border-slate-300 text-slate-700"
      }`}
    >
      <span className={isWinner ? "font-bold text-green-600" : "font-bold"}>{team?.abbreviation}</span>
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
      <div className={`w-full mt-1.5 pt-1.5 border-t ${selected ? "border-blue-200" : "border-slate-100"}`}>
        <div className="grid grid-cols-2 gap-2 text-center text-[10px] leading-tight">
          <div>
            <span className="block font-bold text-slate-700">{pickStats?.pickCount ?? 0}</span>
            <span className="text-slate-400">players</span>
          </div>
          <div>
            <span className="block font-bold text-slate-700">
              {(pickStats?.averageConfidence ?? 0).toFixed(1)}
            </span>
            <span className="text-slate-400">avg conf</span>
          </div>
        </div>
      </div>
    </button>
  );
}
