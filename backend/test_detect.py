from app.services.detector import analyze_traffic_scene
import glob

files = glob.glob('../frontend/public/example/*.jpg') + glob.glob('../frontend/public/example/*.png') + glob.glob('../frontend/public/example/*.jpeg')
for f in sorted(files):
    r = analyze_traffic_scene(f)
    parts = f.replace('\\', '/').split('/')
    name = parts[-1]
    v = r["violation"]
    c = r["confidence"]
    vh = r["vehicle"]
    tl = r["traffic_light_state"]
    print(f"{name} -> violation={v} | conf={c} | vehicle={vh} | tl={tl}")
