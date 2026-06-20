"use client";
import { DetectionResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertOctagon, ScanLine, Car, MapPin, Clock, ArrowLeft, Zap, Timer, CheckCircle } from "lucide-react";

export function DetectionResultViewer({ result, onReset }: { result: DetectionResult, onReset: () => void }) {
  const isViolation = result.violation !== "Unknown" && result.violation !== "None";

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Process Another Image
        </Button>
        <div className="flex items-center gap-4">
          {result.inference_time && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Zap className="w-3 h-3" />
              Processed in {(result.inference_time.total_ms / 1000).toFixed(2)}s
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-mono text-slate-500">
            Case ID: <span className="text-slate-300 font-bold">{result.case_id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Col: Image */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/80">
            <CardTitle className="text-sm flex items-center gap-2 font-medium text-slate-300">
              <ScanLine className="w-4 h-4 text-cyan-500" />
              YOLOv8 Detection Output
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex items-center justify-center bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={result.annotated_image_url}
              alt="Analyzed Evidence" 
              className="max-h-[600px] object-contain w-full h-full"
            />
          </CardContent>
        </Card>

        {/* Right Col: Details */}
        <div className="space-y-4 overflow-y-auto">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-medium text-slate-400">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Status</div>
                  {isViolation ? (
                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none py-1">
                      Violation Confirmed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 py-1">
                      No Violation
                    </Badge>
                  )}
                </div>
              </div>

              {isViolation ? (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Detected Rule Break(s)</div>
                    <div className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-mono border border-slate-700 flex items-center gap-1">
                      <ScanLine className="w-3 h-3" />
                      AI Conf: {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.violation.split(",").map((v) => (
                      <Badge key={v.trim()} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm py-1">
                        {v.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-400">No Violations Detected</div>
                  <div className="text-xs text-slate-400 mt-1">AI analysis confirmed compliance with all monitored traffic rules.</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    <MapPin className="w-3 h-3" /> Location
                  </div>
                  <div className="text-sm text-slate-200 truncate">{result.junction}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    <Clock className="w-3 h-3" /> Time
                  </div>
                  <div className="text-sm text-slate-200 truncate font-mono">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Inference Performance */}
              {result.inference_time && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3 h-3" /> Inference Performance
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-slate-500">YOLO</div>
                      <div className="text-sm font-mono text-cyan-400">{result.inference_time.detection_ms}ms</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">OCR</div>
                      <div className="text-sm font-mono text-cyan-400">{result.inference_time.ocr_ms}ms</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="text-sm font-mono text-emerald-400 font-bold">{(result.inference_time.total_ms / 1000).toFixed(2)}s</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">License Plate</div>
                {result.plate ? (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-lg py-1 px-3 border-amber-500/50 text-amber-400 bg-amber-500/10">
                      {result.plate}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      Conf: {Math.round(result.plate_confidence * 100)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-amber-500">Plate not confidently detected</span>
                    <span className="text-xs text-slate-500">Manual Review Required</span>
                  </div>
                )}
              </div>

              {result.is_repeat_offender && result.repeat_offender_data && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-indigo-300 text-sm">Repeat Offender Alert</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>Risk Score: <span className="font-bold text-rose-400">{result.repeat_offender_data.risk_score}</span></div>
                    <div>Past Sightings: <span className="font-bold text-white">{result.repeat_offender_data.sightings}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
