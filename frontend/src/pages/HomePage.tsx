import { Link } from "react-router-dom";
import {
  Map, AlertTriangle, BarChart3, MessageSquare,
  Search, Shield, TrendingDown, Zap, Globe, Mic,
  ArrowRight, CheckCircle
} from "lucide-react";

const features = [
  { icon: Map, title: "Live Road Map", desc: "Interactive map with road conditions, complaint heatmap, and project markers", to: "/map", color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { icon: AlertTriangle, title: "Report Issue", desc: "Submit complaints with GPS + photo. AI scores severity automatically", to: "/report", color: "from-orange-500 to-red-500", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: Search, title: "Track Complaint", desc: "Real-time status with tamper-proof blockchain audit trail", to: "/track", color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10 border-purple-500/20" },
  { icon: BarChart3, title: "Dashboard", desc: "Budget transparency, contractor scorecards, anomaly detection", to: "/dashboard", color: "from-green-500 to-emerald-500", bg: "bg-green-500/10 border-green-500/20" },
  { icon: MessageSquare, title: "AI Assistant", desc: "Ask anything about roads, budgets, contractors in your language", to: "/chat", color: "from-cyan-500 to-blue-500", bg: "bg-cyan-500/10 border-cyan-500/20" },
];

const stats = [
  { value: "10K+", label: "Roads Monitored" },
  { value: "85%", label: "Complaints Resolved" },
  { value: "₹500Cr+", label: "Budget Tracked" },
  { value: "7+", label: "Languages" },
];

const innovations = [
  { icon: Zap, title: "AI Severity Scoring", desc: "CV model classifies pothole damage from photos" },
  { icon: TrendingDown, title: "Predictive ML", desc: "Forecasts road failures 90 days in advance" },
  { icon: Shield, title: "Tamper-Proof Ledger", desc: "SHA-256 hash chain audit trail" },
  { icon: Globe, title: "Global Ready", desc: "India, USA, Europe and beyond" },
  { icon: Mic, title: "Voice Accessible", desc: "Full voice interaction in 7+ languages" },
  { icon: CheckCircle, title: "Budget Anomaly AI", desc: "Flags suspicious government spending" },
];

export default function HomePage() {
  return (
    <div className="md:ml-16 min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-900/50 border border-brand-700/50 text-brand-300 text-xs px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Road Safety Hackathon 2026 · CoERS, IIT Madras
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
            Road Transparency<br />
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Monitor road quality, track public spending, report issues, and hold authorities accountable — with full AI-powered transparency.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/map" className="group flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-900/50 hover:shadow-brand-600/30">
              <Map size={20} /> Explore Map
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/report" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl transition-all border border-slate-700">
              <AlertTriangle size={20} /> Report Issue
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 text-center hover:border-slate-700 transition-colors">
              <div className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">{value}</div>
              <div className="text-slate-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Everything You Need</h2>
        <p className="text-slate-500 mb-6">One platform for complete road transparency</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, to, color, bg }) => (
            <Link key={to} to={to}
              className={`group relative overflow-hidden border rounded-2xl p-5 hover:scale-[1.02] transition-all ${bg}`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              <ArrowRight size={16} className="absolute bottom-4 right-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Innovations */}
      <div className="px-4 py-8 max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-1">What Makes RoadWatch Unique</h2>
          <p className="text-slate-500 text-sm mb-6">9 innovative features beyond the basics</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {innovations.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-900/50 border border-brand-800/50 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-brand-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{title}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
