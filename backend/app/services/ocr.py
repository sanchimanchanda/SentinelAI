import easyocr
import re
import cv2
import numpy as np

reader = None  # Lazy load

# Flexible regex: 2 letters, 2 digits, then 1-3 letters/digits, then 4 digits
# Covers: KA05MX4421, HR26DQ5551, HR26D05551, MH12AB1234, etc.
PLATE_REGEX = r'([A-Z]{2}\d{2}[A-Z0-9]{1,3}\d{4})'
# BH series: 22BH1234AA
BH_REGEX = r'(\d{2}BH\d{4}[A-Z]{1,2})'

# Common OCR misreads to fix
OCR_FIXES = {
    'O': '0',  # Letter O -> digit 0 (only applied in digit positions)
    'I': '1',
    'S': '5',
    'Z': '2',
    'B': '8',
    'G': '6',
    'T': '7',
}


def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'], gpu=False)
    return reader


def preprocess_plate_image(img):
    """
    Preprocess image to dramatically improve OCR accuracy on license plates.
    Returns a list of preprocessed image variants to try.
    """
    variants = []

    # 1. Original grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. High-contrast version using CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    variants.append(enhanced)

    # 3. Adaptive threshold (black text on white)
    thresh = cv2.adaptiveThreshold(
        enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )
    variants.append(thresh)

    # 4. Otsu threshold
    _, otsu = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(otsu)

    # 5. Inverted Otsu (white text on dark plate)
    variants.append(cv2.bitwise_not(otsu))

    # 6. Original color (as baseline)
    variants.append(img)

    return variants


def fix_ocr_misreads(text):
    """
    Try fixing common OCR character misreads based on expected Indian plate format.
    Indian plates: SS DD SS DDDD or SS DD S DDDD (S=state letter, D=digit)
    """
    if len(text) < 8:
        return text

    # The first 2 chars should be letters, chars 3-4 should be digits
    fixed = list(text)

    # Fix positions 2-3 (should be digits)
    for i in [2, 3]:
        if i < len(fixed) and fixed[i] in OCR_FIXES:
            fixed[i] = OCR_FIXES[fixed[i]]

    # Fix last 4 positions (should be digits)
    for i in range(max(4, len(fixed) - 4), len(fixed)):
        if fixed[i] in OCR_FIXES:
            fixed[i] = OCR_FIXES[fixed[i]]

    return ''.join(fixed)


def try_extract_plate(text):
    """Try to extract a plate number from cleaned text using multiple strategies."""
    # Remove common noise
    cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())

    # Remove 'IND' prefix (embossed on Indian plates)
    for prefix in ['IND', 'INDIA']:
        cleaned = cleaned.replace(prefix, '')

    # Strategy 1: Direct regex match
    match = re.search(PLATE_REGEX, cleaned)
    if match:
        return match.group(0)

    # Strategy 2: BH series match
    bh_match = re.search(BH_REGEX, cleaned)
    if bh_match:
        return bh_match.group(0)

    # Strategy 3: Fix OCR misreads and try again
    fixed = fix_ocr_misreads(cleaned)
    match = re.search(PLATE_REGEX, fixed)
    if match:
        return match.group(0)

    bh_match = re.search(BH_REGEX, fixed)
    if bh_match:
        return bh_match.group(0)

    # Strategy 4: Sliding window — find any 9-10 char substring that looks plate-like
    # Pattern: 2+ alpha, 2+ digit, 1+ alpha/digit, 3-4 digits
    LOOSE_REGEX = r'([A-Z]{2}\d{2}[A-Z0-9]{1,4}\d{3,4})'
    match = re.search(LOOSE_REGEX, fixed)
    if match:
        return match.group(0)

    # Strategy 5: Extract the longest alphanumeric run that's plate-length
    runs = re.findall(r'[A-Z0-9]{8,12}', cleaned)
    if runs:
        # Pick the one that starts with 2 letters (most likely a plate)
        for run in runs:
            if re.match(r'^[A-Z]{2}\d', run):
                return run
        return runs[0]

    return None


def extract_plate(image_path: str) -> dict:
    """
    Extract license plate text from image.
    Returns: {"plate": "KA05MX4421", "plate_confidence": 0.87} or {"plate": None, "plate_confidence": 0}
    """
    r = get_reader()

    # Read image using numpy to handle non-ascii paths properly
    try:
        with open(image_path, "rb") as f:
            chunk = f.read()
        chunk_arr = np.frombuffer(chunk, dtype=np.uint8)
        img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
    except Exception:
        img = None

    if img is None:
        return {"plate": None, "plate_confidence": 0.0}

    # Try multiple preprocessed variants for best OCR result
    variants = preprocess_plate_image(img)
    best_plate = None
    best_confidence = 0.0

    for variant in variants:
        try:
            results = r.readtext(variant)
        except Exception:
            continue

        if not results:
            continue

        # Sort left-to-right by bounding box x-coordinate
        results.sort(key=lambda x: x[0][0][0])

        full_text = "".join([res[1] for res in results])
        avg_conf = sum(res[2] for res in results) / len(results)

        plate = try_extract_plate(full_text)

        if plate and len(plate) >= 8:
            # Prefer higher confidence or longer plate matches
            score = avg_conf + (len(plate) / 20.0)
            if score > best_confidence:
                best_plate = plate
                best_confidence = avg_conf

    if best_plate:
        return {"plate": best_plate, "plate_confidence": round(max(best_confidence, 0.5), 2)}

    return {"plate": None, "plate_confidence": 0.0}
