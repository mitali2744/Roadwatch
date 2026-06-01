import { useParams } from "react-router-dom";
import { useRoadDetail } from "../hooks/useRoadDetail";
import { AlertTriangle, Calendar, DollarSign, Building, Loader2 } from "lucide-react";
import clsx from "clsx";

export default function RoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useRoadDetail(id!);

  if (loading) return (
    <div className="md:ml-16 min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin" style={{ color: "rgba(56,189,248,0.6)" }} />
    </div>
  );
  if (!data) return <div className="md:ml-16 p-8 text-white/40">Road not found</div>;

  const { segment, projects } = data;

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-3xl mx-auto">
      <div className="mb-6 animate-fade-in-up">
        <div className="text-xs mb-1" style={{ color: "rgba(56,189,248,0.6)" }}>{segment.road_number} · {segment.road_type}</div>
        <h1 className="text-2xl font-bold text-white mb-3">{segment.name}</h1>
        <div className="flex items-center gap-3">
          <span className={clsx("badge", {
            "badge-critical": segment.deterioration_risk === "CRITICAL",
            "badge-high": segment.deterioration_risk === "HIGH",
            "badge-medium": segment.deterioration_risk === "MEDIUM",
            "badge-low": segment.deterioration_risk === "LOW",
          })}>{segment.deterioration_risk || "UNKNOWN"} RISK</span>
          <span className="text-sm text-white/40">Condition: {segment.condition_score?.toFixed(0) || "N/A"}/100</span>
        </div>
      </div>

      <div className="space-y-4">
        {projects.map((p: any) => (
          <div key={p.id} className="glow-card p-5 animate-fade-in-up">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-white">{p.title}</h3>
              {p.is_anomalous && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  <AlertTriangle size={11} /> Anomaly
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign size={14} style={{ color: "rgba(56,189,248,0.5)" }} />
                <div>
                  <div className="text-xs text-white/30">Budget Sanctioned</div>
                  <div className="text-white/80">₹{(p.budget_sanctioned/1e7).toFixed(2)}Cr</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} style={{ color: "rgba(56,189,248,0.5)" }} />
                <div>
                  <div className="text-xs text-white/30">Budget Spent</div>
                  <div className={p.budget_spent > p.budget_sanctioned ? "text-red-400" : "text-white/80"}>
                    ₹{(p.budget_spent/1e7).toFixed(2)}Cr {p.budget_spent > p.budget_sanctioned && "⚠️"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: "rgba(56,189,248,0.5)" }} />
                <div>
                  <div className="text-xs text-white/30">Last Relaying</div>
                  <div className="text-white/80">{p.last_relaying_date ? new Date(p.last_relaying_date).toLocaleDateString() : "N/A"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} style={{ color: "rgba(56,189,248,0.5)" }} />
                <div>
                  <div className="text-xs text-white/30">Status</div>
                  <div className="text-white/80">{p.status}</div>
                </div>
              </div>
            </div>
            {p.anomaly_reason && (
              <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                ⚠️ {p.anomaly_reason}
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && (
          <div className="glow-card p-8 text-center text-white/30">No project data available for this road</div>
        )}
      </div>
    </div>
  );
}
