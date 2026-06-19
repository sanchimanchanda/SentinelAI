"""Test the new OCR pipeline against all evidence images."""
import os
import sys

# Add parent to path so we can import the service
sys.path.insert(0, os.path.dirname(__file__))

from app.services.ocr import extract_plate

evidence_dir = "evidence"
if not os.path.exists(evidence_dir):
    print(f"No '{evidence_dir}' directory found")
    sys.exit(1)

images = [
    os.path.join(evidence_dir, f)
    for f in os.listdir(evidence_dir)
    if f.lower().endswith(('.jpg', '.png', '.jpeg'))
]

if not images:
    print("No images found in evidence/")
    sys.exit(1)

images.sort(key=os.path.getmtime, reverse=True)

print(f"Found {len(images)} images. Testing latest ones...\n")

for img_path in images[:5]:
    print(f"--- {os.path.basename(img_path)} ---")
    result = extract_plate(img_path)
    print(f"  Plate: {result['plate']}")
    print(f"  Confidence: {result['plate_confidence']}")
    print()
