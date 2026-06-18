"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Flame, Activity, Hash } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

export function LiveHotspots() {
  const { data: hotspots, loading } = usePolling(() => api.getHotspots(24), 15000);

  if (loading && !hotspots) {
    return <Card className="bg-slate-900 border-slate-800 animate-pulse"><CardContent className="h-[400px]"></CardContent></Card>;
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Flame className="w-5 h-5 text-orange-500" />
          Live Hotspots (24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
          {hotspots?.map((hotspot) => (
            <div key={hotspot.junction_id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{hotspot.junction}</span>
                  <Badge variant="outline" className={`
                    ${hotspot.severity === 'HIGH' ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' : 
                      hotspot.severity === 'MEDIUM' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 
                      'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'}
                  `}>
                    {hotspot.severity}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {hotspot.violation_count} violations</span>
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Risk: {hotspot.risk_score}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Top Violation</div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] rounded-sm py-0 h-5">
                  {hotspot.top_violation_type}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
