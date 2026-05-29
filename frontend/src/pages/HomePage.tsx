import { Link } from "react-router-dom";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, Shield, TrendingDown, Zap, Globe, Mic
} from "lucide-react";

const features = [
  { icon: Map, title: "Live Road Map", desc: "View road conditions, complaints, and projects on an interactive map", to: "/map", color: "text-blue-400" },
  { icon: AlertTriangle, title: "Report Issue", desc: "Submit complaints with GPS + photo. AI scores severity automatically", to: "/report", color: "text-orange-400" },
  { icon: Search, title: "Track Complaint", desc: "Track your complaint status with tamper-proof audit trail", to: "/track", color: "text-purple-400" },
  { icon: BarChart3, title: "Transparency Dashboard", desc: "Budget vs spend, contractor scorecards, anomaly alerts", to: "/dashboard", color: "text-green-400" },
  { icon: MessageSquare, title: "AI Chatbot", desc: "Ask anything about roads, budgets, contractors in your language", to: "/chat", color: "text-cyan-400" },
];

const highlights = [
  { icon: Zap, title: "AI Severity Scoring", desc: "Computer vision classifies pothole severity from your photos" },
  { icon: TrendingDown, title: "Predictive Deterioration", desc: "ML model predicts which roads will fail in the next 90 days" },
  { icon: Shield, title: "Tamper-Proof Ledger", desc: "Every complaint action is recorded in an immutable audit chain" },
  { icon: Globe, title: "Works Globally", desc: "Supports India, USA, Europe and any country's road governance" },
  { icon: Mic, title: "Voice Accessibility", desc: "Full voice interaction for rural and low-literacy users" },
];

export default function HomePage() {
  return (
    <div className="md:ml-16 min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-brand-900/20 to-slate-950 px-6 py-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-800/10 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-900/40 border border-brand-800 text-brand-300 text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            Road Safety Hackathon 2026 — CoERS, IIT Madras
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Road Transparency<br />
            <span className="text-brand-400">Powered by AI</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Monitor road quality, track public spending, report issues, and hold authorities accountable — with full AI-powered transparency.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/map" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              <Map size={18} /> Explore Map
            </Link>
            <Link to="/report" className="btn-secondary flex items-center gap-2 text-base px-6 py-3">
              <AlertTriangle size={18} /> Report Issue
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-300 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, to, color }) => (
            <Link
              key={to}
              to={to}
              className="card hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
            >
              <div className={`${color} mb-3 group-hover:scale-110 transition-transform inline-block`}>
                <Icon size={24} />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-slate-500 text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Unique features */}
      <div className="px-4 py-8 max-w-4xl mx-auto border-t border-slate-800">
        <h2 className="text-lg font-semibold text-slate-300 mb-2">What Makes RoadWatch Unique</h2>
        <p className="text-slate-500 text-sm mb-6">Beyond the basics — features built for real impact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="text-brand-400 mt-0.5 shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Roads Monitored", value: "10,000+" },
            { label: "Complaints Resolved", value: "85%" },
            { label: "Budget Tracked", value: "₹500Cr+" },
            { label: "Countries Supported", value: "Global" },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <div className="text-2xl font-bold text-brand-400">{value}</div>
              <div className="text-slate-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
