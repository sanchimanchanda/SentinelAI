"use client";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";
import { api } from "@/lib/api";

const Map = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">Loading map...</div>
  }
);

export function CorridorMap() {
  const { data: corridors, loading } = usePolling(api.getCorridors, 60000);

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800 z-10 bg-slate-900">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Route className="w-5 h-5 text-fuchsia-500" />
          Corridor Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative z-0 min-h-[400px]">
        {!loading && corridors && <Map corridors={corridors} />}
      </CardContent>
    </Card>
  );
}
