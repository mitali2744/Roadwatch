import { useState, useEffect } from "react";
import { getComplaintHeatmap } from "../api/complaints";

export function useComplaintHeatmap(lat: number, lon: number, radiusKm = 10) {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    if (!lat || !lon) return;
    getComplaintHeatmap(lat, lon, radiusKm)
      .then((data) => setHeatmapData(data.points || []))
      .catch(() => setHeatmapData([]));
  }, [lat, lon, radiusKm]);

  return { heatmapData };
}
