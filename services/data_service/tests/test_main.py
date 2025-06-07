import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app, DataService
import os
import boto3
from moto import mock_s3

client = TestClient(app)

@pytest.fixture
def aws_credentials():
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-west-2"

@pytest.fixture
def s3(aws_credentials):
    with mock_s3():
        s3 = boto3.client("s3")
        s3.create_bucket(
            Bucket="terrafusion-data",
            CreateBucketConfiguration={"LocationConstraint": "us-west-2"}
        )
        yield s3

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()

def test_store_data(s3):
    data = {
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "cpu_usage": 0.5,
            "memory_usage": 0.6,
            "disk_usage": 0.7,
            "network_usage": 0.8
        },
        "source": "test_source",
        "metadata": {
            "environment": "test",
            "version": "1.0.0"
        }
    }
    response = client.post("/store", json=data)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "local_path" in response.json()
    assert "s3_key" in response.json()

def test_process_data(s3):
    # First store some data
    data = {
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "cpu_usage": 0.5,
            "memory_usage": 0.6,
            "disk_usage": 0.7,
            "network_usage": 0.8
        },
        "source": "test_source",
        "metadata": {
            "environment": "test",
            "version": "1.0.0"
        }
    }
    client.post("/store", json=data)
    
    # Then process it
    start_time = datetime.now() - timedelta(hours=1)
    end_time = datetime.now()
    response = client.post("/process", params={
        "source": "test_source",
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat()
    })
    assert response.status_code == 200
    assert "statistics" in response.json()
    assert "local_path" in response.json()
    assert "s3_key" in response.json()

def test_get_analytics(s3):
    # First store some data
    data = {
        "timestamp": datetime.now().isoformat(),
        "metrics": {
            "cpu_usage": 0.5,
            "memory_usage": 0.6,
            "disk_usage": 0.7,
            "network_usage": 0.8
        },
        "source": "test_source",
        "metadata": {
            "environment": "test",
            "version": "1.0.0"
        }
    }
    client.post("/store", json=data)
    
    # Then get analytics
    response = client.get("/analytics/test_source/cpu_usage", params={
        "time_range": "1d"
    })
    assert response.status_code == 200
    assert "statistics" in response.json()
    assert "time_series" in response.json()

def test_invalid_source():
    response = client.get("/analytics/invalid_source/cpu_usage")
    assert response.status_code == 200
    assert response.json()["status"] == "no_data"
    assert "No data found" in response.json()["message"] 