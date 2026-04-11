from pathlib import Path
import math

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import joblib
import numpy as np

app = FastAPI(title="Early Warning System API")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"


def load_model():
    if not MODEL_PATH.exists():
        return None

    return joblib.load(MODEL_PATH)


try:
    model = load_model()
except Exception as exc:  # noqa: BLE001 - keep startup resilient and report readiness separately
    model = None
    print(f"WARNING: unable to load model at {MODEL_PATH}: {exc}")

if model is None:
    print(f"WARNING: model file not available at {MODEL_PATH}. Run train_model.py first.")

class PredictionRequest(BaseModel):
    sentiment: float = Field(ge=-1.0, le=1.0)
    sleep: float = Field(ge=0.0, le=24.0)
    mood: float = Field(ge=1.0, le=5.0)
    negKeywords: float = Field(ge=0.0, le=100.0)

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

def generate_reason(data: PredictionRequest, risk_label: str) -> str:
    if risk_label == "SAFE":
        return "Metrics show a healthy emotional pattern."
    
    reasons = []
    if data.sleep < 6:
        reasons.append("Low sleep")
    if data.sentiment < -0.3:
        reasons.append("Negative sentiment trend")
    if data.mood < 3:
        reasons.append("Low average mood")
    if data.negKeywords > 2:
        reasons.append("High negative keyword frequency")
        
    if not reasons:
        return "Algorithm detected subtle warning patterns."
        
    return " + ".join(reasons)

@app.post("/predict", response_model=PredictionResponse)
def predict(data: PredictionRequest):
    if not model:
        raise HTTPException(status_code=500, detail="ML model is not loaded. Train the model first.")

    input_data = np.array([[
        data.sentiment,
        data.sleep,
        data.mood,
        data.negKeywords
    ]])

    prediction = model.predict(input_data)[0]
    risk_label = LABELS.get(prediction, "WARNING")
    reason = generate_reason(data, risk_label)

    return PredictionResponse(
        risk=risk_label,
        reason=reason
    )
