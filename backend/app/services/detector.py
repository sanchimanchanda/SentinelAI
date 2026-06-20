from ultralytics import YOLO
from app.config import settings
import cv2
import numpy as np

# COCO class IDs
PERSON_CLASS = 0
CAR_CLASS = 2
MOTORCYCLE_CLASS = 3
BUS_CLASS = 5
TRUCK_CLASS = 7
TRAFFIC_LIGHT_CLASS = 9

# Load models once at module level
model = YOLO(settings.YOLO_MODEL_PATH)

try:
    helmet_model = YOLO(settings.HELMET_MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load helmet model: {e}")
    helmet_model = None

def get_traffic_light_color(crop_img):
    """Detect if the traffic light is RED or GREEN using HSV."""
    hsv = cv2.cvtColor(crop_img, cv2.COLOR_BGR2HSV)
    
    # Red has two ranges in HSV
    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 50, 50])
    upper_red2 = np.array([180, 255, 255])
    
    # Green range
    lower_green = np.array([40, 50, 50])
    upper_green = np.array([90, 255, 255])
    
    mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
    mask_red = cv2.bitwise_or(mask_red1, mask_red2)
    
    mask_green = cv2.inRange(hsv, lower_green, upper_green)
    
    red_pixels = cv2.countNonZero(mask_red)
    green_pixels = cv2.countNonZero(mask_green)
    
    if red_pixels > green_pixels and red_pixels > 10:
        return "RED"
    elif green_pixels > red_pixels and green_pixels > 10:
        return "GREEN"
    return "UNKNOWN"

def check_seatbelt(crop_img):
    """
    Returns True if a diagonal seatbelt-like line is found on the torso, False otherwise.
    """
    gray = cv2.cvtColor(crop_img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    h, w = crop_img.shape[:2]
    # Require the line to be at least 30% of the crop height (person box includes head, belt is lower)
    min_length = int(h * 0.3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=30, minLineLength=min_length, maxLineGap=20)
    
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 - x1 == 0:
                continue
            angle = np.abs(np.arctan((y2 - y1) / (x2 - x1)) * 180 / np.pi)
            # Seatbelts are typically diagonally oriented between 20 and 80 degrees depending on perspective
            if 20 < angle < 80:
                return True
    return False

def analyze_traffic_scene(image_path: str) -> dict:
    """
    Modular detection pipeline:
    - Traffic Light state
    - Vehicle (Stop Line Violation on Red)
    - Motorcycle (Triple Riding, No Helmet)
    - Enclosed Vehicle (No Seatbelt)
    """
    results = model(image_path, verbose=False)
    boxes = results[0].boxes
    
    img_cv = cv2.imread(image_path)
    if img_cv is None:
        return {"violation": "None", "confidence": 0.0, "vehicle": "unknown", "persons_detected": 0}
        
    img_height, img_width = img_cv.shape[:2]
    STOP_LINE_Y = img_height * 0.60
    
    violations = []
    
    # --- 1. Traffic Light Processing ---
    traffic_lights = [b for b in boxes if int(b.cls[0]) == TRAFFIC_LIGHT_CLASS]
    tl_state = "UNKNOWN"
    for tl in traffic_lights:
        x1, y1, x2, y2 = [int(v) for v in tl.xyxy[0].tolist()]
        if x2 > x1 and y2 > y1:
            crop = img_cv[y1:y2, x1:x2]
            state = get_traffic_light_color(crop)
            if state != "UNKNOWN":
                tl_state = state
                break  # Take the first clearly identified light state
                
    # --- 2. Vehicle Processing (Red Light Violation) ---
    vehicle_classes = [CAR_CLASS, MOTORCYCLE_CLASS, BUS_CLASS, TRUCK_CLASS]
    vehicles = [b for b in boxes if int(b.cls[0]) in vehicle_classes]
    
    red_light_violation = False
    if tl_state == "RED":
        for v in vehicles:
            vx1, vy1, vx2, vy2 = v.xyxy[0].tolist()
            center_y = (vy1 + vy2) / 2
            if center_y > STOP_LINE_Y:
                red_light_violation = True
                break
                
    if red_light_violation:
        violations.append("Red Light Violation")
        
    # --- 3. Motorcycle Processing (Triple Riding, No Helmet) ---
    motorcycles = [b for b in boxes if int(b.cls[0]) == MOTORCYCLE_CLASS]
    persons = [b for b in boxes if int(b.cls[0]) == PERSON_CLASS]
    all_person_boxes = [[float(x) for x in p.xyxy[0].tolist()] for p in persons]
    
    best_moto_box = None
    max_riders = 0
    highest_conf = 0.0
    motorcycle_rider_indices = set()  # Track which persons are on motorcycles
    
    for moto in motorcycles:
        mx1, my1, mx2, my2 = moto.xyxy[0].tolist()
        rider_count = 0
        no_helmet_found = False
        
        for p_idx, person in enumerate(persons):
            px1, py1, px2, py2 = person.xyxy[0].tolist()
            person_cy = (py1 + py2) / 2
            person_cx = (px1 + px2) / 2
            
            if mx1 <= person_cx <= mx2 and my1 - 50 <= person_cy <= my2:
                rider_count += 1
                motorcycle_rider_indices.add(p_idx)
                
                # Helmet Check
                if helmet_model:
                    hx1, hy1 = max(0, int(px1)), max(0, int(py1))
                    hx2, hy2 = min(img_width, int(px2)), min(img_height, int(py2))
                    if hx2 > hx1 and hy2 > hy1:
                        crop = img_cv[hy1:hy2, hx1:hx2]
                        h_results = helmet_model(crop, verbose=False)
                        if h_results and h_results[0].boxes:
                            for hb in h_results[0].boxes:
                                if int(hb.cls[0]) == 1 and float(hb.conf[0]) > 0.4:
                                    no_helmet_found = True
                                    break
                                    
        if rider_count >= 3 and "Triple Riding" not in violations:
            violations.append("Triple Riding")
        if no_helmet_found and "No Helmet" not in violations:
            violations.append("No Helmet")
            
        if rider_count > max_riders or (rider_count == max_riders and float(moto.conf[0]) > highest_conf):
            max_riders = rider_count
            highest_conf = float(moto.conf[0])
            best_moto_box = [mx1, my1, mx2, my2]

    # --- 4. Seatbelt Processing (Enclosed Vehicles) ---
    # Skip seatbelt checks entirely if we already found motorcycle riders
    enclosed_vehicle_classes = [CAR_CLASS, BUS_CLASS, TRUCK_CLASS]
    enclosed_vehicles = [b for b in boxes if int(b.cls[0]) in enclosed_vehicle_classes]
    
    # Interior fallback: only when NO motorcycles detected and a large person dominates the frame
    if not enclosed_vehicles and not motorcycles:
        for p_idx, person in enumerate(persons):
            if p_idx in motorcycle_rider_indices:
                continue
            px1, py1, px2, py2 = person.xyxy[0].tolist()
            area = (px2 - px1) * (py2 - py1)
            # If the person takes up more than 2% of the frame, assume they are a driver/passenger close-up
            if area > (img_width * img_height * 0.02):
                enclosed_vehicles.append(person)
    
    no_seatbelt_found = False
    best_car_box = None
    
    for ev in enclosed_vehicles:
        vx1, vy1, vx2, vy2 = ev.xyxy[0].tolist()
        
        for p_idx, person in enumerate(persons):
            # Skip persons already identified as motorcycle riders
            if p_idx in motorcycle_rider_indices:
                continue
                
            px1, py1, px2, py2 = person.xyxy[0].tolist()
            person_cy = (py1 + py2) / 2
            person_cx = (px1 + px2) / 2
            
            if vx1 <= person_cx <= vx2 and vy1 <= person_cy <= vy2:
                hx1, hy1 = max(0, int(px1)), max(0, int(py1))
                hx2, hy2 = min(img_width, int(px2)), min(img_height, int(py2))
                
                if hx2 > hx1 and hy2 > hy1:
                    crop = img_cv[hy1:hy2, hx1:hx2]
                    has_belt = check_seatbelt(crop)
                    if not has_belt:
                        no_seatbelt_found = True
                        best_car_box = [vx1, vy1, vx2, vy2]
                        if float(ev.conf[0]) > highest_conf:
                            highest_conf = float(ev.conf[0])
                        break
                        
        if no_seatbelt_found:
            if "No Seatbelt" not in violations:
                violations.append("No Seatbelt")
            break

    # Pick the primary vehicle box for OCR
    primary_vehicle_box = best_moto_box or best_car_box
    if primary_vehicle_box is None and vehicles:
        primary_vehicle_box = vehicles[0].xyxy[0].tolist()
        if float(vehicles[0].conf[0]) > highest_conf:
            highest_conf = float(vehicles[0].conf[0])

    return {
        "violation": ", ".join(violations) if violations else "None",
        "confidence": round(highest_conf, 2) if highest_conf > 0 else 0.0,
        "vehicle": "motorcycle" if best_moto_box else ("car" if best_car_box else "vehicle"),
        "persons_detected": max_riders,
        "motorcycle_box": primary_vehicle_box,
        "person_boxes": [],
        "all_person_boxes": all_person_boxes,
        "traffic_light_state": tl_state
    }
