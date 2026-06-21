import cv2
import numpy as np

def normalize_image(img_cv: np.ndarray) -> np.ndarray:
    """
    Applies image normalization pipeline designed to enhance visibility 
    in low-light, shadow, rain, and slight motion blur conditions.
    """
    # 1. Bilateral Filter for noise and rain artifact reduction
    # Preserves hard edges (like vehicles and plates) while smoothing uniform areas
    denoised = cv2.bilateralFilter(img_cv, d=9, sigmaColor=75, sigmaSpace=75)

    # 2. Low-light and Shadow Handling using CLAHE on LAB color space
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # Apply CLAHE to the Lightness channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    
    limg = cv2.merge((cl, a, b))
    clahe_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    # 3. Light Sharpening (Unsharp Mask) to reduce motion blur
    # Keeping it weak to avoid halos that hurt OCR (e.g. 1.15 vs -0.15)
    blurred_for_sharp = cv2.GaussianBlur(clahe_img, (0, 0), 2.0)
    sharpened = cv2.addWeighted(clahe_img, 1.15, blurred_for_sharp, -0.15, 0)

    return sharpened
