import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db, execute_raw
from app.config import settings
from app.services.detector import detect_triple_riding
from app.services.ocr import extract_plate
from app.services.evidence import create_evidence_case

router = APIRouter()

@router.post("/detect")
async def detect_violation(
    image: UploadFile = File(...),
    junction_id: int = Form(...),
    db: Session = Depends(get_db),
):
    """Upload image → detect violation → OCR → create case."""
    # Save uploaded file temporarily
    temp_path = os.path.join(settings.EVIDENCE_DIR, f"temp_{image.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        # Get junction info
        junction = execute_raw(db, "SELECT id, name, lat, lon FROM junctions WHERE id = :id", {"id": junction_id})
        if not junction:
            return {"error": "Junction not found"}
        j = junction[0]

        # Run detection pipeline
        detection = detect_triple_riding(temp_path)
        ocr_result = extract_plate(temp_path)

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
        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
