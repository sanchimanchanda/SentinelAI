import easyocr
import re

reader = None  # Lazy load

PLATE_REGEX = r'^[A-Z]{2}\d{2}[A-Z]{0,2}\d{4}$'

def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'], gpu=False)
    return reader

def extract_plate(image_path: str) -> dict:
    """
    Extract license plate text from image.
    Returns: {"plate": "KA05MX4421", "plate_confidence": 0.87} or {"plate": None, "plate_confidence": 0}
    """
    r = get_reader()
    results = r.readtext(image_path)
    for (bbox, text_val, conf) in results:
        cleaned = text_val.replace(' ', '').replace('-', '').upper()
        if re.match(PLATE_REGEX, cleaned) and len(cleaned) >= 9:
            return {"plate": cleaned, "plate_confidence": round(conf, 2)}
    return {"plate": None, "plate_confidence": 0.0}
