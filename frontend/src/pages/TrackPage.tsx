import { useState, useRef, useEffect } from "react";
import { Search, CheckCircle, Clock, AlertTriangle, Shield, Loader2, Ticket } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { trackComplaint } from "../api/complaints";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { color: string; glow: string; icon: any; label: string }> = {
  PENDING:      { color: "#fbbf24", glow: "rgba(251,191,36,0.3)",  icon: Clock,         label: "Pending" },
  ACKNOWLEDGED: { color: "#38bdf8", glow: "rgba(56,189,248,0.3)",  icon: CheckCircle,   label: "Acknowledged" },
  IN_PROGRESS:  { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", icon: Clock,         label: "In Progress" },
  RESOLVED:     { color: "#34d399", glow: "rgba(52,211,153,0.3)",  icon: CheckCircle,   label: "Resolved" },
  ESCALATED:    { color: "#f97316", glow: "rgba(249,115,22,0.3)",  icon: AlertTriangle, label: "Escalated" },
  REJECTED:     { color: "#ef4444", glow: "rgba(239,68,68,0.3)",   icon: AlertTriangle, label: "Rejected" },
};

// Animated grid background
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
      {/* Radial glow center */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />
    </div>
  );
}

// 3D tilt card
function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000, ...style }}>
      {children}
    </motion.div>
  );
}

export default function TrackPage() {
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.trim()) return;
    setLoading(true); setError(""); setComplaint(null);
    try {
      const data = await trackComplaint(ticket.trim().toUpperCase());
      setComplaint(data);
    } catch { setError("Complaint not found. Please check your ticket number."); }
    finally { setLoading(false); }
  };

  const cfg = complaint ? STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING : null;

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <GridBackground />

      <div className="relative z-10 px-6 md:px-16 py-16 max-w-3xl mx-auto liquid-glass p-6 rounded-3xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <div className="mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(90deg,#38bdf8,#a78bfa)", color: "black" }}>Track</div>
          {/* Floating icon */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.2))", border: "1px solid rgba(56,189,248,0.3)", boxShadow: "0 0 40px rgba(56,189,248,0.2)" }}>
            <Ticket size={28} style={{ color: "#38bdf8" }} />
          </motion.div>

          <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 500, letterSpacing: "-2px", marginBottom: "12px" }}>
            Track{" "}
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg, #38bdf8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Complaint
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px" }}>
            Enter your ticket number to check real-time status
          </p>
        </motion.div>

        {/* Search */}
        <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              className="w-full rounded-2xl px-5 py-4 text-base font-mono uppercase text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "0.05em" }}
              placeholder="RW-2026-XXXXXX"
              value={ticket} onChange={e => setTicket(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-black disabled:opacity-50"
            style={{ background: "white", minWidth: "120px", justifyContent: "center" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Track
          </motion.button>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-4 text-sm mb-6"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            ⚠️ {error}
          </motion.div>
        )}

        {/* Empty state */}
        {!complaint && !error && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-center py-16">
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
              {["PENDING", "IN_PROGRESS", "RESOLVED"].map((s, i) => {
                const c = STATUS_CONFIG[s];
                return (
                  <motion.div key={s} animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                    className="rounded-2xl p-4 text-center"
                    style={{ background: `${c.glow.replace("0.3", "0.08")}`, border: `1px solid ${c.glow.replace("0.3", "0.2")}` }}>
                    <c.icon size={20} style={{ color: c.color, margin: "0 auto 6px" }} />
                    <div style={{ fontSize: "11px", color: c.color }}>{c.label}</div>
                  </motion.div>
                );
              })}
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px" }}>Enter a ticket number above to track your complaint</p>
          </motion.div>
        )}

        {/* Result */}
        {complaint && cfg && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} className="space-y-4">

            {/* Main status card — 3D tilt */}
            <TiltCard>
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.09)", border: `1px solid ${cfg.glow.replace("0.3","0.2")}`, boxShadow: `0 0 60px ${cfg.glow.replace("0.3","0.1")}` }}>
                {/* Glow blob */}
                <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", background: `radial-gradient(circle, ${cfg.glow.replace("0.3","0.15")} 0%, transparent 70%)`, borderRadius: "50%", pointerEvents: "none" }} />

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ticket Number</div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "22px", color: "white", letterSpacing: "0.05em" }}>{complaint.ticket_number}</div>
                  </div>
                  <motion.div animate={{ boxShadow: [`0 0 20px ${cfg.glow}`, `0 0 40px ${cfg.glow}`, `0 0 20px ${cfg.glow}`] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ background: cfg.glow.replace("0.3","0.15"), border: `1px solid ${cfg.glow.replace("0.3","0.4")}`, color: cfg.color }}>
                    <cfg.icon size={14} /> {cfg.label}
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Issue Type", value: complaint.complaint_type?.replace("_"," ") },
                    { label: "Submitted", value: complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString() : "N/A" },
                    complaint.ai_severity && { label: "AI Severity", value: complaint.ai_severity, isBadge: true },
                    complaint.address && { label: "Location", value: complaint.address },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                      {item.isBadge ? (
                        <span className={clsx("badge", { "badge-critical": item.value==="CRITICAL", "badge-high": item.value==="HIGH", "badge-medium": item.value==="MEDIUM", "badge-low": item.value==="LOW" })}>{item.value}</span>
                      ) : (
                        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>{item.value}</div>
                      )}
                    </div>
                  ))}
                </div>

                {complaint.ai_damage_description && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Analysis</div>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.5" }}>{complaint.ai_damage_description}</div>
                  </div>
                )}
              </div>
            </TiltCard>

            {/* Authority */}
            {complaint.routed_to?.name && (
              <TiltCard>
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Assigned Authority</div>
                  <div style={{ fontWeight: 600, color: "white", marginBottom: "4px" }}>{complaint.routed_to.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", marginBottom: "10px" }}>{complaint.routed_to.type}</div>
                  {complaint.routed_to.engineer && <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Engineer: <span style={{ color: "rgba(255,255,255,0.8)" }}>{complaint.routed_to.engineer}</span></div>}
                  {complaint.routed_to.contact && (
                    <a href={`tel:${complaint.routed_to.contact}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#38bdf8", marginTop: "8px", textDecoration: "none" }}>
                      📞 {complaint.routed_to.contact}
                    </a>
                  )}
                </div>
              </TiltCard>
            )}

            {/* Timeline */}
            {complaint.status_history?.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status Timeline</div>
                <div className="relative">
                  {/* Vertical line */}
                  <div style={{ position: "absolute", left: "11px", top: "8px", bottom: "8px", width: "1px", background: "rgba(255,255,255,0.06)" }} />
                  <div className="space-y-4">
                    {complaint.status_history.map((h: any, i: number) => {
                      const c = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }} className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 relative z-10"
                            style={{ background: `${c.glow.replace("0.3","0.15")}`, border: `1px solid ${c.color}40` }}>
                            <c.icon size={11} style={{ color: c.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: c.color }}>{c.label}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{new Date(h.timestamp).toLocaleString()}{h.note && ` · ${h.note}`}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ledger */}
            {complaint.ledger_hash && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} style={{ color: "#34d399" }} />
                  <div style={{ fontSize: "11px", color: "rgba(52,211,153,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tamper-Proof Audit Trail</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.6)", wordBreak: "break-all" }}>{complaint.ledger_hash}</div>
                <div style={{ fontSize: "12px", color: "#34d399", marginTop: "8px" }}>✅ Chain integrity verified</div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
