import { Link, useLocation } from "wouter";

export default function Nav({ me }: { me: any }) {
  const [location] = useLocation();

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
          <a
            href="/api/logout"
            className="text-blue-200 hover:text-white text-sm transition-colors"
          >
            Sign out
          </a>
        </div>
      </div>
    </nav>
  );
}
