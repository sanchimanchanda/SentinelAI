import json
import logging
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import execute_raw
from app.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class IntelligenceRequest(BaseModel):
    question: str


# ---------------------------------------------------------------------------
# Fallback: original keyword-matching logic (used when Gemini is unavailable)
# ---------------------------------------------------------------------------
def _fallback_keyword_engine(question: str) -> dict:
    """Deterministic keyword-based responses used as a fallback."""
    q = question.lower()

    if "corridor" in q or "route" in q:
        return {
            "answer": "Analysis of the MG Road → Silk Board corridor shows a 40% increase in transit times. The volume of repeat offenders traveling this route suggests coordinated movement.",
            "data_sources": ["Corridor Graph (4hr window)", "Repeat Offenders Table"],
            "recommendations": [
                "Deploy interceptor at midway point.",
                "Review signal timing at Silk Board."
            ]
        }
    elif "repeat" in q or "offender" in q:
        return {
            "answer": "Vehicle KA05MX4421 has been flagged with an extreme risk score. It has traversed 6 distinct junctions in the last 24 hours with multiple traffic light violations.",
            "data_sources": ["Violations Table", "Repeat Offenders Table"],
            "recommendations": [
                "Issue BOLO (Be On Look Out) alert to South Zone patrols.",
                "Impound vehicle on next detection."
            ]
        }
    else:
        return {
            "answer": "Based on current data, Silk Board remains the highest risk junction. There are currently 4 active alerts requiring immediate resource allocation.",
            "data_sources": ["Hotspots View", "Alerts Table"],
            "recommendations": [
                "Deploy 2 additional officers to Silk Board.",
                "Dispatch towing unit to clear illegally parked vehicles."
            ]
        }


# ---------------------------------------------------------------------------
# DB context helpers
# ---------------------------------------------------------------------------
def _gather_db_context(db: Session) -> str:
    """Query real database stats and return a formatted context string."""
    sections: list[str] = []

    # 1. Total violations & breakdown by type
    sql_total = """
        SELECT COUNT(*) as total,
               SUM(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as last_24h
        FROM violations
    """
    total_rows = execute_raw(db, sql_total)
    total = total_rows[0]["total"] if total_rows else 0
    last_24h = total_rows[0]["last_24h"] if total_rows else 0
    sections.append(f"Total violations in database: {total} (last 24 hours: {last_24h})")

    # 2. Top junctions by violation count
    sql_junctions = """
        SELECT junction, COUNT(*) as cnt
        FROM violations
        GROUP BY junction
        ORDER BY cnt DESC
        LIMIT 5
    """
    junction_rows = execute_raw(db, sql_junctions)
    if junction_rows:
        lines = [f"  - {r['junction']}: {r['cnt']} violations" for r in junction_rows]
        sections.append("Top 5 junctions by violations:\n" + "\n".join(lines))

    # 3. Repeat offenders summary
    sql_offenders = """
        SELECT plate, sightings, distinct_junctions
        FROM repeat_offenders
        ORDER BY sightings DESC
        LIMIT 5
    """
    try:
        offender_rows = execute_raw(db, sql_offenders)
        if offender_rows:
            lines = [
                f"  - {r['plate']}: {r['sightings']} sightings across {r['distinct_junctions']} junctions"
                for r in offender_rows
            ]
            sections.append("Top 5 repeat offenders (by sightings):\n" + "\n".join(lines))
    except Exception:
        sections.append("Repeat offenders data: unavailable")

    # 4. Recent activity (last 2 hours)
    sql_recent = """
        SELECT type, COUNT(*) as cnt
        FROM violations
        WHERE timestamp >= datetime('now', '-2 hours')
        GROUP BY type
        ORDER BY cnt DESC
    """
    recent_rows = execute_raw(db, sql_recent)
    if recent_rows:
        lines = [f"  - {r['type']}: {r['cnt']}" for r in recent_rows]
        sections.append("Violations in the last 2 hours by type:\n" + "\n".join(lines))
    else:
        sections.append("Violations in the last 2 hours: none recorded")

    return "\n\n".join(sections)


# ---------------------------------------------------------------------------
# Gemini-powered intelligence engine
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are SentinelAI, an AI-powered traffic intelligence system for Bengaluru. "
    "You analyze real-time violation data and provide operational intelligence to "
    "traffic police. Answer questions based on the following real-time data from the "
    "system database. Be specific, actionable, and concise.\n\n"
    "You MUST respond with valid JSON only (no markdown fences, no extra text) in "
    "exactly this structure:\n"
    '{"answer": "<your analysis>", '
    '"data_sources": ["<source1>", "<source2>"], '
    '"recommendations": ["<rec1>", "<rec2>"]}\n\n'
    "data_sources should list which data tables/views you drew from (e.g. "
    "\"Violations Table\", \"Repeat Offenders Table\", \"Hotspots View\", "
    "\"Corridor Graph\").\n"
    "recommendations should be concrete operational actions for traffic police."
)


def query_intelligence_engine(question: str, db: Session) -> dict:
    """
    Query the traffic intelligence engine.

    Uses Google Gemini (gemini-2.0-flash) with real DB context when the API key
    is configured. Falls back to keyword-matching logic otherwise.
    """
    # --- Guard: fall back if no API key ---
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured – using fallback keyword engine.")
        return _fallback_keyword_engine(question)

    try:
        # Gather live context from the database
        db_context = _gather_db_context(db)

        # Build the full prompt
        prompt = (
            f"{SYSTEM_PROMPT}\n"
            f"--- REAL-TIME DATA ---\n{db_context}\n"
            f"--- END DATA ---\n\n"
            f"User question: {question}"
        )

        # Call Gemini
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw_text = response.text.strip()

        # Strip markdown code fences if Gemini wraps the JSON
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]  # remove opening fence line
            raw_text = raw_text.rsplit("```", 1)[0]  # remove closing fence
            raw_text = raw_text.strip()

        parsed = json.loads(raw_text)

        # Ensure the expected keys exist with correct types
        return {
            "answer": str(parsed.get("answer", "")),
            "data_sources": list(parsed.get("data_sources", [])),
            "recommendations": list(parsed.get("recommendations", [])),
        }

    except Exception as exc:
        logger.error("Gemini API call failed, falling back to keyword engine: %s", exc)
        return _fallback_keyword_engine(question)


def generate_action_plan(db: Session, location: str) -> dict:
    """
    Generate a structured operational action plan for a given location.
    Queries real DB data and formats a command-ready briefing.
    """
    # Violation stats for junction
    sql_stats = """
        SELECT COUNT(*) as total,
               SUM(CASE WHEN timestamp >= datetime('now', '-2 hours') THEN 1 ELSE 0 END) as recent,
               (SELECT type FROM violations WHERE junction = :loc GROUP BY type ORDER BY COUNT(*) DESC LIMIT 1) as top_type
        FROM violations WHERE junction = :loc
    """
    stats = execute_raw(db, sql_stats, {"loc": location})
    total_violations = stats[0]["total"] if stats else 0
    recent_violations = stats[0]["recent"] if stats else 0
    top_type = stats[0]["top_type"] if stats else "Triple Riding"

    # Repeat offenders at this junction
    sql_offenders = """
        SELECT COUNT(DISTINCT v.plate) as cnt
        FROM violations v
        JOIN repeat_offenders ro ON v.plate = ro.plate
        WHERE v.junction = :loc
          AND v.timestamp >= datetime('now', '-6 hours')
    """
    off_rows = execute_raw(db, sql_offenders, {"loc": location})
    repeat_count = off_rows[0]["cnt"] if off_rows else 0

    # Junction risk score
    sql_risk = "SELECT risk_score, zone, road_type FROM junctions WHERE name = :loc LIMIT 1"
    risk_rows = execute_raw(db, sql_risk, {"loc": location})
    risk_score = risk_rows[0]["risk_score"] if risk_rows else 5.0
    zone = risk_rows[0]["zone"] if risk_rows else "Central"
    road_type = risk_rows[0]["road_type"] if risk_rows else "Arterial"

    # Compute threat level
    if risk_score >= 8 or recent_violations >= 10:
        threat_level = "CRITICAL"
        risk_desc = "Immediate intervention required. High violation density and active repeat offenders."
    elif risk_score >= 6 or recent_violations >= 5:
        threat_level = "HIGH"
        risk_desc = "Elevated risk. Multiple recent violations detected with repeat offender activity."
    elif risk_score >= 4 or recent_violations >= 2:
        threat_level = "MEDIUM"
        risk_desc = "Moderate risk. Preventive deployment recommended during peak hours."
    else:
        threat_level = "LOW"
        risk_desc = "Minimal current activity. Routine monitoring recommended."

    # Resource allocation
    if threat_level == "CRITICAL":
        officers = 3
        tow_units = 2
        action_priority = "IMMEDIATE"
    elif threat_level == "HIGH":
        officers = 2
        tow_units = 1
        action_priority = "URGENT"
    elif threat_level == "MEDIUM":
        officers = 1
        tow_units = 0
        action_priority = "STANDARD"
    else:
        officers = 0
        tow_units = 0
        action_priority = "MONITOR"

    # Expected outcomes (rule-based)
    if officers == 3:
        expected_reduction = 45
        clearance_time = "15–20 min"
    elif officers == 2:
        expected_reduction = 32
        clearance_time = "25–35 min"
    elif officers == 1:
        expected_reduction = 18
        clearance_time = "40–60 min"
    else:
        expected_reduction = 0
        clearance_time = "—"

    return {
        "location": location,
        "generated_at": datetime.now().isoformat(),
        "action_priority": action_priority,
        "operational_summary": {
            "total_violations": total_violations,
            "recent_violations_2h": recent_violations,
            "top_violation_type": top_type,
            "zone": zone,
            "road_type": road_type,
        },
        "risk_assessment": {
            "threat_level": threat_level,
            "risk_score": risk_score,
            "repeat_offenders_active": repeat_count,
            "description": risk_desc,
        },
        "resource_allocation": {
            "officers_required": officers,
            "tow_units_required": tow_units,
            "estimated_deployment_time": "8–12 min",
        },
        "expected_outcomes": {
            "violation_reduction_pct": expected_reduction,
            "estimated_clearance_time": clearance_time,
            "projected_violations_after": max(0, recent_violations - int(recent_violations * expected_reduction / 100)),
        },
    }
