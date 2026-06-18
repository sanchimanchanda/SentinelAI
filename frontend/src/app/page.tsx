import { LiveHotspots } from "@/components/dashboard/LiveHotspots";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { RepeatOffenders } from "@/components/dashboard/RepeatOffenders";
import { CorridorMap } from "@/components/dashboard/CorridorMap";

export default function CommandCenter() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      {/* Top Row: Alerts and Hotspots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-1/3 min-h-[300px]">
        <div className="md:col-span-2 h-full">
          <AlertsPanel />
        </div>
        <div className="h-full">
          <LiveHotspots />
        </div>
      </div>

      {/* Bottom Row: Corridors, Recommendations, Offenders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-2/3 min-h-[400px]">
        <div className="md:col-span-1 h-full">
          <RecommendationsPanel />
        </div>
        <div className="md:col-span-1 h-full">
          <CorridorMap />
        </div>
        <div className="md:col-span-1 h-full">
          <RepeatOffenders />
        </div>
      </div>
    </div>
  );
}
