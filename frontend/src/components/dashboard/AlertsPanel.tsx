"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { AlertTriangle, CheckCircle2, Siren } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

export function AlertsPanel() {
  const { data: alerts, loading, refresh } = usePolling(api.getAlerts, 10000);

  const handleAck = async (id: number) => {
    await api.acknowledgeAlert(id);
    refresh();
  };

  if (loading && !alerts) {
    return <Card className="bg-slate-900 border-slate-800 animate-pulse"><CardContent className="h-48"></CardContent></Card>;
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-800">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Siren className="w-5 h-5 text-rose-500" />
          Active Alerts
          <span className="ml-auto bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded-full">
            {alerts?.length || 0}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 max-h-[300px] overflow-y-auto space-y-3">
        {alerts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-8 gap-2">
            <CheckCircle2 className="w-8 h-8 opacity-20" />
            <span className="text-sm">No active alerts</span>
          </div>
        ) : (
          alerts?.map((alert) => (
            <Alert 
              key={alert.id} 
              variant={alert.severity === "HIGH" ? "destructive" : "default"}
              className={`border-l-4 ${
                alert.severity === "HIGH" 
                  ? "border-l-rose-500 bg-rose-500/10 border-rose-500/20" 
                  : "border-l-amber-500 bg-amber-500/10 border-amber-500/20 text-amber-500"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex justify-between items-center text-sm font-semibold">
                {alert.junction}
                <span className="text-[10px] uppercase font-mono opacity-70">
                  {new Date(alert.created_at).toLocaleTimeString()}
                </span>
              </AlertTitle>
              <AlertDescription className="text-xs mt-1 opacity-90 space-y-2">
                <p>{alert.message}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
                  <span className="font-mono text-[10px]">{alert.action}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] hover:bg-current/20"
                    onClick={() => handleAck(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}
