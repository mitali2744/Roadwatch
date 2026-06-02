import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPublicFeed, getComplaintDetail } from "../api/feed";
import { AlertTriangle, CheckCircle, Clock, ChevronRight, X, MapPin, Shield, RefreshCw, Users } from "lucide-react";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { color: string; glow: string; icon: any; label: string }> = {
  PENDING:      { color: "#fbbf24", glow: "rgba(251,191,36,0.2)",  icon: Clock,         label: "Pending" },
  ACKNOWLEDGED: { color: "#38bdf8", glow: "rgba(56,189,248,0.2)",  icon: CheckCircle,   label: "Acknowledged" },
  IN_PROGRESS:  { color: "#a78bfa", glow: "rgba(167,139,250,0.2)", icon: Clock,         label: "In Progress" },
  RESOLVED:     { color: "#34d399", glow: "rgba(52,211,153,0.2)",  icon: CheckCircle,   label: "Resolved" },
  ESCALATED:    { color: "#f97316", glow: "rgba(249,115,22,0.2)",  icon: AlertTriangle, label: "Escalated" },
  REJECTED:     { color: "#ef4444", glow: "rgba(239,68,68,0.2)",   icon: AlertTriangle, label: "Rejected" },
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#fbbf24", LOW: "#34d399"
};

function ProgressBar({ value }: { value: number }) {
  const color = value === 100 ? "#34d399" : value >= 50 ? "#a78bfa" : value > 0 ? "#38bdf8" : "rgba(255,255,255,0.1)";
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "easeOut" }}
        style={{ height: "100%", background: color, borderRadius: "9999px", boxShadow: `0 0 8px ${color}` }} />
    </div>
  );
}

function ComplaintCard({ complaint, onClick }: { complaint: any; onClick: () => void }) {
  const rawStatus = (complaint.status||"").replace("ComplaintStatus.","");
  const cfg = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.PENDING;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 8px 40px ${cfg.glow}` }}
      onClick={onClick} className="rounded-2xl p-5 cursor-pointer transition-all"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.07)` }}>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
            {complaint.ticket_number}
          </span>
          {complaint.ai_severity && (
            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "9999px", background: `${SEVERITY_COLORS[complaint.ai_severity]}18`, border: `1px solid ${SEVERITY_COLORS[complaint.ai_severity]}40`, color: SEVERITY_COLORS[complaint.ai_severity] }}>
              {complaint.ai_severity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: cfg.glow.replace("0.2","0.1"), border: `1px solid ${cfg.glow.replace("0.2","0.3")}`, color: cfg.color }}>
          <cfg.icon size={11} /> {cfg.label}
        </div>
      </div>

      <div className="font-semibold text-white mb-1 text-base">
        {(complaint.complaint_type||"").replace("ComplaintType.","").replace("_"," ")}
      </div>
      {complaint.address && (
        <div className="flex items-center gap-1 mb-3" style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
          <MapPin size={11} /> {complaint.address}
        </div>
      )}
      {complaint.description && (
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.4", marginBottom: "12px" }}>
          {complaint.description.slice(0, 100)}{complaint.description.length > 100 ? "..." : ""}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Work Progress</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: complaint.work_progress === 100 ? "#34d399" : "rgba(255,255,255,0.5)" }}>
            {complaint.work_progress || 0}%
          </span>
        </div>
        <ProgressBar value={complaint.work_progress || 0} />
      </div>

      <div className="flex items-center justify-between mt-3">
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
          {complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString() : ""}
        </span>
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
    </motion.div>
  );
}

function ComplaintModal({ ticket, onClose }: { ticket: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplaintDetail(ticket).then(setDetail).finally(() => setLoading(false));
  }, [ticket]);

  const cfg = detail ? STATUS_CONFIG[detail.status] || STATUS_CONFIG.PENDING : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}>

        <div className="flex items-center justify-between mb-5">
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "white", fontSize: "16px" }}>{ticket}</span>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <X size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
          </div>
        ) : detail && cfg ? (
          <div className="space-y-4">
            {/* Status + severity */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: cfg.glow.replace("0.2","0.12"), border: `1px solid ${cfg.glow.replace("0.2","0.3")}`, color: cfg.color }}>
                <cfg.icon size={13} /> {cfg.label}
              </div>
              {detail.ai_severity && (
                <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "9999px", background: `${SEVERITY_COLORS[detail.ai_severity]}15`, border: `1px solid ${SEVERITY_COLORS[detail.ai_severity]}40`, color: SEVERITY_COLORS[detail.ai_severity] }}>
                  {detail.ai_severity} severity
                </span>
              )}
            </div>

            {/* Type + description */}
            <div>
              <div style={{ fontWeight: 700, color: "white", fontSize: "18px", marginBottom: "6px" }}>
                {detail.complaint_type?.replace("_", " ")}
              </div>
              {detail.address && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", marginBottom: "8px" }}>📍 {detail.address}</div>}
              {detail.description && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.5" }}>{detail.description}</p>}
            </div>

            {/* AI analysis */}
            {detail.ai_damage_description && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analysis</div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>{detail.ai_damage_description}</p>
              </div>
            )}

            {/* Work progress */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Work Progress</div>
                <span style={{ fontSize: "20px", fontWeight: 700, color: detail.work_progress === 100 ? "#34d399" : "white" }}>
                  {detail.work_progress || 0}%
                </span>
              </div>
              <ProgressBar value={detail.work_progress || 0} />

              {/* Work updates timeline */}
              {detail.work_updates?.length > 0 && (
                <div className="mt-4 space-y-3">
                  {detail.work_updates.map((u: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>
                        {u.progress}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{u.note || "Work update"}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                          {u.actor} · {new Date(u.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Authority */}
            {detail.routed_to?.name && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Assigned Authority</div>
                <div style={{ fontWeight: 600, color: "white" }}>{detail.routed_to.name}</div>
                {detail.routed_to.engineer && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Engineer: {detail.routed_to.engineer}</div>}
              </div>
            )}

            {/* Images */}
            {detail.image_urls?.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Photos</div>
                <div className="flex gap-2 flex-wrap">
                  {detail.image_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-24 h-24 object-cover rounded-xl"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
              </div>
            )}

            {/* Ledger */}
            {detail.ledger_hash && (
              <div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={12} style={{ color: "#34d399" }} />
                  <span style={{ fontSize: "11px", color: "rgba(52,211,153,0.7)" }}>Tamper-Proof Audit Trail</span>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", wordBreak: "break-all" }}>{detail.ledger_hash}</div>
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

export default function FeedPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const loadFeed = async (p = 1, s = "") => {
    setLoading(true);
    try {
      const data = await getPublicFeed(p, s || undefined);
      setComplaints(data.complaints);
      setTotal(data.total);
    } catch { setComplaints([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFeed(page, filter); }, [page, filter]);

  const statusFilters = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
  ];

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse, rgba(56,189,248,0.04) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 px-6 md:px-12 py-12 max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", boxShadow: "0 0 20px rgba(56,189,248,0.15)" }}>
              <Users size={18} style={{ color: "#38bdf8" }} />
            </motion.div>
            <div>
              <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 500, letterSpacing: "-1.5px" }}>
                Public{" "}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#38bdf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Complaints Feed
                </span>
              </h1>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>
            {total} complaints reported · All work progress is publicly visible
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {statusFilters.map(({ value, label }) => (
            <button key={value} onClick={() => { setFilter(value); setPage(1); }}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{
                background: filter === value ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === value ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: filter === value ? "#38bdf8" : "rgba(255,255,255,0.4)",
              }}>
              {label}
            </button>
          ))}
          <button onClick={() => loadFeed(page, filter)}
            className="ml-auto px-3 py-2 rounded-full text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.2)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
            <p>No complaints yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c, i) => (
              <ComplaintCard key={c.ticket_number} complaint={c}
                onClick={() => setSelectedTicket(c.ticket_number)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-3 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-5 py-2 rounded-xl text-sm disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}>
              Previous
            </button>
            <span style={{ padding: "8px 16px", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
              className="px-5 py-2 rounded-xl text-sm disabled:opacity-30"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedTicket && (
          <ComplaintModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
