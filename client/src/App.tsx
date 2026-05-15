import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Landing from "./pages/Landing.tsx";
import Home from "./pages/Home.tsx";
import WeekPicks from "./pages/WeekPicks.tsx";
import GroupPicks from "./pages/GroupPicks.tsx";
import Standings from "./pages/Standings.tsx";
import SetupProfile from "./pages/SetupProfile.tsx";
import Nav from "./components/Nav.tsx";

async function fetchMe() {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export default function App() {
  const { data: me, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: fetchMe,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!me) {
    return <Landing />;
  }

  if (!me.profile) {
    return <SetupProfile user={me.user} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav me={me} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/picks/:weekId" component={WeekPicks} />
          <Route path="/group/:weekId" component={GroupPicks} />
          <Route path="/standings/:seasonId" component={Standings} />
          <Route>
            <div className="text-center py-16 text-slate-500">Page not found</div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
