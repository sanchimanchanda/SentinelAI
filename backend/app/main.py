from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.schema import create_tables, create_views, create_indexes
from app.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    create_views()
    create_indexes()
    seed_database()
    os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
    yield
    # Shutdown (nothing needed)

app = FastAPI(
    title="SentinelAI",
    description="AI-Powered Traffic Enforcement Command Center",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for evidence images
app.mount("/evidence", StaticFiles(directory=settings.EVIDENCE_DIR), name="evidence")

# Import and include routers
from app.routers import hotspots, violations, recommendations, alerts, offenders, corridors, briefing, detection, intelligence

app.include_router(hotspots.router, prefix="/api", tags=["Hotspots"])
app.include_router(violations.router, prefix="/api", tags=["Violations"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(offenders.router, prefix="/api", tags=["Offenders"])
app.include_router(corridors.router, prefix="/api", tags=["Corridors"])
app.include_router(briefing.router, prefix="/api", tags=["Briefing"])
app.include_router(detection.router, prefix="/api", tags=["Detection"])
app.include_router(intelligence.router, prefix="/api", tags=["Intelligence"])

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SentinelAI"}
