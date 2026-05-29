import { api } from "./client";

export async function submitComplaint(formData: FormData) {
  const res = await api.post("/api/complaints/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function trackComplaint(ticketNumber: string) {
  const res = await api.get(`/api/complaints/track/${ticketNumber}`);
  return res.data;
}

export async function getComplaintHeatmap(lat: number, lon: number, radiusKm = 10) {
  const res = await api.get("/api/complaints/nearby/heatmap", {
    params: { lat, lon, radius_km: radiusKm },
  });
  return res.data;
}
