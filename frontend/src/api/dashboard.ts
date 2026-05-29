import { api } from "./client";

export async function getDashboardOverview(country = "IN") {
  const res = await api.get("/api/dashboard/overview", { params: { country_code: country } });
  return res.data;
}

export async function getContractorScorecards(country = "IN") {
  const res = await api.get("/api/dashboard/contractors/scorecards", { params: { country_code: country } });
  return res.data;
}

export async function getComplaintsByType(country = "IN") {
  const res = await api.get("/api/dashboard/complaints/by-type", { params: { country_code: country } });
  return res.data;
}

export async function getComplaintsBySeverity(country = "IN") {
  const res = await api.get("/api/dashboard/complaints/by-severity", { params: { country_code: country } });
  return res.data;
}

export async function getAtRiskRoads(country = "IN") {
  const res = await api.get("/api/dashboard/predictions/at-risk", { params: { country_code: country } });
  return res.data;
}
