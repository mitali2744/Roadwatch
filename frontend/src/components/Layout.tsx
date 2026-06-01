import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Map, MessageSquare, AlertTriangle, BarChart3,
  Search, Home, Wifi, WifiOff
} from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePendingSync } from "../hooks/usePendingSync";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/map", icon: Map, label: "Map" },
  { to: "/report", icon: AlertTriangle, label: "Report" },
  { to: "/track", icon: Search, label: "Track" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
];

export default function Layout() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncPending } = usePendingSync();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">

      {/* Top bar — hidden on homepage (has its own cinematic nav) */}
      {!isHome && (
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RW</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">RoadWatch</h1>
              <p className="text-slate-500 text-xs">Road Transparency Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={clsx(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
              isOnline ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
            )}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? "Online" : "Offline"}
            </div>

            {pendingCount > 0 && (
              <button onClick={syncPending}
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 transition-colors">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                {pendingCount} pending sync
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile) — hidden on homepage */}
      {!isHome && (
        <nav className="bg-slate-900 border-t border-slate-800 px-2 py-2 flex justify-around md:hidden sticky bottom-0 z-50">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-xs",
                isActive ? "text-brand-400 bg-brand-900/30" : "text-slate-500 hover:text-slate-300"
              )}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      {/* Sidebar navigation (desktop) — hidden on homepage */}
      {!isHome && (
        <aside className="hidden md:flex fixed left-0 top-0 h-full w-16 bg-slate-900 border-r border-slate-800 flex-col items-center py-4 gap-2 z-40 pt-20">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"} title={label}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors w-12 text-xs",
                isActive ? "text-brand-400 bg-brand-900/30" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              )}>
              <Icon size={20} />
            </NavLink>
          ))}
        </aside>
      )}

    </div>
  );
}
