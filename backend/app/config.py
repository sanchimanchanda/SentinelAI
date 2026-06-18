from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///sentinel.db"
    GEMINI_API_KEY: str = ""  # Optional. Only needed for Intelligence Console.
    YOLO_MODEL_PATH: str = "yolov8m.pt"
    EVIDENCE_DIR: str = "./evidence"
    CORRIDOR_WINDOW_HOURS: int = 4  # Tunable: 2, 4, or 6. Controls plate_movements view.
    ALERT_WINDOW_MINUTES: int = 90
    HIGH_ALERT_THRESHOLD: int = 10  # violations in ALERT_WINDOW_MINUTES
    MEDIUM_ALERT_THRESHOLD: int = 5

    class Config:
        env_file = ".env"

settings = Settings()
