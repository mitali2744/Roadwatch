import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminGetAll, updateWorkProgress } from "../api/feed";
import { Shield, RefreshCw, CheckCircle, Clock, AlertTriangle, ChevronDown, Send, Lock } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

const STATUS_OPTIONS = ["PENDING","ACKNOWLEDGED","IN_PROGRESS","RESOLVED","ESCALATED","REJECTED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#fbbf24", ACKNOWLEDGED: "#38bdf8", IN_PROGRESS: "#a78bfa",
  RESOLVED: "#34d399", ESCALATED: "#f97316", REJECTED: "#ef4444",
};

function ProgressBar({ value }: { value: number }) {
  const color = value === 100 ? "#34d399" : value >= 50 ? "#a78bfa" : value > 0 ? "#38bdf8" : "rgba(255,255,255,0.08)";
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "9999px", height: "4px", overflow: "hidden", flex: 1 }}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }}
        style={{ height: "100%", background: color, borderRadius: "9999px" }} />
    </div>
  );
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminGetAll(undefined, adminKey);
      setAuthed(true);
      toast.success("Admin access granted");
    } catch { toast.error("Invalid admin key"); }
    finally { setLoading(false); }
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await adminGetAll(filter || undefined, adminKey);
      setComplaints(data);
    } catch { toast.error("Failed to load complaints"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (authed) loadComplaints(); }, [authed, filter]);

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await updateWorkProgress(selected.ticket_number, progress, note, newStatus || undefined, adminKey);
      toast.success(`Updated ${selected.ticket_number} → ${progress}%`);
      setSelected(null); setNote(""); setNewStatus("");
      loadComplaints();
    } catch { toast.error("Update failed"); }
    finally { setUpdating(false); }
  };

  // Login screen
  if (!authed) return (
    <div className="md:ml-16 min-h-screen flex items-center justify-center px-6" style={{ background: "#000" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(167,139,250,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl p-8 relative"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="text-center mb-8">
          <motion.div animate={{ y: [0,-6,0] }} transition={{ duration: 3, repeat: Infinity }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", boxShadow: "0 0 30px rgba(167,139,250,0.15)" }}>
            <Shield size={24} style={{ color: "#a78bfa" }} />
          </motion.div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "white", marginBottom: "6px" }}>Admin Panel</h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>Enter admin key to manage complaints</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div className="relative">
            <Lock size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input type="password" placeholder="Admin key" value={adminKey} onChange={e => setAdminKey(e.target.value)}
              className="w-full rounded-xl py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", paddingLeft: "40px", paddingRight: "16px" }} />
          </div>
          <motion.button type="submit" disabled={loading || !adminKey}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-black disabled:opacity-40"
            style={{ background: "white" }}>
            {loading ? "Checking..." : "Access Admin Panel"}
          </motion.button>
        </form>
        <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.2)", marginTop: "16px" }}>
          Default key: roadwatch-admin-2026
        </p>
      </motion.div>
    </div>
  );

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      <div className="relative z-10 px-6 md:px-12 py-10 max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "4px" }}>
              Admin{" "}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Panel
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>{complaints.length} complaints loaded</p>
          </div>
          <button onClick={loadComplaints} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[{v:"",l:"All"},{v:"PENDING",l:"Pending"},{v:"IN_PROGRESS",l:"In Progress"},{v:"RESOLVED",l:"Resolved"}].map(({v,l}) => (
            <button key={v} onClick={() => setFilter(v)}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{ background: filter===v ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter===v ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.08)"}`, color: filter===v ? "#a78bfa" : "rgba(255,255,255,0.4)" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Ticket","Type","Location","Status","Progress","Severity","Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "rgba(255,255,255,0.3)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                  <RefreshCw size={20} className="animate-spin mx-auto" />
                </td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>No complaints found</td></tr>
              ) : complaints.map((c, i) => (
                <motion.tr key={c.ticket_number} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { setSelected(c); setProgress(c.work_progress || (c.status === "RESOLVED" ? 100 : 0)); setNewStatus(c.status?.replace("ComplaintStatus.","") || "PENDING"); }}>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>{c.ticket_number}</td>
                  <td style={{ padding: "14px 16px", color: "white", fontWeight: 500 }}>{(c.complaint_type || "").replace("ComplaintType.","").replace("_"," ")}</td>
                  <td style={{ padding: "14px 16px", color: "rgba(255,255,255,0.55)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address || "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {(() => { const s = (c.status||"").replace("ComplaintStatus.",""); const col = STATUS_COLORS[s] || "#fff"; return (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "9999px", background: `${col}20`, border: `1px solid ${col}50`, color: col, fontWeight: 600 }}>
                        {s.replace("_"," ")}
                      </span>
                    );})()}
                  </td>
                  <td style={{ padding: "14px 16px", minWidth: "120px" }}>
                    {(() => { const prog = c.work_progress || ((c.status||"").includes("RESOLVED") ? 100 : 0); return (
                      <div className="flex items-center gap-2">
                        <ProgressBar value={prog} />
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", minWidth: "32px", fontWeight: 600 }}>{prog}%</span>
                      </div>
                    );})()}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {c.ai_severity && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 500 }}>
                        {(c.ai_severity||"").replace("SeverityLevel.","")}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={e => { e.stopPropagation(); setSelected(c); setProgress(c.work_progress || ((c.status||"").includes("RESOLVED") ? 100 : 0)); setNewStatus((c.status||"").replace("ComplaintStatus.","")); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
                      Update
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* Update modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl p-6"
              style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)" }}>

              <div className="flex items-center justify-between mb-5">
                <div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "white", fontSize: "16px" }}>{selected.ticket_number}</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", marginTop: "2px" }}>
                    {(selected.complaint_type||"").replace("ComplaintType.","").replace("_"," ")} · {selected.address || "No address"}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>×</button>
              </div>

              <div className="space-y-4">
                {/* Progress slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Work Progress</label>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: progress === 100 ? "#34d399" : "white" }}>{progress}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={5} value={progress} onChange={e => {
                    const v = Number(e.target.value);
                    setProgress(v);
                    if (v === 100) setNewStatus("RESOLVED");
                    else if (v > 0) setNewStatus("IN_PROGRESS");
                  }} className="w-full" style={{ accentColor: "#a78bfa" }} />
                  <ProgressBar value={progress} />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                    <option value="PENDING" style={{ background:"#1a1a2e" }}>PENDING</option>
                    <option value="ACKNOWLEDGED" style={{ background:"#1a1a2e" }}>ACKNOWLEDGED</option>
                    <option value="IN_PROGRESS" style={{ background:"#1a1a2e" }}>IN PROGRESS</option>
                    <option value="RESOLVED" style={{ background:"#1a1a2e" }}>RESOLVED</option>
                    <option value="ESCALATED" style={{ background:"#1a1a2e" }}>ESCALATED</option>
                    <option value="REJECTED" style={{ background:"#1a1a2e" }}>REJECTED</option>
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Work Update Note</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder="Describe what work was done..."
                    className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }} />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    Cancel
                  </button>
                  <motion.button onClick={handleUpdate} disabled={updating}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "white" }}>
                    {updating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {updating ? "Updating..." : "Save Update"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
