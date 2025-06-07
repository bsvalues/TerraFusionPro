import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from main import app, AIEngine

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()

def test_predict_performance():
    metrics = {
        "cpu_usage": 0.75,
        "memory_usage": 0.6,
        "disk_usage": 0.8,
        "network_usage": 0.4
    }
    response = client.post("/predict", json={
        "metrics": metrics,
        "model_type": "performance"
    })
    assert response.status_code == 200
    assert "predicted_performance" in response.json()

def test_detect_anomaly():
    metrics = {
        "cpu_usage": 0.95,
        "memory_usage": 0.9,
        "disk_usage": 0.95,
        "network_usage": 0.9
    }
    response = client.post("/predict", json={
        "metrics": metrics,
        "model_type": "anomaly"
    })
    assert response.status_code == 200
    assert "is_anomaly" in response.json()
    assert "anomaly_score" in response.json()

def test_recognize_pattern():
    metrics = {
        "cpu_usage": 0.5,
        "memory_usage": 0.5,
        "disk_usage": 0.5,
        "network_usage": 0.5
    }
    response = client.post("/predict", json={
        "metrics": metrics,
        "model_type": "pattern"
    })
    assert response.status_code == 200
    assert "pattern_type" in response.json()
    assert "confidence" in response.json()

def test_update_models():
    metrics = {
        "cpu_usage": 0.5,
        "memory_usage": 0.5,
        "disk_usage": 0.5,
        "network_usage": 0.5
    }
    response = client.post("/update", json={
        "metrics": metrics,
        "actual_performance": 0.8
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_invalid_model_type():
    metrics = {
        "cpu_usage": 0.5,
        "memory_usage": 0.5,
        "disk_usage": 0.5,
        "network_usage": 0.5
    }
    response = client.post("/predict", json={
        "metrics": metrics,
        "model_type": "invalid"
    })
    assert response.status_code == 400
    assert "Invalid model type" in response.json()["detail"] 