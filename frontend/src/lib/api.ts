import type {
  Hotspot, Violation, Recommendation, Alert, Corridor, CorridorForecast,
  RepeatOffender, DailyBriefing, DetectionResult, IntelligenceResponse,
  SimulationResult, EventSimulationResult, Dossier, ActionPlan, AuditLogEntry
} from "./types";

const BASE_URL = "http://localhost:8000/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`API error: ${res.status} ${res.statusText} - ${errorText}`);
  }
  
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  
  return res.text() as any;
}

export const api = {
  // Existing endpoints
  getJunctions: () => fetchAPI<{id: number, name: string}[]>("/junctions"),
  getHotspots: (hours = 24) => fetchAPI<Hotspot[]>(`/hotspots?hours=${hours}`),
  getViolations: (params?: { junction_id?: number; type?: string; hours?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.junction_id) query.set("junction_id", String(params.junction_id));
    if (params?.type) query.set("type", params.type);
    if (params?.hours) query.set("hours", String(params.hours));
    if (params?.limit) query.set("limit", String(params.limit));
    return fetchAPI<Violation[]>(`/violations?${query}`);
  },
  getRecommendations: () => fetchAPI<Recommendation[]>("/recommend"),
  getAlerts: () => fetchAPI<Alert[]>("/alerts"),
  acknowledgeAlert: (id: number) => fetchAPI<{ id: number; status: string }>(`/alerts/${id}/ack`, { method: "PATCH" }),
  getOffenders: (minSightings = 2) => fetchAPI<RepeatOffender[]>(`/offenders?min_sightings=${minSightings}`),
  getCorridors: () => fetchAPI<Corridor[]>("/corridors"),
  getDailyBriefing: () => fetchAPI<DailyBriefing>("/daily-briefing"),
  detect: async (formData: FormData) => {
    const res = await fetch(`${BASE_URL}/detect`, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Detect API failed: ${res.status} ${err}`);
    }
    return res.json() as Promise<DetectionResult>;
  },
  queryIntelligence: (question: string) => fetchAPI<IntelligenceResponse>("/intelligence", {
    method: "POST",
    body: JSON.stringify({ question }),
  }),

  // New endpoints
  getCorridorForecast: () => fetchAPI<CorridorForecast[]>("/corridors/forecast"),
  simulate: (junction: string, deploymentType: string) => fetchAPI<SimulationResult>("/simulate", {
    method: "POST",
    body: JSON.stringify({ junction, deployment_type: deploymentType }),
  }),
  simulateEvent: (location: string, expectedCrowd: number, durationHours: number) =>
    fetchAPI<EventSimulationResult>("/events/simulate", {
      method: "POST",
      body: JSON.stringify({ location, expected_crowd: expectedCrowd, duration_hours: durationHours }),
    }),
  getDossier: (plate: string) => fetchAPI<Dossier>(`/dossier/${encodeURIComponent(plate)}`),
  getActionPlan: (location: string) => fetchAPI<ActionPlan>("/action-plan", {
    method: "POST",
    body: JSON.stringify({ location }),
  }),
  getAuditLog: () => fetchAPI<AuditLogEntry[]>("/audit-log"),
  getPerformanceMetrics: () => fetchAPI<any>("/metrics/performance"),
  getRecentActivity: () => fetchAPI<Violation[]>("/violations?limit=30"),
};
