import Link from "next/link";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <Shield className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg tracking-tight leading-none">SentinelAI</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Traffic Intelligence Command Center</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link href="/" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Command Center</Link>
            <Link href="/evidence" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Evidence</Link>
            <Link href="/intelligence" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">Intelligence Console</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
          <span>{time || "00:00:00"}</span>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            SYSTEM ONLINE
          </div>
        </div>
      </div>
    </nav>
  );
}
