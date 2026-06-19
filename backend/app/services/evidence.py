import os
import random
from datetime import datetime
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Violation
from app.database import execute_raw

def generate_case_id() -> str:
    """Generate unique case ID like TV-20260619-173215-4821."""
    now = datetime.now()
    rand = random.randint(1000, 9999)
    return f"TV-{now.strftime('%Y%m%d-%H%M%S')}-{rand}"

def annotate_image(image_path: str, detection: dict, output_path: str):
    """Draw bounding boxes on image and save."""
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)

    # Draw motorcycle box (green)
    if "motorcycle_box" in detection:
        box = detection["motorcycle_box"]
        draw.rectangle(box, outline="lime", width=3)
        draw.text((box[0], box[1] - 15), "Motorcycle", fill="lime")

    # Draw person boxes (red)
    for i, pbox in enumerate(detection.get("person_boxes", [])):
        draw.rectangle(pbox, outline="red", width=2)
        draw.text((pbox[0], pbox[1] - 15), f"Person {i+1}", fill="red")

    img.save(output_path)

def create_evidence_case(
    image_path: str,
    detection: dict | None,
    ocr_result: dict,
    junction_id: int,
    junction_name: str,
    junction_lat: float,
    junction_lon: float,
    db: Session,
) -> dict:
    """Create complete evidence case."""
    case_id = generate_case_id()
    now = datetime.now()

    # Annotate image
    annotated_filename = f"{case_id}.jpg"
    annotated_path = os.path.join(settings.EVIDENCE_DIR, annotated_filename)
    if detection:
        annotate_image(image_path, detection, annotated_path)
    else:
        # Copy original if no detection
        Image.open(image_path).save(annotated_path)

    # Determine violation
    violation_type = detection["violation"] if detection else "Unknown"
    confidence = detection["confidence"] if detection else 0.0

    # Save to DB
    v = Violation(
        timestamp=now,
        junction_id=junction_id,
        junction=junction_name,
        lat=junction_lat,
        lon=junction_lon,
        type=violation_type,
        confidence=confidence,
        vehicle=detection.get("vehicle", "unknown") if detection else "unknown",
        plate=ocr_result.get("plate"),
        plate_confidence=ocr_result.get("plate_confidence", 0.0),
        image_path=f"/evidence/{annotated_filename}",
        status="OPEN",
        source="upload",
    )
    db.add(v)
    db.flush()

    # Check repeat offender
    is_repeat = False
    offender_data = None
    if ocr_result.get("plate"):
        rows = execute_raw(db, """
            SELECT plate, sightings, distinct_junctions, last_seen, junctions_list
            FROM repeat_offenders WHERE plate = :plate
        """, {"plate": ocr_result["plate"]})
        if rows:
            is_repeat = True
            from app.services.offenders import calculate_offender_score
            r = rows[0]
            recent = execute_raw(db, """
                SELECT COUNT(*) as cnt FROM violations
                WHERE plate = :plate AND timestamp >= datetime('now', '-3 hours')
            """, {"plate": ocr_result["plate"]})
            recent_count = recent[0]["cnt"] if recent else 0
            offender_data = {
                **r,
                "risk_score": calculate_offender_score(r["sightings"], r["distinct_junctions"], recent_count),
                "junctions_list": r["junctions_list"].split(",") if r["junctions_list"] else [],
            }

    db.commit()

    return {
        "case_id": case_id,
        "violation": violation_type,
        "confidence": confidence,
        "plate": ocr_result.get("plate"),
        "plate_confidence": ocr_result.get("plate_confidence", 0.0),
        "is_repeat_offender": is_repeat,
        "repeat_offender_data": offender_data,
        "annotated_image_url": f"/evidence/{annotated_filename}",
        "junction": junction_name,
        "timestamp": now.isoformat(),
    }
