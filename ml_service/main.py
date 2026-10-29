from pathlib import Path
import math
import subprocess
import sys
import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import joblib
import numpy as np

# 13. Add proper logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ml_api")

app = FastAPI(title="Early Warning System API")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"

def load_model():
    if not MODEL_PATH.exists():
        return None
    try:
        model = joblib.load(MODEL_PATH)
        logger.info(f"Successfully loaded model from {MODEL_PATH}")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

def ensure_model_loaded():
    model = load_model()
    if model is not None:
        return model

    logger.warning(f"Model file not available at {MODEL_PATH}. Training model automatically.")
    try:
        subprocess.run([sys.executable, str(BASE_DIR / "train_model.py")], check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"Model training script failed: {e}")
        return None

    return load_model()

try:
    model = ensure_model_loaded()
except Exception as exc:
    model = None
    logger.error(f"Unexpected error during model initialization: {exc}")

if model is None:
    logger.error(f"Prediction requests will fail until the model is trained.")

# 9. Ensure main.py continues working without changing the API contract
class PredictionRequest(BaseModel):
    sentiment: float = Field(default=0.0, description="Sentiment score from -1.0 to 1.0")
    sleep: float = Field(default=7.0, description="Hours of sleep (0-24)")
    mood: float = Field(default=3.0, description="Mood score from 1.0 to 5.0")
    negKeywords: float = Field(default=0.0, description="Count of negative keywords")

    @field_validator("sentiment", "sleep", "mood", "negKeywords")
    @classmethod
    def ensure_finite(cls, value: float) -> float:
        if not math.isfinite(value):
            raise ValueError("must be a finite number")
        return value

class PredictionResponse(BaseModel):
    risk: str
    reason: str

LABELS = {
    0: "SAFE",
    1: "WARNING",
    2: "CRITICAL"
}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ml_service",
    }

@app.get("/ready")
def ready():
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")
    return {
        "status": "ready",
        "modelPath": str(MODEL_PATH),
    }

# 12. Improve the generate_reason() function so its explanation is consistent with the model prediction
def generate_reason(data: PredictionRequest, risk_label: str) -> str:
    if risk_label == "SAFE":
        return "Metrics show a healthy emotional pattern."
    
    reasons = []
    
    # We dynamically select factors that justify the WARNING or CRITICAL state.
    # Instead of firing randomly on thresholds, we look for poor feature values.
    if data.sleep <= 6.5:
        reasons.append(f"Low sleep ({data.sleep}h)")
    if data.sentiment <= 0.0:
        reasons.append(f"Negative sentiment ({data.sentiment})")
    if data.mood <= 3.0:
        reasons.append(f"Low mood ({data.mood})")
    if data.negKeywords >= 2:
        reasons.append(f"High negative keywords count ({data.negKeywords})")
        
    if not reasons:
        return f"Algorithm detected subtle warning patterns leading to {risk_label}."
        
    return f"Model predicted {risk_label} due to: " + " + ".join(reasons)

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionRequest):
    if not model:
        logger.error("Predict endpoint called but model is not loaded.")
        raise HTTPException(status_code=500, detail="ML model is not loaded. Train the model first.")

    # 13. Add proper exception handling
    try:
        import pandas as pd
        input_data = pd.DataFrame([{
            "sentiment": data.sentiment,
            "sleep": data.sleep,
            "mood": data.mood,
            "negKeywords": data.negKeywords
        }])

        prediction = model.predict(input_data)[0]
        risk_label = LABELS.get(prediction, "WARNING")
        
        reason = generate_reason(data, risk_label)
        
        logger.info(f"Prediction made: risk={risk_label}, input_metrics=[sleep={data.sleep}, sentiment={data.sentiment}, mood={data.mood}, negKw={data.negKeywords}]")

        return PredictionResponse(
            risk=risk_label,
            reason=reason
        )
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during prediction.")
