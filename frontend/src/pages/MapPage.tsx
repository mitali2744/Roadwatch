import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Layers, Navigation, Info, AlertTriangle } from "lucide-react";
import { useNearbyRoads } from "../hooks/useNearbyRoads";
import { useComplaintHeatmap } from "../hooks/useComplaintHeatmap";
import clsx from "clsx";
import "leaflet/dist/leaflet.css";

type LayerMode = "roads" | "heatmap" | "both";

// Component to fly to user location
function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 14, { duration: 1.5 });
  }, [lat, lon]);
  return null;
}

const severityColor = (score: number) => {
  if (score < 30) return "#ef4444";
  if (score < 50) return "#f59e0b";
  if (score < 70) return "#3b82f6";
  return "#10b981";
};

const severityWeight = (sev: string) => {
  const w: Record<string, number> = { CRITICAL: 5, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return w[sev] || 1;
};

export default function MapPage() {
  const [center, setCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>("both");
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const { roads } = useNearbyRoads(center[0], center[1], 5);
  const { heatmapData } = useComplaintHeatmap(center[0], center[1], 10);

  const locateMe = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(loc);
      setFlyTarget(loc);
      setCenter(loc);
    }, () => alert("Could not get location. Please enable GPS."));
  };

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={locateMe}
          className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg hover:bg-slate-800 shadow-lg"
          title="Locate me"
        >
          <Navigation size={18} />
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
          {(["roads", "heatmap", "both"] as LayerMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayerMode(mode)}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 text-xs w-full transition-colors",
                layerMode === mode ? "bg-brand-700 text-white" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Layers size={12} />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={false}
      >
        {/* Free OpenStreetMap tiles — no API key needed */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Fly to user location */}
        {flyTarget && <FlyTo lat={flyTarget[0]} lon={flyTarget[1]} />}

        {/* User location marker */}
        {userLocation && (
          <CircleMarker
            center={userLocation}
            radius={10}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 1, weight: 3 }}
          >
            <Popup>📍 Your location</Popup>
          </CircleMarker>
        )}

        {/* Road markers */}
        {(layerMode === "roads" || layerMode === "both") &&
          roads.map((road: any, i: number) => {
            // Offset slightly so markers don't stack on same point
            const lat = center[0] + (Math.random() - 0.5) * 0.04;
            const lon = center[1] + (Math.random() - 0.5) * 0.04;
            const color = severityColor(road.condition_score ?? 50);
            return (
              <CircleMarker
                key={road.id || i}
                center={[lat, lon]}
                radius={8}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
              >
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <div className="font-semibold mb-1">{road.name}</div>
                    <div className="text-gray-500 text-xs mb-2">
                      {road.road_number} · {road.road_type}
                    </div>
                    {road.project && (
                      <div className="space-y-1 text-xs">
                        <div><span className="text-gray-500">Budget: </span>
                          ₹{((road.project.budget_sanctioned || 0) / 1e7).toFixed(1)}Cr
                        </div>
                        <div><span className="text-gray-500">Last Repair: </span>
                          {road.project.last_relaying_date
                            ? new Date(road.project.last_relaying_date).toLocaleDateString()
                            : "N/A"}
                        </div>
                        {road.project.is_anomalous && (
                          <div className="text-red-500 flex items-center gap-1">
                            <AlertTriangle size={10} /> Budget anomaly flagged
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      Condition: {road.condition_score?.toFixed(0) ?? "N/A"}/100
                      {road.deterioration_risk && ` · Risk: ${road.deterioration_risk}`}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Complaint heatmap dots */}
        {(layerMode === "heatmap" || layerMode === "both") &&
          heatmapData.map((p: any, i: number) => {
            const w = severityWeight(p.severity);
            const colors: Record<number, string> = { 5: "#ef4444", 3: "#f97316", 2: "#eab308", 1: "#22c55e" };
            const col = colors[w] || "#94a3b8";
            return (
              <CircleMarker
                key={i}
                center={[p.lat, p.lon]}
                radius={4 + w * 2}
                pathOptions={{ color: col, fillColor: col, fillOpacity: 0.5, weight: 1 }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-medium">{p.type?.replace("_", " ")}</div>
                    <div className="text-gray-500">Severity: {p.severity || "N/A"}</div>
                    <div className="text-gray-500">Status: {p.status}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 z-[1000] bg-slate-900/95 border border-slate-700 rounded-lg p-3 text-xs">
        <div className="font-medium text-slate-300 mb-2 flex items-center gap-1">
          <Info size={12} /> Road Condition
        </div>
        {[
          { color: "#10b981", label: "Good (70-100)" },
          { color: "#3b82f6", label: "Fair (50-70)" },
          { color: "#f59e0b", label: "Poor (30-50)" },
          { color: "#ef4444", label: "Critical (<30)" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Road count badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400">
        {roads.length} roads · {heatmapData.length} complaints nearby
      </div>
    </div>
  );
}
