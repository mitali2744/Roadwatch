import { useState, useEffect } from "react";
import { getNearbyRoads } from "../api/roads";

export function useNearbyRoads(lat: number, lon: number, radiusKm = 5) {
  const [roads, setRoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;
    setLoading(true);
    getNearbyRoads(lat, lon, radiusKm)
      .then((data) => setRoads(data.roads || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lat, lon, radiusKm]);

  return { roads, loading, error };
}
