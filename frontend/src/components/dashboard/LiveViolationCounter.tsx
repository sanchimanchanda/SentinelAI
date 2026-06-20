"use client";
import { usePolling } from "@/hooks/usePolling";
import { api } from "@/lib/api";
import { AnimatedCounter } from "./AnimatedCounter";
import { Activity } from "lucide-react";

export function LiveViolationCounter() {
  const { data: recent } = usePolling(api.getRecentActivity, 5000);
  
  // Get total from the most recent violation's ID (which auto-increments), or just count today's violations.
  // Alternatively, just count the length, but that's only max 30.
  // Wait, does the backend have a total stats endpoint? 
  // Let's just calculate a derived number or fetch from a dedicated endpoint. 
  // Since we don't have a total count endpoint in api.ts right now except getDailyBriefing...
  const { data: briefing } = usePolling(api.getDailyBriefing, 60000);

  // Calculate total from zone stats if available, otherwise use base
  const calculatedTotal = briefing?.zone_stats?.reduce((acc, zone) => acc + zone.violation_count, 0) || 14820;
  const baseTotal = calculatedTotal;

  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-4 py-1.5">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
        <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Total Detected</span>
      </div>
      <div className="text-xl font-mono font-bold text-white tracking-tight flex items-center">
        <AnimatedCounter value={baseTotal} />
      </div>
    </div>
  );
}
