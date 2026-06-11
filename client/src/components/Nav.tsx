import { Link, useLocation } from "wouter";
import { useState } from "react";

function IdeaModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const submit = async () => {
    if (!text.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feature-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        {status === "done" ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">💡</div>
            <div className="text-lg font-bold text-gray-800 mb-1">Thanks for the idea!</div>
            <div className="text-sm text-gray-500 mb-5">It's been saved and Rob will check it out.</div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#013369] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">💡 Got an idea?</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Feature request, rule change, mini-game — anything goes. Rob reads every one.
            </p>
            <textarea
              autoFocus
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="What's your idea?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={status === "submitting"}
            />
            {status === "error" && (
              <p className="text-xs text-red-600 mt-1">Something went wrong — please try again.</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || status === "submitting"}
                className="px-5 py-2 bg-[#013369] text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {status === "submitting" ? "Sending…" : "Send idea"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type IdeaRow = {
  id: string;
  ideaText: string;
  submittedAt: string;
  displayName: string | null;
  replitUsername: string | null;
};

function IdeasListModal({ onClose }: { onClose: () => void }) {
  const [ideas, setIdeas] = useState<IdeaRow[] | null>(null);
  const [error, setError] = useState(false);

  useState(() => {
    fetch("/api/feature-ideas")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setIdeas)
      .catch(() => setError(true));
  });

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "80vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">💡 All submitted ideas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && (
            <p className="text-sm text-red-600">Failed to load ideas.</p>
          )}
          {!ideas && !error && (
            <p className="text-sm text-gray-400">Loading…</p>
          )}
          {ideas && ideas.length === 0 && (
            <p className="text-sm text-gray-500">No ideas submitted yet — be the first!</p>
          )}
          {ideas && ideas.length > 0 && (
            <div className="flex flex-col gap-3">
              {ideas.map((idea) => (
                <div key={idea.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{idea.ideaText}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium text-gray-600">
                      {idea.displayName || idea.replitUsername || "Unknown"}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{fmt(idea.submittedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex-shrink-0 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {ideas ? `${ideas.length} idea${ideas.length !== 1 ? "s" : ""}` : ""}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#013369] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Nav({ me }: { me: any }) {
  const [location] = useLocation();
  const [showIdea, setShowIdea] = useState(false);
  const [showList, setShowList] = useState(false);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
        location.startsWith(href) && href !== "/"
          ? "bg-white text-blue-700 shadow-sm"
          : location === "/" && href === "/"
          ? "bg-white text-blue-700 shadow-sm"
          : "text-blue-100 hover:text-white hover:bg-blue-700"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <nav className="bg-[#013369] shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-lg mr-4">🏈 Pick'em</span>
            {navLink("/", "Home")}
          </div>
          <div className="flex items-center gap-2">
            {me?.profile && (
              <span className="text-blue-200 text-sm hidden sm:block">
                {me.profile.teamName}
              </span>
            )}
            <button
              onClick={() => setShowIdea(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition-colors"
            >
              💡 I have an idea!
            </button>
            <button
              onClick={() => setShowList(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Show me all the ideas
            </button>
            <a
              href="/status"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              📊 Project Status
            </a>
            <a
              href="/api/logout"
              className="text-blue-200 hover:text-white text-sm transition-colors ml-1"
            >
              Sign out
            </a>
          </div>
        </div>
      </nav>
      {showIdea && <IdeaModal onClose={() => setShowIdea(false)} />}
      {showList && <IdeasListModal onClose={() => setShowList(false)} />}
    </>
  );
}
