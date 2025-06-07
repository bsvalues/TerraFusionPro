from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import numpy as np
import tensorflow as tf
import joblib
import logging
from datetime import datetime
import os
import json
from .distributed_training import DistributedTrainer
from ..security.zero_trust import ZeroTrustSecurity, SecurityConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TerraFusion AI Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security configuration
security_config = SecurityConfig(
    jwt_secret=os.getenv("JWT_SECRET", "your-secret-key"),
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379")
)
security = ZeroTrustSecurity(security_config)

# Initialize distributed trainer
trainer = DistributedTrainer()

class MetricsData(BaseModel):
    timestamp: datetime
    metrics: Dict[str, float]
    source: str
    metadata: Optional[Dict[str, Any]] = None

class ModelUpdateData(BaseModel):
    metrics: Dict[str, float]
    actual_performance: float
    model_type: str

@app.post("/predict/{model_type}")
async def predict_performance(
    model_type: str,
    data: MetricsData,
    security_payload: Dict[str, Any] = Depends(security.verify_request)
):
    try:
        # Load model
        model_path = f"models/{model_type}_model"
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"Model {model_type} not found")
        
        model = tf.keras.models.load_model(model_path)
        
        # Prepare input
        input_data = np.array([list(data.metrics.values())])
        
        # Make prediction
        prediction = model.predict(input_data)[0][0]
        
        return {
            "predicted_performance": float(prediction),
            "timestamp": datetime.utcnow().isoformat(),
            "model_type": model_type
        }
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-model")
async def update_model(
    data: ModelUpdateData,
    security_payload: Dict[str, Any] = Depends(security.verify_request)
):
    try:
        # Prepare training data
        training_data = [{
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": data.metrics,
            "actual_performance": data.actual_performance,
            "source": "training"
        }]
        
        # Train model
        model = trainer.train_distributed(
            model_type=data.model_type,
            data=training_data,
            epochs=10,
            batch_size=32
        )
        
        # Evaluate model
        evaluation_metrics = trainer.evaluate_model(
            model=model,
            test_data=training_data,
            model_type=data.model_type
        )
        
        return {
            "status": "success",
            "evaluation_metrics": evaluation_metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in model update: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 