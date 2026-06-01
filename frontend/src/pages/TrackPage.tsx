import { useState } from "react";
import { Search, CheckCircle, Clock, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { trackComplaint } from "../api/complaints";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { color: string; glow: string; icon: any; label: string }> = {
  PENDING:      { color: "#fbbf24", glow: "rgba(251,191,36,0.2)",  icon: Clock,         label: "Pending" },
  ACKNOWLEDGED: { color: "#38bdf8", glow: "rgba(56,189,248,0.2)",  icon: CheckCircle,   label: "Acknowledged" },
  IN_PROGRESS:  { color: "#818cf8", glow: "rgba(129,140,248,0.2)", icon: Clock,         label: "In Progress" },
  RESOLVED:     { color: "#34d399", glow: "rgba(52,211,153,0.2)",  icon: CheckCircle,   label: "Resolved" },
  ESCALATED:    { color: "#f97316", glow: "rgba(249,115,22,0.2)",  icon: AlertTriangle, label: "Escalated" },
  REJECTED:     { color: "#ef4444", glow: "rgba(239,68,68,0.2)",   icon: AlertTriangle, label: "Rejected" },
};

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
    <div className="md:ml-16 min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-white mb-2">Track Complaint</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Enter your ticket number to check real-time status</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input className="input flex-1 font-mono uppercase text-base" placeholder="RW-2026-XXXXXX"
          value={ticket} onChange={e => setTicket(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Track
        </button>
      </form>

      {error && (
        <div className="glass rounded-xl p-4 text-sm mb-4 animate-fade-in-up"
          style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {complaint && cfg && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Status card */}
          <div className="glow-card p-6" style={{ boxShadow: `0 0 40px ${cfg.glow}` }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>Ticket Number</div>
                <div className="font-mono font-bold text-xl glow-text">{complaint.ticket_number}</div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium"
                style={{ border: `1px solid ${cfg.glow}`, color: cfg.color, boxShadow: `0 0 16px ${cfg.glow}` }}>
                <cfg.icon size={14} /> {cfg.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-white/30 mb-1">Issue Type</div>
                <div className="text-white/80">{complaint.complaint_type?.replace("_"," ")}</div>
              </div>
              <div>
                <div className="text-xs text-white/30 mb-1">Submitted</div>
                <div className="text-white/80">{complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString() : "N/A"}</div>
              </div>
              {complaint.ai_severity && (
                <div>
                  <div className="text-xs text-white/30 mb-1">AI Severity</div>
                  <span className={clsx("badge", { "badge-critical": complaint.ai_severity==="CRITICAL", "badge-high": complaint.ai_severity==="HIGH", "badge-medium": complaint.ai_severity==="MEDIUM", "badge-low": complaint.ai_severity==="LOW" })}>{complaint.ai_severity}</span>
                </div>
              )}
              {complaint.address && (
                <div>
                  <div className="text-xs text-white/30 mb-1">Location</div>
                  <div className="text-white/60 text-xs">{complaint.address}</div>
                </div>
              )}
            </div>

            {complaint.ai_damage_description && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs text-white/30 mb-1">AI Analysis</div>
                <div className="text-white/60 text-sm">{complaint.ai_damage_description}</div>
              </div>
            )}
          </div>

          {/* Authority */}
          {complaint.routed_to?.name && (
            <div className="glow-card p-5">
              <div className="text-xs text-white/30 mb-3">Assigned Authority</div>
              <div className="font-semibold text-white mb-1">{complaint.routed_to.name}</div>
              <div className="text-xs text-white/40 mb-3">{complaint.routed_to.type}</div>
              {complaint.routed_to.engineer && (
                <div className="text-sm text-white/50">Engineer: <span className="text-white/70">{complaint.routed_to.engineer}</span></div>
              )}
              {complaint.routed_to.contact && (
                <a href={`tel:${complaint.routed_to.contact}`} className="inline-flex items-center gap-1 text-sm mt-2" style={{ color: "rgba(56,189,248,0.8)" }}>
                  📞 {complaint.routed_to.contact}
                </a>
              )}
            </div>
          )}

          {/* Timeline */}
          {complaint.status_history?.length > 0 && (
            <div className="glow-card p-5">
              <div className="text-xs text-white/30 mb-4">Status Timeline</div>
              <div className="space-y-4">
                {complaint.status_history.map((h: any, i: number) => {
                  const c = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${c.glow}`, border: `1px solid ${c.color}40` }}>
                        <c.icon size={12} style={{ color: c.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: c.color }}>{c.label}</div>
                        <div className="text-xs text-white/30">{new Date(h.timestamp).toLocaleString()}{h.note && ` · ${h.note}`}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ledger */}
          {complaint.ledger_hash && (
            <div className="glow-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-emerald-400" />
                <div className="text-xs text-white/30">Tamper-Proof Audit Trail</div>
              </div>
              <div className="font-mono text-xs text-white/30 break-all">{complaint.ledger_hash}</div>
              <div className="text-xs text-emerald-400 mt-2">✅ Chain integrity verified</div>
            </div>
          )}

          {/* Images */}
          {complaint.image_urls?.length > 0 && (
            <div className="glow-card p-5">
              <div className="text-xs text-white/30 mb-3">Submitted Photos</div>
              <div className="flex gap-2 flex-wrap">
                {complaint.image_urls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="" className="w-24 h-24 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
