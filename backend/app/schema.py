from sqlalchemy import text
from app.database import engine, Base
from app.config import settings

def create_tables():
    """Create all tables from ORM models."""
    Base.metadata.create_all(bind=engine)

def create_views():
    """Create SQL views. Drop first to allow re-creation."""
    with engine.connect() as conn:
        # View 1: Repeat Offenders
        conn.execute(text("DROP VIEW IF EXISTS repeat_offenders"))
        conn.execute(text("""
            CREATE VIEW repeat_offenders AS
            SELECT
                plate,
                COUNT(*) as sightings,
                COUNT(DISTINCT junction) as distinct_junctions,
                MAX(timestamp) as last_seen,
                GROUP_CONCAT(DISTINCT junction) as junctions_list
            FROM violations
            WHERE plate IS NOT NULL AND plate != ''
            GROUP BY plate
            HAVING COUNT(*) >= 2
        """))

        # View 2: Plate Movements (corridor detection)
        conn.execute(text("DROP VIEW IF EXISTS plate_movements"))
        conn.execute(text(f"""
            CREATE VIEW plate_movements AS
            SELECT
                v1.plate,
                v1.junction AS from_junction,
                v2.junction AS to_junction,
                v1.timestamp AS from_time,
                v2.timestamp AS to_time,
                j1.lat AS from_lat,
                j1.lon AS from_lon,
                j2.lat AS to_lat,
                j2.lon AS to_lon,
                ROUND((julianday(v2.timestamp) - julianday(v1.timestamp)) * 24 * 60, 1) AS transit_minutes
            FROM violations v1
            JOIN violations v2
                ON v1.plate = v2.plate
                AND v1.junction != v2.junction
                AND v2.timestamp > v1.timestamp
                AND (julianday(v2.timestamp) - julianday(v1.timestamp)) * 24 <= {settings.CORRIDOR_WINDOW_HOURS}
            JOIN junctions j1 ON v1.junction = j1.name
            JOIN junctions j2 ON v2.junction = j2.name
            WHERE v1.plate IS NOT NULL AND v1.plate != ''
        """))

        conn.commit()

def create_indexes():
    """Create performance indexes."""
    with engine.connect() as conn:
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_violations_plate ON violations(plate)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_violations_junction_id ON violations(junction_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(timestamp)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_violations_type ON violations(type)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_alerts_junction_id ON alerts(junction_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)"))
        conn.commit()
