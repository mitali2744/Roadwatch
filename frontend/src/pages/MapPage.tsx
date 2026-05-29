import { useState, useCallback, useRef } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";
import { Layers, AlertTriangle, Navigation, Info } from "lucide-react";
import { useNearbyRoads } from "../hooks/useNearbyRoads";
import { useComplaintHeatmap } from "../hooks/useComplaintHeatmap";
import clsx from "clsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

type LayerMode = "roads" | "heatmap" | "both";

export default function MapPage() {
  const [viewport, setViewport] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 12,
  });
  const [selectedRoad, setSelectedRoad] = useState<any>(null);
  const [layerMode, setLayerMode] = useState<LayerMode>("both");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const { roads, loading: roadsLoading } = useNearbyRoads(
    userLocation?.lat ?? viewport.latitude,
    userLocation?.lon ?? viewport.longitude,
    5
  );

  const { heatmapData } = useComplaintHeatmap(
    userLocation?.lat ?? viewport.latitude,
    userLocation?.lon ?? viewport.longitude,
    10
  );

  const locateMe = useCallback(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setUserLocation({ lat: latitude, lon: longitude });
      setViewport((v) => ({ ...v, latitude, longitude, zoom: 14 }));
    });
  }, []);

  // Build heatmap GeoJSON
  const heatmapGeoJSON = {
    type: "FeatureCollection" as const,
    features: heatmapData.map((p: any) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: { weight: p.weight },
    })),
  };

  const severityColor = (score: number) => {
    if (score >= 70) return "#ef4444";
    if (score >= 50) return "#f59e0b";
    if (score >= 30) return "#3b82f6";
    return "#10b981";
  };

  return (
    <div className="md:ml-16 h-[calc(100vh-56px)] flex flex-col">
      {/* Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={locateMe}
          className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
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
                layerMode === mode
                  ? "bg-brand-700 text-white"
                  : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Layers size={12} />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <Map
        {...viewport}
        onMove={(e) => setViewport(e.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {/* Heatmap layer */}
        {(layerMode === "heatmap" || layerMode === "both") && heatmapData.length > 0 && (
          <Source id="complaints-heat" type="geojson" data={heatmapGeoJSON}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                "heatmap-weight": ["get", "weight"],
                "heatmap-intensity": 1.5,
                "heatmap-color": [
                  "interpolate", ["linear"], ["heatmap-density"],
                  0, "rgba(0,0,255,0)",
                  0.2, "rgba(0,255,255,0.5)",
                  0.5, "rgba(255,255,0,0.7)",
                  0.8, "rgba(255,128,0,0.9)",
                  1, "rgba(255,0,0,1)",
                ],
                "heatmap-radius": 30,
                "heatmap-opacity": 0.7,
              }}
            />
          </Source>
        )}

        {/* Road markers */}
        {(layerMode === "roads" || layerMode === "both") &&
          roads.map((road: any) => (
            <Marker
              key={road.id}
              latitude={viewport.latitude + (Math.random() - 0.5) * 0.02}
              longitude={viewport.longitude + (Math.random() - 0.5) * 0.02}
              onClick={() => setSelectedRoad(road)}
            >
              <div
                className="w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-transform"
                style={{ backgroundColor: severityColor(road.condition_score || 50) }}
              />
            </Marker>
          ))}

        {/* User location */}
        {userLocation && (
          <Marker latitude={userLocation.lat} longitude={userLocation.lon}>
            <div className="w-4 h-4 bg-brand-500 rounded-full border-2 border-white shadow-lg pulse-critical" />
          </Marker>
        )}

        {/* Road popup */}
        {selectedRoad && (
          <Popup
            latitude={viewport.latitude}
            longitude={viewport.longitude}
            onClose={() => setSelectedRoad(null)}
            closeButton
          >
            <div className="min-w-[200px]">
              <div className="font-semibold text-white mb-1">{selectedRoad.name}</div>
              <div className="text-xs text-slate-400 mb-2">
                {selectedRoad.road_number} · {selectedRoad.road_type}
              </div>
              {selectedRoad.project && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contractor</span>
                    <span className="text-slate-300">{selectedRoad.project.contractor_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget</span>
                    <span className="text-slate-300">
                      ₹{((selectedRoad.project.budget_sanctioned || 0) / 1e7).toFixed(1)}Cr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Repair</span>
                    <span className="text-slate-300">
                      {selectedRoad.project.last_relaying_date
                        ? new Date(selectedRoad.project.last_relaying_date).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  {selectedRoad.project.is_anomalous && (
                    <div className="mt-2 flex items-center gap-1 text-red-400 text-xs">
                      <AlertTriangle size={12} />
                      Budget anomaly flagged
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: severityColor(selectedRoad.condition_score || 50) }}
                  />
                  <span className="text-xs text-slate-400">
                    Condition: {selectedRoad.condition_score?.toFixed(0) || "N/A"}/100
                  </span>
                </div>
                {selectedRoad.deterioration_risk && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Risk: {selectedRoad.deterioration_risk}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs">
        <div className="font-medium text-slate-300 mb-2 flex items-center gap-1">
          <Info size={12} /> Legend
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

      {/* Road count */}
      {roadsLoading ? (
        <div className="absolute top-20 left-4 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400">
          Loading roads...
        </div>
      ) : (
        <div className="absolute top-20 left-4 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400">
          {roads.length} roads nearby
        </div>
      )}
    </div>
  );
}
