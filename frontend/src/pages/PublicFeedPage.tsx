import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, Clock, CheckCircle, Eye } from "lucide-react";
import clsx from "clsx";

interface Complaint {
  id: string;
  ticket_number: string;
  type: string;
  status: string;
  severity: string;
  address: string;
  progress_percentage: number;
  assigned_contractor: string | null;
  image_urls: string[];
  submitted_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; icon: any }> = {
  PENDING: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", icon: Clock },
  IN_PROGRESS: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", icon: Clock },
  RESOLVED: { color: "#34d399", bg: "rgba(52,211,153,0.1)", icon: CheckCircle },
  ESCALATED: { color: "#f97316", bg: "rgba(249,115,22,0.1)", icon: AlertTriangle },
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "#34d399",
  MEDIUM: "#fbbf24",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export default function PublicFeedPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, severityFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status_filter", statusFilter);
      if (severityFilter) params.append("severity_filter", severityFilter);
      
      const response = await fetch(`/api/complaints/public/feed?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c =>
    c.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "1000px", height: "500px", background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 px-6 md:px-12 py-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-12">
          <div className="mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(90deg,#38bdf8,#a78bfa)", color: "black" }}>
            Public Feed
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "8px" }}>
            All{" "}
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Road Complaints
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "15px" }}>Track all reported issues and their resolution progress in real-time</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* Search */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by ticket or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl px-5 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <Search size={16} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter || ""}
            onChange={e => setStatusFilter(e.target.value || null)}
            className="rounded-2xl px-5 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter || ""}
            onChange={e => setSeverityFilter(e.target.value || null)}
            className="rounded-2xl px-5 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <option value="">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </motion.div>

        {/* Complaints Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: "#38bdf8" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "rgba(255,255,255,0.3)" }}>
            No complaints found
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((complaint, i) => {
              const statusCfg = STATUS_COLORS[complaint.status] || STATUS_COLORS.PENDING;
              const severityColor = SEVERITY_COLORS[complaint.severity] || "#94a3b8";
              
              return (
                <motion.a
                  key={complaint.id}
                  href={`/complaint/${complaint.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-6 cursor-pointer transition-all hover:scale-102"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                        Ticket
                      </div>
                      <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "16px", color: "white" }}>
                        {complaint.ticket_number}
                      </div>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      {complaint.status}
                    </div>
                  </div>

                  {/* Type & Severity */}
                  <div className="flex items-center gap-4 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {complaint.type}
                    </span>
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ background: `${severityColor}15`, color: severityColor }}
                    >
                      {complaint.severity}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                      📍 {complaint.address || "Location not specified"}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                        Progress
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>
                        {complaint.progress_percentage}%
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${complaint.progress_percentage}%` }}
                        transition={{ duration: 1 }}
                        style={{
                          height: "100%",
                          background: `linear-gradient(90deg, #38bdf8, #a78bfa)`,
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Contractor & CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      {complaint.assigned_contractor ? `🔧 ${complaint.assigned_contractor}` : "Unassigned"}
                    </div>
                    <Eye size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
