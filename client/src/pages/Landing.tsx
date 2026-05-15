export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#013369] to-[#1a4a8a] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">🏈</div>
        <h1 className="text-5xl font-bold text-white mb-4">NFL Pick'em</h1>
        <p className="text-blue-200 text-lg mb-8">
          Private confidence pick'em league for the crew. Pick winners, assign confidence points, and compete for weekly and season glory.
        </p>
        <a
          href="/api/login"
          className="inline-block bg-[#d50a0a] hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg transition-colors"
        >
          Sign in with Replit
        </a>
        <p className="text-blue-300 text-sm mt-4">
          Private league — only approved members can access
        </p>
      </div>
    </div>
  );
}
