"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DailyBriefing } from "@/lib/types";
import {
  Sunrise, MapPin, Route, Users, UserCheck, Truck,
  Activity, TrendingUp, RefreshCw, Clock
} from "lucide-react";

const HOUR_ICON = <Sunrise className="w-5 h-5 text-amber-400" />;

function BriefingCard({ icon, label, value, sub, color = "text-slate-200" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

export function CommandBriefing() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    try {
      const data = await api.getDailyBriefing();
      setBriefing(data);
      setGenerated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900/60 border-slate-700 backdrop-blur-md h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-base text-slate-100">
          {HOUR_ICON}
          Command Briefing
          {generated && briefing && (
            <span className="ml-auto text-[10px] text-slate-500 font-mono">
              {new Date(briefing.generated_at).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
        {!generated ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Sunrise className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-200 mb-1">Morning Briefing</div>
              <div className="text-sm text-slate-500 max-w-xs">
                Generate a structured operational overview of current traffic enforcement status.
              </div>
            </div>
            <Button
              onClick={generateBriefing}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 transition-all"
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Sunrise className="w-4 h-4 mr-2" />Generate Briefing</>
              )}
            </Button>
          </div>
        ) : briefing ? (
          <>
            {/* Status Row */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">Briefing Ready for Deployment</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateBriefing}
                className="ml-auto h-6 text-[10px] text-slate-500 hover:text-slate-300"
              >
                <RefreshCw className="w-3 h-3 mr-1" />Refresh
              </Button>
            </div>

            {/* Peak Hour Forecast */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Peak Hour Status</div>
                <div className="text-sm font-semibold text-slate-200">{briefing.peak_hour_forecast}</div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <BriefingCard
                icon={<MapPin className="w-4 h-4 text-rose-400" />}
                label="Highest Risk Zone"
                value={briefing.highest_risk}
                sub={`${briefing.highest_risk_count} violations (24h)`}
                color="text-rose-400"
              />
              <BriefingCard
                icon={<Route className="w-4 h-4 text-fuchsia-400" />}
                label="Most Active Corridor"
                value={briefing.top_corridor}
                color="text-fuchsia-400"
              />
              <BriefingCard
                icon={<Users className="w-4 h-4 text-orange-400" />}
                label="Repeat Offenders"
                value={briefing.repeat_offender_count}
                sub="vehicles on watchlist"
                color="text-orange-400"
              />
              <BriefingCard
                icon={<Activity className="w-4 h-4 text-amber-400" />}
                label="Top Violation"
                value={briefing.top_violation_type}
                color="text-amber-400"
              />
            </div>

            {/* Recommended Resources */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Recommended Resources
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5">
                  <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-lg font-black text-cyan-400">{briefing.recommended_officers}</div>
                    <div className="text-[10px] text-slate-500">Officers</div>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-lg font-black text-amber-400">{briefing.recommended_tow_units}</div>
                    <div className="text-[10px] text-slate-500">Tow Units</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Stats */}
            {briefing.zone_stats.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Top Zones (24h)</div>
                <div className="space-y-1.5">
                  {briefing.zone_stats.map((z, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                      <span className="text-sm text-slate-300 font-medium">{z.zone}</span>
                      <span className="ml-auto text-xs font-mono text-slate-400">{z.violation_count} violations</span>
                      <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">{z.top_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
