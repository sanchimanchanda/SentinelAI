import type { Hotspot, Violation, Recommendation, Alert, Corridor, RepeatOffender, DailyBriefing, DetectionResult, IntelligenceResponse } from "./types";

const BASE_URL = "/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
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
  detect: (formData: FormData) => fetch(`${BASE_URL}/detect`, { method: "POST", body: formData }).then(r => r.json()) as Promise<DetectionResult>,
  queryIntelligence: (question: string) => fetchAPI<IntelligenceResponse>("/intelligence", {
    method: "POST",
    body: JSON.stringify({ question }),
  }),
};
