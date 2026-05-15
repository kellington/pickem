import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SetupProfile({ user }: { user: any }) {
  const [teamName, setTeamName] = useState("");
  const [initials, setInitials] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, initials }),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Set Up Your Team</h1>
        <p className="text-slate-500 mb-6">
          Welcome, {user?.displayName || user?.replitUsername}! Give your pick'em team a name and initials.
        </p>

        {error && <div className="bg-red-50 text-red-600 rounded p-3 mb-4 text-sm">{error}</div>}

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 mb-1 block">Team Name</span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. The Gridiron Gang"
            maxLength={40}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-slate-700 mb-1 block">Initials (2–4 characters)</span>
          <input
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            placeholder="e.g. GGG"
            maxLength={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        <button
          onClick={() => save.mutate()}
          disabled={!teamName.trim() || !initials.trim() || save.isPending}
          className="w-full bg-[#013369] hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {save.isPending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
