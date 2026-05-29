import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MapPin, Upload, Send, Mic, MicOff, Camera, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { submitComplaint } from "../api/complaints";
import { saveOfflineComplaint } from "../lib/offlineStore";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import clsx from "clsx";

const COMPLAINT_TYPES = [
  { value: "POTHOLE", label: "🕳️ Pothole" },
  { value: "CRACK", label: "⚡ Road Crack" },
  { value: "WATERLOGGING", label: "💧 Waterlogging" },
  { value: "MISSING_SIGNAGE", label: "🚧 Missing Signage" },
  { value: "BROKEN_DIVIDER", label: "🛑 Broken Divider" },
  { value: "POOR_LIGHTING", label: "💡 Poor Lighting" },
  { value: "ENCROACHMENT", label: "🏗️ Encroachment" },
  { value: "OTHER", label: "📋 Other" },
];

export default function ComplaintPage() {
  const isOnline = useOnlineStatus();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    complaint_type: "POTHOLE",
    description: "",
    reporter_name: "",
    reporter_phone: "",
    reporter_email: "",
  });

  // Image dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, 3 - images.length);
    setImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 3,
    disabled: images.length >= 3,
  });

  // GPS location
  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lon: longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Could not get location. Please enable GPS.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      toast.error("Please capture your GPS location first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append("latitude", String(location.lat));
      formData.append("longitude", String(location.lon));
      formData.append("address", location.address);
      formData.append("submitted_offline", String(!isOnline));
      images.forEach((img) => formData.append("images", img));

      if (isOnline) {
        const data = await submitComplaint(formData);
        setResult(data);
        setStep("success");
        toast.success(`Complaint submitted! Ticket: ${data.ticket_number}`);
      } else {
        // Save offline
        await saveOfflineComplaint({
          ...form,
          latitude: location.lat,
          longitude: location.lon,
          address: location.address,
          timestamp: new Date().toISOString(),
        });
        setStep("success");
        setResult({ ticket_number: "OFFLINE-PENDING", offline: true });
        toast.success("Saved offline — will sync when connected");
      }
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="md:ml-16 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {result?.offline ? "Saved Offline" : "Complaint Submitted!"}
          </h2>
          {result?.ticket_number && !result?.offline && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
              <div className="text-slate-500 text-sm mb-1">Ticket Number</div>
              <div className="text-2xl font-mono font-bold text-brand-400">{result.ticket_number}</div>
            </div>
          )}
          {result?.ai_severity && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 text-left">
              <div className="text-slate-500 text-sm mb-2">AI Analysis</div>
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx("badge", {
                  "badge-critical": result.ai_severity === "CRITICAL",
                  "badge-high": result.ai_severity === "HIGH",
                  "badge-medium": result.ai_severity === "MEDIUM",
                  "badge-low": result.ai_severity === "LOW",
                })}>
                  {result.ai_severity}
                </span>
                <span className="text-slate-400 text-xs">
                  {(result.ai_confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              {result.routed_to && (
                <div className="text-xs text-slate-400 mt-2">
                  Routed to: <span className="text-slate-200">{result.routed_to}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setStep("form"); setImages([]); setImagePreviews([]); setLocation(null); setResult(null); }} className="btn-secondary">
              Report Another
            </button>
            <a href={`/track?ticket=${result?.ticket_number}`} className="btn-primary">
              Track Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:ml-16 min-h-screen p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Report Road Issue</h1>
        <p className="text-slate-500 text-sm mt-1">
          AI will analyze your photos and auto-route to the right authority
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Issue type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Issue Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMPLAINT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, complaint_type: value }))}
                className={clsx(
                  "p-2 rounded-lg text-xs border transition-colors text-left",
                  form.complaint_type === value
                    ? "bg-brand-700 border-brand-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
          />
        </div>

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
          <button
            type="button"
            onClick={getLocation}
            disabled={locating}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors",
              location
                ? "bg-green-900/20 border-green-700 text-green-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            )}
          >
            <MapPin size={16} />
            {locating ? "Getting location..." : location ? `📍 ${location.address}` : "Capture GPS Location"}
          </button>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Photos (AI will analyze severity)
          </label>
          <div
            {...getRootProps()}
            className={clsx(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-brand-500 bg-brand-900/20" : "border-slate-700 hover:border-slate-600",
              images.length >= 3 && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="text-slate-500 text-sm">
              {images.length >= 3 ? "Max 3 images" : "Drop photos here or click to upload"}
            </p>
            <p className="text-slate-600 text-xs mt-1">JPG, PNG, WebP · Max 10MB each</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-700" />
                  <button
                    type="button"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, j) => j !== i));
                      setImagePreviews((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reporter info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
            <input
              className="input"
              placeholder="Optional"
              value={form.reporter_name}
              onChange={(e) => setForm((f) => ({ ...f, reporter_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
            <input
              className="input"
              placeholder="For status updates"
              value={form.reporter_phone}
              onChange={(e) => setForm((f) => ({ ...f, reporter_phone: e.target.value }))}
            />
          </div>
        </div>

        {/* Offline notice */}
        {!isOnline && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-sm text-yellow-400">
            📴 You're offline. Complaint will be saved locally and synced when you reconnect.
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
          <Send size={18} />
          {loading ? "Submitting..." : isOnline ? "Submit Complaint" : "Save Offline"}
        </button>
      </form>
    </div>
  );
}
