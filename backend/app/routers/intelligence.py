from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.intelligence import query_intelligence_engine, IntelligenceRequest, generate_action_plan

router = APIRouter()

@router.post("/intelligence")
def ask_intelligence(req: IntelligenceRequest, db: Session = Depends(get_db)):
    """Query the traffic intelligence engine."""
    return query_intelligence_engine(req.question, db)

class ActionPlanRequest(BaseModel):
    location: str

@router.post("/action-plan")
def get_action_plan(req: ActionPlanRequest, db: Session = Depends(get_db)):
    """Generate a structured operational action plan for a given location."""
    return generate_action_plan(db, req.location)
