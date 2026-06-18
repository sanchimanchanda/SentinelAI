export interface Hotspot {
  junction_id: number;
  junction: string;
  lat: number;
  lon: number;
  violation_count: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  top_violation_type: string;
  risk_score: number;
}

export interface Violation {
  id: number;
  timestamp: string;
  junction: string;
  lat: number;
  lon: number;
  type: string;
  confidence: number;
  plate: string | null;
  plate_confidence: number;
  status: string;
}

export interface Recommendation {
  junction: string;
  lat: number;
  lon: number;
  confidence: number;
  reason: string;
  recommended_resources: string;
}

export interface Alert {
  id: number;
  junction_id: number;
  junction: string;
  severity: "HIGH" | "MEDIUM";
  message: string;
  action: string;
  created_at: string;
  status: string;
}

export interface Corridor {
  from_junction: string;
  to_junction: string;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  weight: number;
  avg_transit_minutes: number;
  plates: string[];
}

export interface RepeatOffender {
  plate: string;
  sightings: number;
  distinct_junctions: number;
  risk_score: number;
  last_seen: string;
  junctions_list: string[];
}

export interface DailyBriefing {
  summary: string;
  highest_risk: string;
  top_corridor: string;
  trend: string;
  recommendation: string;
  zone_stats: ZoneStat[];
  generated_at: string;
  ai_summary?: string;
}

export interface ZoneStat {
  zone: string;
  violation_count: number;
  top_type: string;
}

export interface DetectionResult {
  case_id: string;
  violation: string;
  confidence: number;
  plate: string | null;
  plate_confidence: number;
  is_repeat_offender: boolean;
  repeat_offender_data: RepeatOffender | null;
  annotated_image_url: string;
  junction: string;
  timestamp: string;
}

export interface IntelligenceResponse {
  answer: string;
  data_sources: string[];
  recommendations: string[];
}
