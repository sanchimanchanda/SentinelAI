"use client";
import dynamic from 'next/dynamic';
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { RepeatOffenders } from "@/components/dashboard/RepeatOffenders";
import { EnforcementSimulator } from "@/components/dashboard/EnforcementSimulator";
import { SystemBootOverlay } from "@/components/dashboard/SystemBootOverlay";
import { usePolling } from "@/hooks/usePolling";
import { api } from "@/lib/api";
import { useState } from "react";
import { Globe, Layers } from "lucide-react";

const DigitalTwin = dynamic(
  () => import('@/components/dashboard/DigitalTwinMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-sm animate-pulse">Loading Digital Twin...</span>
      </div>
    )
  }
);

export default function CommandCenter() {
  const { data: corridors } = usePolling(api.getCorridorForecast, 60000);
  const { data: hotspots } = usePolling(() => api.getHotspots(24), 15000);
  const { data: offenders } = usePolling(() => api.getOffenders(2), 20000);
  const { data: recommendations } = usePolling(api.getRecommendations, 30000);
  const [selectedJunction, setSelectedJunction] = useState<string>("Silk Board");
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);

  return (
    <>
      <SystemBootOverlay />
      <div className="flex flex-col gap-3 h-full">
      {/* Header Row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Globe className="w-5 h-5" />
          <span className="font-bold text-sm uppercase tracking-widest">Traffic Digital Twin</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
          <Layers className="w-3.5 h-3.5" />
          5 ACTIVE LAYERS
        </div>
      </div>

      {/* Main Content: Twin + Right Panel */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Digital Twin Map — 62% */}
        <div className="flex-[62] rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden min-h-0">
          {corridors && hotspots && offenders && recommendations ? (
            <DigitalTwin
              corridors={corridors}
              hotspots={hotspots}
              offenders={offenders}
              recommendations={recommendations}
              onJunctionClick={setSelectedJunction}
              selectedPlate={selectedPlate}
            />
          ) : (
            <div className="h-full w-full bg-slate-950 flex items-center justify-center text-slate-600 text-sm">
              Loading city data...
            </div>
          )}
        </div>

        {/* Right Panel: 38% */}
        <div className="flex-[38] flex flex-col gap-3 min-h-0 overflow-y-auto">
          {/* Alerts */}
          <div className="shrink-0">
            <AlertsPanel />
          </div>
          {/* Repeat Offenders */}
          <div className="shrink-0">
            <RepeatOffenders selectedPlate={selectedPlate} onSelectPlate={setSelectedPlate} />
          </div>
          {/* Enforcement Simulator */}
          <div className="shrink-0">
            <EnforcementSimulator defaultJunction={selectedJunction} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
