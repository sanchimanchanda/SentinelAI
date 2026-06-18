from ultralytics import YOLO
from app.config import settings

# COCO class IDs
MOTORCYCLE_CLASS = 3
PERSON_CLASS = 0

# Load model once at module level
model = YOLO(settings.YOLO_MODEL_PATH)

def detect_triple_riding(image_path: str) -> dict | None:
    """
    Detect triple riding: motorcycle with 3+ persons.
    Returns detection dict or None if no violation found.
    """
    results = model(image_path, verbose=False)
    boxes = results[0].boxes

    motorcycles = [b for b in boxes if int(b.cls[0]) == MOTORCYCLE_CLASS]
    persons = [b for b in boxes if int(b.cls[0]) == PERSON_CLASS]

    if not motorcycles:
        return None

    for moto in motorcycles:
        mx1, my1, mx2, my2 = moto.xyxy[0].tolist()
        rider_count = 0
        person_boxes = []

        for person in persons:
            px1, py1, px2, py2 = person.xyxy[0].tolist()
            # Check vertical overlap: person center-y within motorcycle bbox
            person_cy = (py1 + py2) / 2
            person_cx = (px1 + px2) / 2
            if mx1 <= person_cx <= mx2 and my1 - 50 <= person_cy <= my2:
                rider_count += 1
                person_boxes.append([px1, py1, px2, py2])

        if rider_count >= 3:
            return {
                "violation": "Triple Riding",
                "confidence": round(float(moto.conf[0]), 2),
                "vehicle": "motorcycle",
                "persons_detected": rider_count,
                "motorcycle_box": [mx1, my1, mx2, my2],
                "person_boxes": person_boxes,
            }

    return None
