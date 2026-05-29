import { api } from "./client";

export async function getNearbyRoads(lat: number, lon: number, radiusKm = 5) {
  const res = await api.get("/api/roads/nearby", {
    params: { lat, lon, radius_km: radiusKm },
  });
  return res.data;
}

export async function getRoadDetail(id: string) {
  const res = await api.get(`/api/roads/${id}`);
  return res.data;
}

export async function searchRoads(query: string) {
  const res = await api.get("/api/roads/search/query", { params: { q: query } });
  return res.data;
}
