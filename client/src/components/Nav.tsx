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

export default function Nav({ me }: { me: any }) {
  const [location] = useLocation();
  const [showIdea, setShowIdea] = useState(false);

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
          <div className="flex items-center gap-3">
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
            <a
              href="/api/logout"
              className="text-blue-200 hover:text-white text-sm transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </nav>
      {showIdea && <IdeaModal onClose={() => setShowIdea(false)} />}
    </>
  );
}
