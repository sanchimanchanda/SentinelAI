import { EvidenceUpload } from "@/components/evidence/EvidenceUpload";

export default function EvidencePage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Evidence Processing</h1>
          <p className="text-sm text-slate-400 mt-1">Upload images to detect traffic violations.</p>
        </div>
      </div>
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <EvidenceUpload />
      </div>
    </div>
  );
}
