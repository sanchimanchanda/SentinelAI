"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ActionPlan } from "@/lib/types";
import {
  Brain, MapPin, Target, UserCheck, TrendingDown,
  AlertOctagon, CheckCircle2, ChevronRight, Loader2
} from "lucide-react";

const JUNCTIONS = [
  "Silk Board", "Marathahalli", "MG Road", "Koramangala", "Electronic City",
  "Indiranagar", "HSR Layout", "Hebbal", "Whitefield", "Jayanagar",
];

const PRIORITY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  IMMEDIATE: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  URGENT: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  STANDARD: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  MONITOR: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
};

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-amber-400",
  LOW: "text-emerald-400",
};

function SectionBlock({ icon, title, children }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function ActionPlanAgent() {
  const [location, setLocation] = useState("Silk Board");
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [animated, setAnimated] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    setPlan(null);
    setAnimated(false);
    try {
      const data = await api.getActionPlan(location);
      setPlan(data);
      setTimeout(() => setAnimated(true), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const priority = plan ? PRIORITY_STYLES[plan.action_priority] || PRIORITY_STYLES.MONITOR : null;

  return (
    <Card className="bg-slate-900/60 border-slate-700 backdrop-blur-md h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-base text-slate-100">
          <Brain className="w-5 h-5 text-violet-400" />
          Command Agent
          <span className="ml-auto text-[10px] text-slate-600 font-mono">Action Plan Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto min-h-0">
        {/* Input Row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              Select Location
            </label>
            <select
              value={location}
              onChange={e => { setLocation(e.target.value); setPlan(null); }}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 transition-colors"
            >
              {JUNCTIONS.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generatePlan}
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Brain className="w-4 h-4 mr-2" />Generate Plan</>
              )}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-400 animate-pulse">Analyzing {location} intelligence...</p>
          </div>
        )}

        {/* Plan Output */}
        {plan && !loading && (
          <div
            className={`space-y-3 transition-all duration-500 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            {/* Priority Banner */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${priority?.bg} ${priority?.border}`}>
              <AlertOctagon className={`w-5 h-5 ${priority?.color} shrink-0`} />
              <div className="flex-1">
                <div className={`text-sm font-bold ${priority?.color}`}>
                  Action Priority: {plan.action_priority}
                </div>
                <div className="text-[10px] text-slate-500">{plan.location} · {new Date(plan.generated_at).toLocaleTimeString()}</div>
              </div>
            </div>

            {/* Section 1: Operational Summary */}
            <SectionBlock icon={<Target className="w-3.5 h-3.5 text-cyan-400" />} title="Operational Summary">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Violations", value: plan.operational_summary.total_violations, color: "text-slate-200" },
                  { label: "Last 2 Hours", value: plan.operational_summary.recent_violations_2h, color: "text-rose-400" },
                  { label: "Top Violation", value: plan.operational_summary.top_violation_type, color: "text-amber-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                {plan.operational_summary.zone} Zone · {plan.operational_summary.road_type} Road
              </div>
            </SectionBlock>

            {/* Section 2: Risk Assessment */}
            <SectionBlock icon={<AlertOctagon className="w-3.5 h-3.5 text-rose-400" />} title="Risk Assessment">
              <div className="flex items-start gap-3">
                <div className="text-center shrink-0">
                  <div className={`text-3xl font-black ${THREAT_COLORS[plan.risk_assessment.threat_level]}`}>
                    {plan.risk_assessment.threat_level}
                  </div>
                  <div className="text-[10px] text-slate-500">Score: {plan.risk_assessment.risk_score}/10</div>
                </div>
                <div className="flex-1 text-sm text-slate-400 leading-relaxed">
                  {plan.risk_assessment.description}
                  {plan.risk_assessment.repeat_offenders_active > 0 && (
                    <div className="mt-1 text-xs text-orange-400 font-semibold">
                      ⚠ {plan.risk_assessment.repeat_offenders_active} repeat offenders active (6h window)
                    </div>
                  )}
                </div>
              </div>
            </SectionBlock>

            {/* Section 3: Resource Allocation */}
            <SectionBlock icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />} title="Resource Allocation">
              <div className="flex gap-3">
                <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-cyan-400">{plan.resource_allocation.officers_required}</div>
                  <div className="text-[10px] text-slate-500">Officers Required</div>
                </div>
                <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-black text-amber-400">{plan.resource_allocation.tow_units_required}</div>
                  <div className="text-[10px] text-slate-500">Tow Units</div>
                </div>
                <div className="flex-1 bg-slate-700/30 border border-slate-600/30 rounded-lg p-3 text-center">
                  <div className="text-sm font-bold text-slate-300">{plan.resource_allocation.estimated_deployment_time}</div>
                  <div className="text-[10px] text-slate-500">Deploy ETA</div>
                </div>
              </div>
            </SectionBlock>

            {/* Section 4: Expected Outcomes */}
            <SectionBlock icon={<TrendingDown className="w-3.5 h-3.5 text-violet-400" />} title="Expected Outcomes">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-400">{plan.expected_outcomes.violation_reduction_pct}%</div>
                  <div className="text-[10px] text-slate-500">Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-violet-400">{plan.expected_outcomes.estimated_clearance_time}</div>
                  <div className="text-[10px] text-slate-500">Clearance Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-300">{plan.expected_outcomes.projected_violations_after}</div>
                  <div className="text-[10px] text-slate-500">Projected After</div>
                </div>
              </div>
            </SectionBlock>
          </div>
        )}

        {/* Empty State */}
        {!plan && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
            <Brain className="w-12 h-12 text-slate-700" />
            <p className="text-sm text-slate-500">Select a location and generate an action plan to get structured operational intelligence.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
