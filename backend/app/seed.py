import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Junction, Violation, Alert

# ============================================================
# EXACT JUNCTION DATA — 15 Bengaluru junctions
# ============================================================
JUNCTIONS = [
    # VERY HIGH risk (South Zone)
    {"name": "Silk Board",       "lat": 12.9172, "lon": 77.6227, "zone": "South", "risk_score": 9.2, "road_type": "Highway"},
    {"name": "Marathahalli",     "lat": 12.9591, "lon": 77.7009, "zone": "East",  "risk_score": 8.5, "road_type": "Highway"},
    # HIGH risk
    {"name": "MG Road",          "lat": 12.9756, "lon": 77.6068, "zone": "South", "risk_score": 7.1, "road_type": "Arterial"},
    {"name": "Koramangala",      "lat": 12.9352, "lon": 77.6245, "zone": "South", "risk_score": 6.8, "road_type": "Arterial"},
    {"name": "Electronic City",  "lat": 12.8399, "lon": 77.6770, "zone": "South", "risk_score": 6.5, "road_type": "Highway"},
    # MEDIUM risk
    {"name": "Indiranagar",      "lat": 12.9784, "lon": 77.6408, "zone": "East",  "risk_score": 5.2, "road_type": "Arterial"},
    {"name": "HSR Layout",       "lat": 12.9116, "lon": 77.6474, "zone": "South", "risk_score": 4.8, "road_type": "Collector"},
    {"name": "Hebbal",           "lat": 13.0358, "lon": 77.5970, "zone": "North", "risk_score": 4.5, "road_type": "Highway"},
    {"name": "Whitefield",       "lat": 12.9698, "lon": 77.7500, "zone": "East",  "risk_score": 4.2, "road_type": "Arterial"},
    # LOW risk
    {"name": "Jayanagar",        "lat": 12.9250, "lon": 77.5938, "zone": "South", "risk_score": 3.1, "road_type": "Collector"},
    {"name": "JP Nagar",         "lat": 12.9063, "lon": 77.5857, "zone": "South", "risk_score": 2.8, "road_type": "Collector"},
    {"name": "Banashankari",     "lat": 12.9255, "lon": 77.5468, "zone": "West",  "risk_score": 2.5, "road_type": "Collector"},
    {"name": "Rajajinagar",      "lat": 12.9895, "lon": 77.5521, "zone": "West",  "risk_score": 2.3, "road_type": "Arterial"},
    {"name": "Malleshwaram",     "lat": 13.0035, "lon": 77.5647, "zone": "West",  "risk_score": 2.1, "road_type": "Collector"},
    {"name": "Yelahanka",        "lat": 13.1007, "lon": 77.5963, "zone": "North", "risk_score": 2.0, "road_type": "Local"},
]

# ============================================================
# VIOLATION DISTRIBUTION — weighted by risk score
# ============================================================
VIOLATION_TYPES = [
    ("Triple Riding", 0.40),
    ("No Helmet",     0.35),
    ("Signal Jump",   0.15),
    ("Wrong Way",     0.10),
]

# Peak hours: 8-10 AM and 5-8 PM
PEAK_HOURS = [8, 9, 10, 17, 18, 19, 20]

# ============================================================
# REPEAT OFFENDER PLATES — exactly 20
# ============================================================
REPEAT_PLATES = [
    "KA05MX4421",  # CRITICAL: must appear at MG Road, Indiranagar, Silk Board
    "KA01AB1234",
    "KA03CD5678",
    "KA04EF9012",
    "KA02GH3456",
    "KA09IJ7890",
    "KA51KL2345",
    "KA05MN6789",
    "KA03PQ0123",
    "KA01RS4567",
    "KA04TU8901",
    "KA02VW2345",
    "KA09XY6789",
    "KA51AB0123",
    "KA05CD4567",
    "KA03EF8901",
    "KA01GH2345",
    "KA04IJ6789",
    "KA02KL0123",
    "KA09MN4567",
]

# ============================================================
# CORRIDOR SEQUENCES — predefined movement patterns
# Must be injected EXACTLY as specified
# ============================================================
CORRIDOR_SEQUENCES = [
    # CRITICAL CORRIDOR: KA05MX4421 — MG Road → Indiranagar → Silk Board
    {
        "plate": "KA05MX4421",
        "stops": [
            {"junction": "MG Road",     "hours_ago": 4.0, "type": "Triple Riding"},
            {"junction": "Indiranagar", "hours_ago": 3.0, "type": "No Helmet"},
            {"junction": "Silk Board",  "hours_ago": 2.0, "type": "Triple Riding"},
        ]
    },
    # ORR Corridor: KA01AB1234
    {
        "plate": "KA01AB1234",
        "stops": [
            {"junction": "Hebbal",        "hours_ago": 5.0, "type": "Signal Jump"},
            {"junction": "Marathahalli",  "hours_ago": 3.5, "type": "No Helmet"},
            {"junction": "Silk Board",    "hours_ago": 2.0, "type": "Triple Riding"},
        ]
    },
    # South Corridor: KA03CD5678
    {
        "plate": "KA03CD5678",
        "stops": [
            {"junction": "Koramangala",      "hours_ago": 6.0, "type": "No Helmet"},
            {"junction": "HSR Layout",       "hours_ago": 4.5, "type": "Signal Jump"},
            {"junction": "Electronic City",  "hours_ago": 3.0, "type": "Triple Riding"},
        ]
    },
    # East Corridor: KA04EF9012
    {
        "plate": "KA04EF9012",
        "stops": [
            {"junction": "Indiranagar",  "hours_ago": 5.0, "type": "No Helmet"},
            {"junction": "Marathahalli", "hours_ago": 3.0, "type": "Triple Riding"},
            {"junction": "Whitefield",   "hours_ago": 1.5, "type": "Signal Jump"},
        ]
    },
    # West-South Corridor: KA02GH3456
    {
        "plate": "KA02GH3456",
        "stops": [
            {"junction": "Rajajinagar",  "hours_ago": 7.0, "type": "Wrong Way"},
            {"junction": "MG Road",      "hours_ago": 5.0, "type": "No Helmet"},
            {"junction": "Koramangala",  "hours_ago": 3.0, "type": "Triple Riding"},
        ]
    },
    # North-South Corridor: KA09IJ7890
    {
        "plate": "KA09IJ7890",
        "stops": [
            {"junction": "Yelahanka",  "hours_ago": 8.0, "type": "No Helmet"},
            {"junction": "Hebbal",     "hours_ago": 6.0, "type": "Signal Jump"},
            {"junction": "MG Road",    "hours_ago": 4.0, "type": "Triple Riding"},
        ]
    },
]


def seed_database():
    """Seed database with realistic Bengaluru traffic data."""
    db = SessionLocal()
    try:
        # Check if already seeded
        existing = db.query(Junction).count()
        if existing > 0:
            print("Database already seeded. Skipping.")
            return

        now = datetime.now()

        # --- 1. Insert Junctions ---
        junction_map = {}  # name -> Junction object
        for j_data in JUNCTIONS:
            j = Junction(**j_data)
            db.add(j)
            db.flush()
            junction_map[j.name] = j
        print(f"Seeded {len(JUNCTIONS)} junctions.")

        # --- 2. Insert Corridor Sequences (must be first for correct timestamps) ---
        corridor_count = 0
        for corridor in CORRIDOR_SEQUENCES:
            for stop in corridor["stops"]:
                j = junction_map[stop["junction"]]
                v = Violation(
                    timestamp=now - timedelta(hours=stop["hours_ago"]),
                    junction_id=j.id,
                    junction=j.name,
                    lat=j.lat + random.uniform(-0.002, 0.002),
                    lon=j.lon + random.uniform(-0.002, 0.002),
                    type=stop["type"],
                    confidence=round(random.uniform(0.85, 0.97), 2),
                    vehicle="motorcycle",
                    plate=corridor["plate"],
                    plate_confidence=round(random.uniform(0.80, 0.95), 2),
                    status="OPEN",
                    source="seed",
                )
                db.add(v)
                corridor_count += 1
        print(f"Seeded {corridor_count} corridor violations.")

        # --- 3. Insert 500 total violations (including corridors above) ---
        remaining = 500 - corridor_count
        # Weight junction selection by risk_score
        junction_weights = [(j_data["name"], j_data["risk_score"]) for j_data in JUNCTIONS]
        junction_names = [jw[0] for jw in junction_weights]
        weights = [jw[1] for jw in junction_weights]

        violation_types = [vt[0] for vt in VIOLATION_TYPES]
        violation_weights = [vt[1] for vt in VIOLATION_TYPES]

        for i in range(remaining):
            # Random junction weighted by risk
            j_name = random.choices(junction_names, weights=weights, k=1)[0]
            j = junction_map[j_name]

            # Random time in last 7 days, biased toward peak hours
            days_ago = random.uniform(0, 7)
            if random.random() < 0.65:  # 65% chance of peak hour
                hour = random.choice(PEAK_HOURS)
            else:
                hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            ts = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute, second=0)

            # Random violation type
            v_type = random.choices(violation_types, weights=violation_weights, k=1)[0]

            # 30% chance of having a plate
            plate = None
            plate_conf = 0.0
            if random.random() < 0.30:
                plate = random.choice(REPEAT_PLATES)
                plate_conf = round(random.uniform(0.70, 0.95), 2)

            v = Violation(
                timestamp=ts,
                junction_id=j.id,
                junction=j.name,
                lat=j.lat + random.uniform(-0.003, 0.003),
                lon=j.lon + random.uniform(-0.003, 0.003),
                type=v_type,
                confidence=round(random.uniform(0.75, 0.98), 2),
                vehicle="motorcycle",
                plate=plate,
                plate_confidence=plate_conf,
                status="OPEN",
                source="seed",
            )
            db.add(v)
        print(f"Seeded {remaining} additional violations. Total: 500.")

        # --- 4. Insert Seed Alerts ---
        silk_board = junction_map["Silk Board"]
        mg_road = junction_map["MG Road"]

        alerts = [
            Alert(
                junction_id=silk_board.id,
                junction="Silk Board",
                severity="HIGH",
                message="14 violations detected in the last 90 minutes at Silk Board junction.",
                action="Recommended Resource Allocation: 2 officers + towing unit",
                created_at=now - timedelta(minutes=15),
                status="ACTIVE",
            ),
            Alert(
                junction_id=mg_road.id,
                junction="MG Road",
                severity="MEDIUM",
                message="7 violations detected in the last 90 minutes at MG Road junction.",
                action="Recommended Resource Allocation: 1 officer",
                created_at=now - timedelta(minutes=30),
                status="ACTIVE",
            ),
        ]
        for a in alerts:
            db.add(a)
        print(f"Seeded {len(alerts)} alerts.")

        db.commit()
        print("Seeding complete.")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise
    finally:
        db.close()
