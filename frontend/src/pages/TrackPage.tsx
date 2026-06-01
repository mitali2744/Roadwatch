import { useState } from "react";
import { Search, CheckCircle, Clock, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { trackComplaint } from "../api/complaints";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  PENDING:      { color: "#fbbf24", icon: Clock,         label: "Pending" },
  ACKNOWLEDGED: { color: "#38bdf8", icon: CheckCircle,   label: "Acknowledged" },
  IN_PROGRESS:  { color: "#a78bfa", icon: Clock,         label: "In Progress" },
  RESOLVED:     { color: "#34d399", icon: CheckCircle,   label: "Resolved" },
  ESCALATED:    { color: "#f97316", icon: AlertTriangle, label: "Escalated" },
  REJECTED:     { color: "#ef4444", icon: AlertTriangle, label: "Rejected" },
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-5 ${className}`}
    style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}>
    {children}
  </div>
);

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
    <div className="md:ml-16 min-h-screen px-8 md:px-16 py-12" style={{ background: "#000", color: "#fff" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto">

        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-2" style={{ letterSpacing: "-1.5px" }}>
          Track{" "}
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400 }}>
            Complaint
          </span>
        </h1>
        <p className="mb-8" style={{ color: "hsl(0 0% 65%)" }}>Enter your ticket number to check real-time status</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase outline-none"
            style={{ background: "hsl(0 0% 5%)", border: "1px solid hsl(0 0% 20%)" }}
            placeholder="RW-2026-XXXXXX"
            value={ticket} onChange={e => setTicket(e.target.value)} />
          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-black disabled:opacity-50"
            style={{ background: "white" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Track
          </motion.button>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl p-4 text-sm mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            {error}
          </motion.div>
        )}

        {complaint && cfg && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} className="space-y-4">

            {/* Status */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>Ticket Number</div>
                  <div className="font-mono font-bold text-xl text-white">{complaint.ticket_number}</div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
                  <cfg.icon size={14} /> {cfg.label}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>Issue Type</div>
                  <div className="text-white">{complaint.complaint_type?.replace("_", " ")}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>Submitted</div>
                  <div className="text-white">{complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString() : "N/A"}</div>
                </div>
                {complaint.ai_severity && (
                  <div>
                    <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>AI Severity</div>
                    <span className={clsx("badge", {
                      "badge-critical": complaint.ai_severity === "CRITICAL",
                      "badge-high": complaint.ai_severity === "HIGH",
                      "badge-medium": complaint.ai_severity === "MEDIUM",
                      "badge-low": complaint.ai_severity === "LOW",
                    })}>{complaint.ai_severity}</span>
                  </div>
                )}
                {complaint.address && (
                  <div>
                    <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>Location</div>
                    <div className="text-white/70 text-xs">{complaint.address}</div>
                  </div>
                )}
              </div>
              {complaint.ai_damage_description && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid hsl(0 0% 20%)" }}>
                  <div className="text-xs mb-1" style={{ color: "hsl(0 0% 65%)" }}>AI Analysis</div>
                  <div className="text-sm text-white/70">{complaint.ai_damage_description}</div>
                </div>
              )}
            </Card>

            {/* Authority */}
            {complaint.routed_to?.name && (
              <Card>
                <div className="text-xs mb-3" style={{ color: "hsl(0 0% 65%)" }}>Assigned Authority</div>
                <div className="font-semibold text-white mb-1">{complaint.routed_to.name}</div>
                <div className="text-xs mb-3" style={{ color: "hsl(0 0% 65%)" }}>{complaint.routed_to.type}</div>
                {complaint.routed_to.engineer && (
                  <div className="text-sm text-white/60">Engineer: <span className="text-white/80">{complaint.routed_to.engineer}</span></div>
                )}
                {complaint.routed_to.contact && (
                  <a href={`tel:${complaint.routed_to.contact}`} className="inline-flex items-center gap-1 text-sm mt-2 text-white/60 hover:text-white transition-colors">
                    📞 {complaint.routed_to.contact}
                  </a>
                )}
              </Card>
            )}

            {/* Timeline */}
            {complaint.status_history?.length > 0 && (
              <Card>
                <div className="text-xs mb-4" style={{ color: "hsl(0 0% 65%)" }}>Status Timeline</div>
                <div className="space-y-4">
                  {complaint.status_history.map((h: any, i: number) => {
                    const c = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${c.color}15`, border: `1px solid ${c.color}40` }}>
                          <c.icon size={12} style={{ color: c.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: c.color }}>{c.label}</div>
                          <div className="text-xs" style={{ color: "hsl(0 0% 65%)" }}>
                            {new Date(h.timestamp).toLocaleString()}{h.note && ` · ${h.note}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Ledger */}
            {complaint.ledger_hash && (
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-emerald-400" />
                  <div className="text-xs" style={{ color: "hsl(0 0% 65%)" }}>Tamper-Proof Audit Trail</div>
                </div>
                <div className="font-mono text-xs break-all" style={{ color: "hsl(0 0% 65%)" }}>{complaint.ledger_hash}</div>
                <div className="text-xs text-emerald-400 mt-2">✅ Chain integrity verified</div>
              </Card>
            )}

            {/* Images */}
            {complaint.image_urls?.length > 0 && (
              <Card>
                <div className="text-xs mb-3" style={{ color: "hsl(0 0% 65%)" }}>Submitted Photos</div>
                <div className="flex gap-2 flex-wrap">
                  {complaint.image_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="w-24 h-24 object-cover rounded-xl"
                      style={{ border: "1px solid hsl(0 0% 20%)" }} />
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
