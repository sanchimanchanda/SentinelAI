import os
import re
from google import genai
from google.genai import types
from app.config import settings
import cv2
import numpy as np

def extract_plate(image_path: str, crop_box: list[float] | None = None) -> dict:
    """
    Extract license plate text using Gemini 2.0 Flash (Zero memory overhead).
    """
    if not settings.GEMINI_API_KEY:
        print("Warning: GEMINI_API_KEY not set. Cannot perform OCR.")
        return {"plate": None, "plate_confidence": 0.0}

    try:
        # If crop_box is provided, we can crop the image to just the vehicle
        # to help Gemini focus, but Gemini is generally good at full images too.
        # To be safe and save bandwidth, we'll read and optionally crop.
        try:
            with open(image_path, "rb") as f:
                chunk = f.read()
            chunk_arr = np.frombuffer(chunk, dtype=np.uint8)
            img = cv2.imdecode(chunk_arr, cv2.IMREAD_COLOR)
        except Exception:
            img = None

        if img is not None and crop_box:
            x1, y1, x2, y2 = [int(v) for v in crop_box]
            h, w = img.shape[:2]
            pad = 20
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(w, x2 + pad)
            y2 = min(h, y2 + pad)
            if x2 > x1 and y2 > y1:
                img = img[y1:y2, x1:x2]
                
        # Encode back to JPEG
        if img is not None:
            _, buffer = cv2.imencode('.jpg', img)
            image_data = buffer.tobytes()
        else:
            with open(image_path, "rb") as f:
                image_data = f.read()

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        prompt = "Extract the vehicle license plate number from this image. Output ONLY the alphanumeric plate number (e.g., KA05MX4421). If you cannot read it clearly or there is no plate, output exactly the word NONE."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                types.Part.from_bytes(data=image_data, mime_type='image/jpeg'),
                prompt,
            ]
        )
        
        text = response.text.strip().upper()
        if "NONE" in text or len(text) < 4:
            return {"plate": None, "plate_confidence": 0.0}
            
        cleaned = re.sub(r'[^A-Z0-9]', '', text)
        
        # Verify it looks somewhat like an Indian plate (at least 6 chars)
        if len(cleaned) >= 6:
            return {"plate": cleaned, "plate_confidence": 0.95}
            
    except Exception as e:
        print(f"Gemini OCR error: {e}")

    return {"plate": None, "plate_confidence": 0.0}
