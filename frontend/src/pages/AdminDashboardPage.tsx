import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Send, AlertCircle } from "lucide-react";

interface AdminComplaint {
  id: string;
  ticket_number: string;
  type: string;
  status: string;
  severity: string;
  address: string;
  progress_percentage: number;
  assigned_contractor: string | null;
}

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [formData, setFormData] = useState({
    progress: 0,
    note: "",
    beforeImage: null as File | null,
    afterImage: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/complaints/public/feed?limit=100");
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

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setSubmitting(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("progress_percentage", String(formData.progress));
      fd.append("update_note", formData.note);
      fd.append("updated_by_email", "admin@roadwatch.com");
      if (formData.beforeImage) fd.append("before_image", formData.beforeImage);
      if (formData.afterImage) fd.append("after_image", formData.afterImage);

      const response = await fetch(`/api/complaints/${selectedComplaint.id}/work-updates`, {
        method: "POST",
        body: fd,
      });

      if (response.ok) {
        const result = await response.json();
        setMessage("✅ Update posted successfully");
        setFormData({ progress: 0, note: "", beforeImage: null, afterImage: null });
        setSelectedComplaint(null);
        await fetchComplaints();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.detail || "Failed to post update"}`);
      }
    } catch (err) {
      console.error("Failed to submit update:", err);
      setMessage("❌ Error submitting update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "1000px", height: "500px", background: "radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 px-6 md:px-12 py-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-12">
          <div className="mb-3 inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "linear-gradient(90deg,#a78bfa,#f97316)", color: "black" }}>
            Admin
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-1.5px", marginBottom: "8px" }}>
            Manage{" "}
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(135deg,#a78bfa,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Road Work
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "15px" }}>Post progress updates and track complaint resolution</p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl p-4 mb-6"
            style={{ background: message.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${message.startsWith("✅") ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`, color: message.startsWith("✅") ? "#34d399" : "#ef4444" }}>
            {message}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 lg:col-span-1"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>Complaints to Update</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 rounded-full border-2 border-transparent" style={{ borderTopColor: "#38bdf8" }} />
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {complaints.map(complaint => (
                  <motion.button
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    whileHover={{ scale: 1.02 }}
                    className="w-full text-left rounded-lg p-3 transition-all"
                    style={{
                      background: selectedComplaint?.id === complaint.id ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedComplaint?.id === complaint.id ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.06)"}`,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    <div style={{ fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>
                      {complaint.ticket_number}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                      {complaint.address.substring(0, 30)}...
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                        {complaint.progress_percentage}%
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
                      >
                        {complaint.status}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Update Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 lg:col-span-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            
            {!selectedComplaint ? (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: "rgba(255,255,255,0.3)" }}>
                <AlertCircle size={32} className="mb-4" style={{ opacity: 0.5 }} />
                <p>Select a complaint to post an update</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
                  {selectedComplaint.ticket_number}
                </h2>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>
                  {selectedComplaint.address}
                </p>

                <form onSubmit={handleSubmitUpdate} className="space-y-4">
                  {/* Progress Slider */}
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                      Progress: {formData.progress}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress}
                      onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                      className="w-full"
                      style={{ height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.08)" }}
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Work Update Note
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={e => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Describe what work was done..."
                      className="w-full rounded-lg px-4 py-3 text-sm text-white resize-none outline-none"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", minHeight: "80px" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                    />
                  </div>

                  {/* Before/After Images */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                        Before Photo
                      </label>
                      <label className="block rounded-lg p-3 text-center cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                        <Upload size={16} style={{ margin: "0 auto 4px", color: "rgba(255,255,255,0.4)" }} />
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          {formData.beforeImage ? formData.beforeImage.name : "Choose file"}
                        </span>
                        <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, beforeImage: e.target.files?.[0] || null })} style={{ display: "none" }} />
                      </label>
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                        After Photo
                      </label>
                      <label className="block rounded-lg p-3 text-center cursor-pointer transition-all" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                        <Upload size={16} style={{ margin: "0 auto 4px", color: "rgba(255,255,255,0.4)" }} />
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                          {formData.afterImage ? formData.afterImage.name : "Choose file"}
                        </span>
                        <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, afterImage: e.target.files?.[0] || null })} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button type="submit" disabled={submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-black disabled:opacity-50"
                    style={{ background: "white" }}>
                    {submitting ? "Posting..." : <>
                      <Send size={16} />
                      Post Update
                    </>}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
