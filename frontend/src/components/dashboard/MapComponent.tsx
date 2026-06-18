"use client";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Corridor } from '@/lib/types';
import { useTheme } from 'next-themes';

export default function MapComponent({ corridors }: { corridors: Corridor[] }) {
  // Center roughly around Bengaluru
  const center: [number, number] = [12.9716, 77.5946];

  const maxWeight = Math.max(...corridors.map(c => c.weight), 1);

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {corridors.map((c, i) => {
        const opacity = Math.max(0.2, c.weight / maxWeight);
        const weight = Math.max(2, (c.weight / maxWeight) * 8);
        return (
          <div key={i}>
            <Polyline 
              positions={[[c.from_lat, c.from_lon], [c.to_lat, c.to_lon]]}
              color="#d946ef" // fuchsia-500
              weight={weight}
              opacity={opacity}
              dashArray={c.avg_transit_minutes > 45 ? "5, 10" : undefined}
            >
              <Tooltip className="bg-slate-900 border-slate-700 text-slate-200">
                <div className="font-semibold">{c.from_junction} → {c.to_junction}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Volume: <span className="text-fuchsia-400">{c.weight} vehicles</span>
                </div>
                <div className="text-xs text-slate-400">
                  Avg Transit: <span className="text-cyan-400">{c.avg_transit_minutes} min</span>
                </div>
              </Tooltip>
            </Polyline>
            
            <CircleMarker center={[c.from_lat, c.from_lon]} radius={4} color="#38bdf8" fillColor="#38bdf8" fillOpacity={1}>
              <Tooltip direction="top" className="bg-slate-900 border-slate-700 text-slate-200">{c.from_junction}</Tooltip>
            </CircleMarker>
            <CircleMarker center={[c.to_lat, c.to_lon]} radius={4} color="#38bdf8" fillColor="#38bdf8" fillOpacity={1}>
              <Tooltip direction="top" className="bg-slate-900 border-slate-700 text-slate-200">{c.to_junction}</Tooltip>
            </CircleMarker>
          </div>
        );
      })}
    </MapContainer>
  );
}
