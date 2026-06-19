"use client";
import React from "react";
import { Terminal } from "lucide-react";

const TICKER_ITEMS = [
  "🚨 ALERT: Critical repeat offender [KA05MX4421] tracked crossing Indiranagar Junction (Threat level: CRITICAL).",
  "📊 SIMULATION: Dispatching +2 Officers & Towing Unit to Silk Board Junction -> Projected Congestion Delay: -32%.",
  "🛡️ PRIVACY AUDIT: Generated SHA-256 block hash for latest detection payload and successfully logged to ledger.",
  "📈 CORRIDOR FORECAST: Volume on MG Road -> Indiranagar corridor predicted to escalate by +24% within the next hour.",
  "🚨 INTRUSION: Helmetless riding violation registered at Koramangala Junction. Dispatch recommendation issued.",
  "🛡️ SECURITY: Privacy Shield active. Real-time blurring applied to 4 non-violating vehicle plates & 2 pedestrian faces.",
  "📊 LOGISTICS: Recommended resources deployed at Whitefield Sector (Confidence: 94%).",
  "📉 METRIC: System average clearance time reduced to 4.2 minutes after proactive resource balancing."
];

export function LiveTicker() {
  // We duplicate the list to make the scrolling continuous and seamless
  const scrollItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="fixed bottom-0 left-0 w-full h-8 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md flex items-center font-mono select-none overflow-hidden shrink-0 z-50">
      {/* Pinned Title Badge */}
      <div className="h-full px-4 bg-slate-900 border-r border-slate-800 flex items-center gap-1.5 shrink-0 z-10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        Telemetry Feed
      </div>

      {/* Marquee Wrapper */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <div className="marquee flex gap-12 whitespace-nowrap text-[11px] text-slate-400 font-medium">
          {scrollItems.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span className="text-cyan-500/60">•</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .marquee:hover {
          animation-play-state: paused;
        }
        @keyframes scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
