import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Map, MessageSquare, AlertTriangle, BarChart3, Search, Home, Wifi, WifiOff, Users, Shield } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePendingSync } from "../hooks/usePendingSync";
import ParticleBackground from "./ParticleBackground";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/report", icon: AlertTriangle, label: "Report" },
  { to: "/track", icon: Search, label: "Track" },
  { to: "/feed", icon: Users, label: "Feed" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
  { to: "/admin", icon: Shield, label: "Admin" },
];

export default function Layout() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncPending } = usePendingSync();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020817" }}>
      <ParticleBackground />

      {/* Top bar (hidden on home) */}
      {!isHome && (
        <header className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(56,189,248,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", boxShadow: "0 0 20px rgba(56,189,248,0.3)" }}>
              <span className="text-white font-bold text-xs">RW</span>
            </div>
            <div>
              <div className="font-semibold text-white text-sm leading-none">RoadWatch</div>
              <div className="text-xs" style={{ color: "rgba(56,189,248,0.7)" }}>Road Transparency Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={clsx("flex items-center gap-1.5 text-xs px-3 py-1 rounded-full glass",
              isOnline ? "text-emerald-400" : "text-red-400")}
              style={{ border: `1px solid ${isOnline ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}` }}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? "Online" : "Offline"}
            </div>
            {pendingCount > 0 && (
              <button onClick={syncPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full glass text-amber-400"
                style={{ border: "1px solid rgba(251,191,36,0.2)" }}>
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                {pendingCount} pending
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>

      {/* Bottom nav (mobile, hidden on home) */}
      {!isHome && (
        <nav className="glass md:hidden sticky bottom-0 z-50 px-1 py-2 flex justify-around"
          style={{ borderTop: "1px solid rgba(56,189,248,0.08)" }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all text-xs",
                isActive ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
              )}>
              {({ isActive }) => (
                <>
                  <div className={clsx("p-1 rounded-lg transition-all", isActive && "bg-sky-400/10")}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: "9px" }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Sidebar (desktop, hidden on home) */}
      {!isHome && (
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 flex-col items-center py-4 gap-1 z-40 pt-20"
          style={{ background: "rgba(5,5,10,0.97)", backdropFilter: "blur(16px)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} title={label}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-12 text-xs",
                isActive ? "text-sky-300" : "text-slate-400 hover:text-white"
              )}>
              {({ isActive }) => (
                <div className={clsx("p-2 rounded-xl transition-all", isActive && "bg-sky-400/10")}
                  style={isActive ? { boxShadow: "0 0 16px rgba(56,189,248,0.25)" } : {}}>
                  <Icon size={18} />
                </div>
              )}
            </NavLink>
          ))}
        </aside>
      )}
    </div>
  );
}
