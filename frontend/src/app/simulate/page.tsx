"use client";
import { useState } from "react";
import { EventSimulationResult } from "@/lib/types";
import { EventSimulatorForm } from "@/components/simulate/EventSimulatorForm";
import { EventSimulatorResult } from "@/components/simulate/EventSimulatorResult";
import { CalendarDays, Info } from "lucide-react";

export default function SimulatePage() {
  const [result, setResult] = useState<EventSimulationResult | null>(null);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Event Traffic Simulator</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Predict congestion impact · Plan diversions · Allocate resources for planned events
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-400">
          <Info className="w-3.5 h-3.5" />
          Solves Theme 2 + Theme 3
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1">
        {/* Form: 2 cols */}
        <div className="lg:col-span-2">
          <EventSimulatorForm onResult={setResult} />
        </div>

        {/* Result: 3 cols */}
        <div className="lg:col-span-3">
          {result ? (
            <EventSimulatorResult result={result} />
          ) : (
            <div className="h-full rounded-2xl border border-dashed border-slate-700/60 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-900/20 min-h-[400px]">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-fuchsia-400 opacity-60" />
              </div>
              <div>
                <div className="font-bold text-slate-400 mb-1">No Simulation Yet</div>
                <div className="text-sm text-slate-600 max-w-sm">
                  Configure an event on the left and click "Simulate Event Impact" to predict 
                  congestion, diversions, and resource requirements.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
