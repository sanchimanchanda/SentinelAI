import os
import shutil
import time
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_raw
from app.config import settings
from app.services.detector import detect_triple_riding
from app.services.ocr import extract_plate
from app.services.evidence import create_evidence_case

router = APIRouter()

@router.get("/junctions")
def list_junctions(db: Session = Depends(get_db)):
    """Return all junctions for the dropdown selector."""
    rows = execute_raw(db, "SELECT id, name FROM junctions ORDER BY name")
    return rows

@router.post("/detect")
async def detect_violation(
    image: UploadFile = File(...),
    junction_id: int = Form(...),
    db: Session = Depends(get_db),
):
    """Upload image → detect violation → OCR → create case."""
    # Validate file type
    if image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")

    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(image.filename or "upload.jpg").replace("..", "")
    temp_path = os.path.join(settings.EVIDENCE_DIR, f"temp_{safe_filename}")
    
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        # Get junction info
        junction = execute_raw(db, "SELECT id, name, lat, lon FROM junctions WHERE id = :id", {"id": junction_id})
        if not junction:
            raise HTTPException(status_code=404, detail="Junction not found")
        j = junction[0]

        # Run detection pipeline with timing
        t_start = time.time()
        detection = detect_triple_riding(temp_path)
        t_detect = time.time()
        ocr_result = extract_plate(temp_path)
        t_ocr = time.time()

        # Create evidence case
        result = create_evidence_case(
            image_path=temp_path,
            detection=detection,
            ocr_result=ocr_result,
            junction_id=j["id"],
            junction_name=j["name"],
            junction_lat=j["lat"],
            junction_lon=j["lon"],
            db=db,
        )

        # Add performance metrics
        result["inference_time"] = {
            "detection_ms": round((t_detect - t_start) * 1000),
            "ocr_ms": round((t_ocr - t_detect) * 1000),
            "total_ms": round((t_ocr - t_start) * 1000),
        }

        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
