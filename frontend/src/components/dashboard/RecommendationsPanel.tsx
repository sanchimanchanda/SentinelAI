"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Crosshair, ShieldCheck, MapPin } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

export function RecommendationsPanel() {
  const { data: recommendations, loading } = usePolling(api.getRecommendations, 30000);

  if (loading && !recommendations) {
    return <Card className="bg-slate-900 border-slate-800 animate-pulse"><CardContent className="h-[400px]"></CardContent></Card>;
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Crosshair className="w-5 h-5 text-cyan-500" />
          Deployment Planner
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
          {recommendations?.map((rec, i) => (
            <div key={i} className="p-4 flex flex-col gap-2 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {rec.junction}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Confidence</div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 font-mono">
                    {rec.confidence}%
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                {rec.reason}
              </p>
              <div className="pl-6 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-400">{rec.recommended_resources}</span>
              </div>
            </div>
          ))}
          {recommendations?.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">No current deployment recommendations.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
