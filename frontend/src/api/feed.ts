import { api } from "./client";

export async function getPublicFeed(page = 1, status?: string, country = "IN") {
  const res = await api.get("/api/feed/feed", {
    params: { page, limit: 20, country_code: country, ...(status ? { status } : {}) },
  });
  return res.data;
}

export async function getComplaintDetail(ticket: string) {
  const res = await api.get(`/api/feed/feed/${ticket}`);
  return res.data;
}

export async function updateWorkProgress(
  ticket: string,
  progress: number,
  note: string,
  newStatus?: string,
  adminKey?: string,
) {
  const res = await api.patch(`/api/feed/admin/${ticket}/progress`, null, {
    params: { progress, update_note: note, ...(newStatus ? { new_status: newStatus } : {}) },
    headers: { "x-admin-key": adminKey || "roadwatch-admin-2026" },
  });
  return res.data;
}

export async function adminGetAll(status?: string, adminKey?: string) {
  const res = await api.get("/api/feed/admin/all", {
    params: status ? { status } : {},
    headers: { "x-admin-key": adminKey || "roadwatch-admin-2026" },
  });
  return res.data;
}
