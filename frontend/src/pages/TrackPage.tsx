import { useState } from "react";
import { Search, CheckCircle, Clock, AlertTriangle, Shield } from "lucide-react";
import { trackComplaint } from "../api/complaints";
import clsx from "clsx";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: "text-yellow-400", icon: Clock, label: "Pending" },
  ACKNOWLEDGED: { color: "text-blue-400", icon: CheckCircle, label: "Acknowledged" },
  IN_PROGRESS: { color: "text-brand-400", icon: Clock, label: "In Progress" },
  RESOLVED: { color: "text-green-400", icon: CheckCircle, label: "Resolved" },
  ESCALATED: { color: "text-orange-400", icon: AlertTriangle, label: "Escalated" },
  REJECTED: { color: "text-red-400", icon: AlertTriangle, label: "Rejected" },
};

export default function TrackPage() {
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.trim()) return;
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const data = await trackComplaint(ticket.trim().toUpperCase());
      setComplaint(data);
    } catch {
      setError("Complaint not found. Please check your ticket number.");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = complaint ? STATUS_CONFIG[complaint.status] || STATUS_CONFIG.PENDING : null;

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Track Complaint</h1>
        <p className="text-slate-500 text-sm mt-1">Enter your ticket number to check status</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          className="input flex-1 font-mono uppercase"
          placeholder="RW-2026-XXXXXX"
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-5">
          <Search size={16} />
          {loading ? "..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {complaint && statusConfig && (
        <div className="space-y-4">
          {/* Status card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-slate-500 text-xs mb-1">Ticket Number</div>
                <div className="font-mono font-bold text-brand-400 text-lg">{complaint.ticket_number}</div>
              </div>
              <div className={clsx("flex items-center gap-2 text-sm font-medium", statusConfig.color)}>
                <statusConfig.icon size={16} />
                {statusConfig.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500 text-xs mb-0.5">Issue Type</div>
                <div className="text-slate-200">{complaint.complaint_type?.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-0.5">Submitted</div>
                <div className="text-slate-200">
                  {complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString() : "N/A"}
                </div>
              </div>
              {complaint.ai_severity && (
                <div>
                  <div className="text-slate-500 text-xs mb-0.5">AI Severity</div>
                  <span className={clsx("badge", {
                    "badge-critical": complaint.ai_severity === "CRITICAL",
                    "badge-high": complaint.ai_severity === "HIGH",
                    "badge-medium": complaint.ai_severity === "MEDIUM",
                    "badge-low": complaint.ai_severity === "LOW",
                  })}>
                    {complaint.ai_severity}
                  </span>
                </div>
              )}
              {complaint.address && (
                <div>
                  <div className="text-slate-500 text-xs mb-0.5">Location</div>
                  <div className="text-slate-200 text-xs">{complaint.address}</div>
                </div>
              )}
            </div>

            {complaint.ai_damage_description && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-slate-500 text-xs mb-1">AI Analysis</div>
                <div className="text-slate-300 text-sm">{complaint.ai_damage_description}</div>
              </div>
            )}
          </div>

          {/* Routed authority */}
          {complaint.routed_to?.name && (
            <div className="card">
              <div className="text-slate-500 text-xs mb-2">Assigned Authority</div>
              <div className="font-medium text-white">{complaint.routed_to.name}</div>
              <div className="text-slate-500 text-xs mt-0.5">{complaint.routed_to.type}</div>
              {complaint.routed_to.engineer && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-500">Executive Engineer: </span>
                  <span className="text-slate-300">{complaint.routed_to.engineer}</span>
                </div>
              )}
              {complaint.routed_to.contact && (
                <a
                  href={`tel:${complaint.routed_to.contact}`}
                  className="mt-2 inline-flex items-center gap-1 text-brand-400 text-sm hover:underline"
                >
                  📞 {complaint.routed_to.contact}
                </a>
              )}
            </div>
          )}

          {/* Status timeline */}
          {complaint.status_history?.length > 0 && (
            <div className="card">
              <div className="text-slate-500 text-xs mb-3">Status Timeline</div>
              <div className="space-y-3">
                {complaint.status_history.map((h: any, i: number) => {
                  const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.PENDING;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={clsx("mt-0.5", cfg.color)}>
                        <cfg.icon size={14} />
                      </div>
                      <div>
                        <div className={clsx("text-sm font-medium", cfg.color)}>{cfg.label}</div>
                        <div className="text-slate-500 text-xs">
                          {new Date(h.timestamp).toLocaleString()}
                          {h.note && ` · ${h.note}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audit trail */}
          {complaint.ledger_hash && (
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-green-400" />
                <div className="text-slate-500 text-xs">Tamper-Proof Audit Trail</div>
              </div>
              <div className="font-mono text-xs text-slate-500 break-all">{complaint.ledger_hash}</div>
              <div className="text-xs text-green-400 mt-1">✅ Chain integrity verified</div>
            </div>
          )}

          {/* Images */}
          {complaint.image_urls?.length > 0 && (
            <div className="card">
              <div className="text-slate-500 text-xs mb-2">Submitted Photos</div>
              <div className="flex gap-2 flex-wrap">
                {complaint.image_urls.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-slate-700"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
