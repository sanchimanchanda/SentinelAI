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

export interface CorridorForecast extends Corridor {
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  forecast: string;
  current_activity: "HIGH" | "MEDIUM" | "LOW";
  escalation_pct: number;
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
  highest_risk_count: number;
  top_corridor: string;
  trend: string;
  recommendation: string;
  zone_stats: ZoneStat[];
  repeat_offender_count: number;
  top_violation_type: string;
  recommended_officers: number;
  recommended_tow_units: number;
  peak_hour_forecast: string;
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
  inference_time?: {
    detection_ms: number;
    ocr_ms: number;
    total_ms: number;
  };
}

export interface IntelligenceResponse {
  answer: string;
  data_sources: string[];
  recommendations: string[];
}

export interface SimulationResult {
  junction: string;
  deployment_type: string;
  deployment_label: string;
  current_violations: number;
  repeat_offenders: number;
  top_violation_type: string;
  reduction_pct: number;
  projected_violations: number;
  violations_prevented: number;
  effectiveness: "VERY HIGH" | "HIGH" | "MODERATE" | "LOW";
  estimated_time_to_clear: string;
  cost_per_hour_inr: number;
}

export interface EventSimulationResult {
  location: string;
  expected_crowd: number;
  duration_hours: number;
  congestion_impact: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  congestion_increase_pct: number;
  predicted_diversions: string[];
  resource_requirements: {
    officers: number;
    tow_units: number;
    barriers: string;
    advance_notice_required: string;
  };
  affected_radius_km: number;
  affected_junctions: string[];
  estimated_peak_delay_minutes: number;
  generated_at: string;
}

export interface DossierMovementStop {
  junction: string;
  lat: number;
  lon: number;
  timestamp: string;
  violation_type: string;
  confidence: number;
}

export interface Dossier {
  found: boolean;
  case_id: string;
  plate: string;
  generated_at: string;
  threat_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  risk_score: number;
  sightings: number;
  distinct_junctions: number;
  first_seen: string;
  last_seen: string;
  last_junction: string;
  last_violation_type: string;
  junction_zone: string;
  junction_risk_score: number;
  movement_path: DossierMovementStop[];
  recommended_action: string;
  status: string;
  evidence_count: number;
}

export interface ActionPlan {
  location: string;
  generated_at: string;
  action_priority: "IMMEDIATE" | "URGENT" | "STANDARD" | "MONITOR";
  operational_summary: {
    total_violations: number;
    recent_violations_2h: number;
    top_violation_type: string;
    zone: string;
    road_type: string;
  };
  risk_assessment: {
    threat_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    risk_score: number;
    repeat_offenders_active: number;
    description: string;
  };
  resource_allocation: {
    officers_required: number;
    tow_units_required: number;
    estimated_deployment_time: string;
  };
  expected_outcomes: {
    violation_reduction_pct: number;
    estimated_clearance_time: string;
    projected_violations_after: number;
  };
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  junction: string;
  event_type: string;
  plate: string;
  confidence: number;
  status: string;
  source: string;
  is_repeat_offender: boolean;
  privacy_blurred: boolean;
}
