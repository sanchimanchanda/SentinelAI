"use client";
import { useState, useEffect } from "react";
import { UploadCloud, AlertTriangle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DetectionResult } from "@/lib/types";
import { DetectionResultViewer } from "./DetectionResultViewer";

interface Junction {
  id: number;
  name: string;
}

export function EvidenceUpload({ onDetectionComplete, blurPedestrians = true }: { onDetectionComplete?: (r: DetectionResult) => void, blurPedestrians?: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [selectedJunction, setSelectedJunction] = useState<number>(1);
  const [normalize, setNormalize] = useState(false);

  useEffect(() => {
    api.getJunctions()
      .then((data: Junction[]) => {
        setJunctions(data);
        if (data.length > 0) setSelectedJunction(data[0].id);
      })
      .catch((e) => console.error("Failed to load junctions", e));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const loadExample = async (filename: string) => {
    try {
      const response = await fetch(`/example/${filename}`);
      const blob = await response.blob();
      const exampleFile = new File([blob], filename, { type: blob.type });
      setFile(exampleFile);
      setPreviewUrl(URL.createObjectURL(exampleFile));
      setResult(null);
      setError(null);
    } catch (e) {
      console.error("Failed to load example", e);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("junction_id", String(selectedJunction));
    formData.append("blur_pedestrians", blurPedestrians ? "true" : "false");
    formData.append("normalize", normalize ? "true" : "false");

    try {
      const data = await api.detect(formData);
      if ((data as { error?: string }).error) throw new Error((data as { error?: string }).error);
      setResult(data);
      onDetectionComplete?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  if (result) {
    return <DetectionResultViewer result={result} onReset={reset} />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      <div 
        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
          previewUrl ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-600'
        }`}
      >
        {!previewUrl ? (
          <>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">Upload Traffic Evidence</h3>
            <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
              Select an image from a traffic camera. The Evidence Engine will run YOLOv8 detection and EasyOCR.
            </p>
            
            {/* Junction Selector */}
            <div className="w-full max-w-xs mb-6">
              <label className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-2">
                <MapPin className="w-3 h-3" /> Camera Location
              </label>
              <select 
                value={selectedJunction}
                onChange={(e) => setSelectedJunction(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none"
              >
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2 mt-3 pl-1">
                <input 
                  type="checkbox" 
                  id="normalize-empty"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
                />
                <label htmlFor="normalize-empty" className="text-sm text-slate-300 select-none cursor-pointer">
                  Enhance Low Quality Images
                </label>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              <div className="relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept="image/jpeg,image/png"
                  onChange={handleFileSelect}
                />
                <Button variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700">
                  Select Image
                </Button>
              </div>

              <div className="w-full max-w-md mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Or Try Examples</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadExample("tripleride.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">Triple Ride</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("nohelmet.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">No Helmet</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("helmet.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">With Helmet</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("seatbelt.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">With Seatbelt</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("noseatbelt.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">No Seatbelt</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("numberplate.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">Number Plate</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("redlight.jpg")} className="border-red-500/50 bg-red-500/10 text-xs text-red-300 hover:bg-red-500/20">🔴 Red Light</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("greenlight.jpg")} className="border-green-500/50 bg-green-500/10 text-xs text-green-300 hover:bg-green-500/20">🟢 Green Light</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("wrongside.jpg")} className="border-orange-500/50 bg-orange-500/10 text-xs text-orange-300 hover:bg-orange-500/20">⚠️ Wrong Side</Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample("novoilation.jpg")} className="border-slate-700 bg-slate-900/50 text-xs">Clean Record</Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Junction selector when image is selected */}
            <div className="w-full max-w-xs mb-4">
              <label className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1.5">
                <MapPin className="w-3 h-3" /> Camera Location
              </label>
              <select 
                value={selectedJunction}
                onChange={(e) => setSelectedJunction(Number(e.target.value))}
                disabled={isProcessing}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none disabled:opacity-50"
              >
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2 mt-3 pl-1">
                <input 
                  type="checkbox" 
                  id="normalize-preview"
                  checked={normalize}
                  onChange={(e) => setNormalize(e.target.checked)}
                  disabled={isProcessing}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 disabled:opacity-50"
                />
                <label htmlFor="normalize-preview" className={`text-sm select-none cursor-pointer ${isProcessing ? 'text-slate-500' : 'text-slate-300'}`}>
                  Enhance Low Quality Images
                </label>
              </div>
            </div>

            <div className="relative w-full max-w-sm mb-6 flex justify-center mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="max-h-64 object-contain rounded-lg border border-slate-700 shadow-xl w-full" />
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-lg flex flex-col items-center justify-center backdrop-blur-sm border border-cyan-500/30 z-10">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                  <div className="text-cyan-400 font-bold tracking-widest text-sm animate-pulse">ANALYZING AI EVIDENCE</div>
                  <div className="text-xs text-cyan-500/70 mt-1">Running YOLOv8 + OCR Pipeline</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={reset} disabled={isProcessing} className="text-slate-400">
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isProcessing}
                className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[140px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Run Analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 w-full p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
