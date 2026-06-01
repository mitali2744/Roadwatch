import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import clsx from "clsx";

interface WorkUpdate {
  id: string;
  progress: number;
  note: string;
  before_image: string | null;
  after_image: string | null;
  updated_by: string;
  updated_by_role: string;
  timestamp: string;
}

interface ComplaintDetail {
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

export default function ComplaintDetailPage() {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [formData, setFormData] = useState({ progress: 0, note: "" });

  useEffect(() => {
    if (complaintId) {
      fetchComplaint();
      fetchWorkUpdates();
    }
  }, [complaintId]);

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/track/${complaintId}`);
      if (response.ok) {
        const data = await response.json();
        setComplaint(data);
      }
    } catch (err) {
      console.error("Failed to fetch complaint:", err);
    }
  };

  const fetchWorkUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/work-updates`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates);
      }
    } catch (err) {
      console.error("Failed to fetch work updates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUpdate(true);
    try {
      const fd = new FormData();
      fd.append("progress_percentage", String(formData.progress));
      fd.append("update_note", formData.note);
      fd.append("updated_by_email", "admin@roadwatch.com"); // In real app, get from auth
      
      const response = await fetch(`/api/complaints/${complaintId}/work-updates`, {
        method: "POST",
        body: fd,
      });
      
      if (response.ok) {
        setFormData({ progress: 0, note: "" });
        await fetchComplaint();
        await fetchWorkUpdates();
      }
    } catch (err) {
      console.error("Failed to add update:", err);
    } finally {
      setAddingUpdate(false);
    }
  };

  if (!complaint) {
    return (
      <div className="md:ml-16 min-h-screen flex items-center justify-center" style={{ background: "#000" }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: "#38bdf8" }} />
      </div>
    );
  }

  return (
    <div className="md:ml-16 min-h-screen relative" style={{ background: "#000", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 px-6 md:px-12 py-10 max-w-4xl mx-auto">
        {/* Back button */}
        <motion.a href="/feed" className="inline-flex items-center gap-2 mb-8" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", cursor: "pointer" }}
          whileHover={{ color: "rgba(255,255,255,0.8)" }}>
          <ArrowLeft size={16} /> Back to feed
        </motion.a>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ticket & Status */}
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "6px" }}>
                Ticket Number
              </div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "20px", color: "#38bdf8", marginBottom: "12px" }}>
                {complaint.ticket_number}
              </div>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8" }}
              >
                {complaint.status}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "6px" }}>
                Overall Progress
              </div>
              <div style={{ fontSize: "32px", fontWeight: 700, color: "#a78bfa", marginBottom: "8px" }}>
                {complaint.progress_percentage}%
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${complaint.progress_percentage}%` }}
                  transition={{ duration: 1 }}
                  style={{ height: "100%", background: "linear-gradient(90deg, #38bdf8, #a78bfa)" }}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "6px" }}>
                Type / Severity
              </div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>
                {complaint.type}
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
              >
                {complaint.severity}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "4px" }}>
              Location
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
              📍 {complaint.address}
            </div>
          </div>
        </motion.div>

        {/* Work Updates Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Work Updates Timeline</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 rounded-full border-2 border-transparent" style={{ borderTopColor: "#38bdf8" }} />
            </div>
          ) : updates.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "24px" }}>
              No work updates yet
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vertical timeline */}
              <div style={{ position: "relative", paddingLeft: "32px" }}>
                {/* Line */}
                <div style={{ position: "absolute", left: "11px", top: 0, bottom: 0, width: "1px", background: "rgba(56,189,248,0.2)" }} />
                
                {updates.map((update, i) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative mb-6"
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-29px",
                        top: "2px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #38bdf8, #a78bfa)",
                        border: "2px solid #000",
                      }}
                    />
                    
                    {/* Content */}
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "white" }}>
                            {update.progress}% Complete
                          </div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                            Updated by {update.updated_by} ({update.updated_by_role})
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                          {new Date(update.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      {update.note && (
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>
                          {update.note}
                        </div>
                      )}
                      {(update.before_image || update.after_image) && (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {update.before_image && (
                            <img src={update.before_image} alt="Before" className="rounded-lg h-32 object-cover" />
                          )}
                          {update.after_image && (
                            <img src={update.after_image} alt="After" className="rounded-lg h-32 object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Images */}
        {complaint.image_urls.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Reported Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {complaint.image_urls.map((url, i) => (
                <img key={i} src={url} alt={`Complaint ${i}`} className="rounded-lg h-40 object-cover" />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
