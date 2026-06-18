from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency. Yields a DB session, closes on completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_raw(db, sql: str, params: dict = None):
    """Execute raw SQL and return all rows as list of dicts."""
    result = db.execute(text(sql), params or {})
    columns = result.keys()
    return [dict(zip(columns, row)) for row in result.fetchall()]
