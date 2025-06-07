from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import logging
import json
from datetime import datetime
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Dropout
import joblib
import os

app = FastAPI(title="TerraFusion AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MetricData(BaseModel):
    timestamp: str
    value: float
    type: str

class PredictionRequest(BaseModel):
    metrics: List[MetricData]
    model_type: str

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float
    timestamp: str

class AIService:
    def __init__(self):
        self.models = {}
        self.initialize_models()
        self.setup_logging()

    def setup_logging(self):
        self.logger = logging.getLogger('AIService')
        self.logger.setLevel(logging.INFO)

    def initialize_models(self):
        try:
            self.models['performance'] = self._create_performance_model()
            self.models['anomaly'] = self._create_anomaly_model()
            self.models['pattern'] = self._create_pattern_model()
            self.logger.info("Models initialized successfully")
        except Exception as e:
            self.logger.error(f"Error initializing models: {str(e)}")
            raise

    def _create_performance_model(self):
        model = Sequential([
            LSTM(64, input_shape=(10, 1), return_sequences=True),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        return model

    def _create_anomaly_model(self):
        return IsolationForest(contamination=0.1, random_state=42)

    def _create_pattern_model(self):
        return RandomForestRegressor(n_estimators=100, random_state=42)

    def process_metrics(self, metrics: List[MetricData]) -> np.ndarray:
        try:
            values = np.array([m.value for m in metrics])
            return values.reshape(-1, 1)
        except Exception as e:
            self.logger.error(f"Error processing metrics: {str(e)}")
            raise

    def generate_prediction(self, metrics: List[MetricData], model_type: str) -> Dict[str, Any]:
        try:
            if model_type not in self.models:
                raise ValueError(f"Unknown model type: {model_type}")

            data = self.process_metrics(metrics)
            model = self.models[model_type]

            if model_type == 'performance':
                prediction = model.predict(data.reshape(1, -1, 1))[0][0]
                confidence = 0.95
            elif model_type == 'anomaly':
                prediction = model.predict(data)[0]
                confidence = model.score_samples(data)[0]
            else:
                prediction = model.predict(data)[0]
                confidence = model.score(data)

            return {
                'prediction': float(prediction),
                'confidence': float(confidence),
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error generating prediction: {str(e)}")
            raise

    def update_model(self, model_type: str, new_data: np.ndarray, labels: Optional[np.ndarray] = None):
        try:
            if model_type not in self.models:
                raise ValueError(f"Unknown model type: {model_type}")

            model = self.models[model_type]
            if model_type == 'performance':
                model.fit(new_data, labels, epochs=1, verbose=0)
            elif model_type == 'anomaly':
                model.fit(new_data)
            else:
                model.fit(new_data, labels)

            self.logger.info(f"Model {model_type} updated successfully")
        except Exception as e:
            self.logger.error(f"Error updating model: {str(e)}")
            raise

ai_service = AIService()

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        result = ai_service.generate_prediction(request.metrics, request.model_type)
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-model/{model_type}")
async def update_model(model_type: str, data: Dict[str, Any]):
    try:
        new_data = np.array(data['features'])
        labels = np.array(data['labels']) if 'labels' in data else None
        ai_service.update_model(model_type, new_data, labels)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Model update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 