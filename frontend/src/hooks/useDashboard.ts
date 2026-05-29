import { useState, useEffect } from "react";
import {
  getDashboardOverview,
  getContractorScorecards,
  getComplaintsByType,
  getComplaintsBySeverity,
  getAtRiskRoads,
} from "../api/dashboard";

export function useDashboard(country = "IN") {
  const [overview, setOverview] = useState<any>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [complaintsByType, setComplaintsByType] = useState<any[]>([]);
  const [complaintsBySeverity, setComplaintsBySeverity] = useState<any[]>([]);
  const [atRiskRoads, setAtRiskRoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      getDashboardOverview(country),
      getContractorScorecards(country),
      getComplaintsByType(country),
      getComplaintsBySeverity(country),
      getAtRiskRoads(country),
    ]).then(([ov, co, ct, cs, ar]) => {
      if (ov.status === "fulfilled") setOverview(ov.value);
      if (co.status === "fulfilled") setContractors(co.value);
      if (ct.status === "fulfilled") setComplaintsByType(ct.value);
      if (cs.status === "fulfilled") setComplaintsBySeverity(cs.value);
      if (ar.status === "fulfilled") setAtRiskRoads(ar.value);
      setLoading(false);
    });
  }, [country]);

  return { overview, contractors, complaintsByType, complaintsBySeverity, atRiskRoads, loading };
}
