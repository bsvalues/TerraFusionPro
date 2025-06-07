from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import logging
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError
import asyncio
import aiohttp
from prometheus_client import Counter, Histogram, start_http_server
from .validation import DataValidator
from ..security.zero_trust import ZeroTrustSecurity, SecurityConfig

load_dotenv()

app = FastAPI(title="TerraFusion Data Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

class DataPoint(Base):
    __tablename__ = "data_points"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, index=True)
    metric_type = Column(String, index=True)
    value = Column(Float)
    metadata = Column(JSON)
    source = Column(String)
    version = Column(String)

class DataService:
    def __init__(self):
        self.setup_logging()
        self.setup_metrics()
        self.setup_database()
        self.setup_storage()
        self.setup_processing()

    def setup_logging(self):
        self.logger = logging.getLogger('DataService')
        self.logger.setLevel(logging.INFO)

    def setup_metrics(self):
        self.data_points_processed = Counter(
            'data_points_processed_total',
            'Total number of data points processed'
        )
        self.processing_time = Histogram(
            'data_processing_seconds',
            'Time spent processing data'
        )
        start_http_server(8000)

    def setup_database(self):
        try:
            self.engine = create_engine(os.getenv('DATABASE_URL'))
            Base.metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            self.logger.info("Database connection established")
        except Exception as e:
            self.logger.error(f"Database connection error: {str(e)}")
            raise

    def setup_storage(self):
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION')
            )
            self.logger.info("S3 connection established")
        except Exception as e:
            self.logger.error(f"S3 connection error: {str(e)}")
            raise

    def setup_processing(self):
        self.processing_queue = asyncio.Queue()
        self.processing_tasks = []

    async def process_data(self, data: Dict[str, Any]):
        try:
            with self.processing_time.time():
                df = pd.DataFrame(data)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df['version'] = datetime.now().strftime('%Y%m%d_%H%M%S')
                
                await self.store_data(df)
                await self.analyze_data(df)
                
                self.data_points_processed.inc(len(df))
                self.logger.info(f"Processed {len(df)} data points")
        except Exception as e:
            self.logger.error(f"Data processing error: {str(e)}")
            raise

    async def store_data(self, df: pd.DataFrame):
        try:
            for _, row in df.iterrows():
                data_point = DataPoint(
                    timestamp=row['timestamp'],
                    metric_type=row['type'],
                    value=row['value'],
                    metadata=row.get('metadata', {}),
                    source=row.get('source', 'unknown'),
                    version=row['version']
                )
                self.session.add(data_point)
            
            self.session.commit()
            
            await self.backup_to_s3(df)
        except Exception as e:
            self.session.rollback()
            self.logger.error(f"Data storage error: {str(e)}")
            raise

    async def backup_to_s3(self, df: pd.DataFrame):
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"backup_{timestamp}.parquet"
            
            df.to_parquet(filename)
            
            self.s3_client.upload_file(
                filename,
                os.getenv('S3_BUCKET'),
                f"backups/{filename}"
            )
            
            os.remove(filename)
            self.logger.info(f"Backed up data to S3: {filename}")
        except Exception as e:
            self.logger.error(f"S3 backup error: {str(e)}")
            raise

    async def analyze_data(self, df: pd.DataFrame):
        try:
            analysis = {
                'timestamp': datetime.now().isoformat(),
                'metrics': {
                    'count': len(df),
                    'mean': df['value'].mean(),
                    'std': df['value'].std(),
                    'min': df['value'].min(),
                    'max': df['value'].max()
                },
                'types': df['type'].value_counts().to_dict()
            }
            
            await self.store_analysis(analysis)
        except Exception as e:
            self.logger.error(f"Data analysis error: {str(e)}")
            raise

    async def store_analysis(self, analysis: Dict[str, Any]):
        try:
            filename = f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(filename, 'w') as f:
                json.dump(analysis, f)
            
            self.s3_client.upload_file(
                filename,
                os.getenv('S3_BUCKET'),
                f"analysis/{filename}"
            )
            
            os.remove(filename)
            self.logger.info(f"Stored analysis: {filename}")
        except Exception as e:
            self.logger.error(f"Analysis storage error: {str(e)}")
            raise

    async def query_data(self, 
                        start_time: datetime,
                        end_time: datetime,
                        metric_types: Optional[List[str]] = None) -> pd.DataFrame:
        try:
            query = self.session.query(DataPoint).filter(
                DataPoint.timestamp.between(start_time, end_time)
            )
            
            if metric_types:
                query = query.filter(DataPoint.metric_type.in_(metric_types))
            
            results = query.all()
            
            return pd.DataFrame([{
                'timestamp': r.timestamp,
                'type': r.metric_type,
                'value': r.value,
                'metadata': r.metadata,
                'source': r.source,
                'version': r.version
            } for r in results])
        except Exception as e:
            self.logger.error(f"Data query error: {str(e)}")
            raise

data_service = DataService()

class DataRequest(BaseModel):
    data: List[Dict[str, Any]]
    source: str
    metadata: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    metric_types: Optional[List[str]] = None

@app.post("/data")
async def ingest_data(request: DataRequest, background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(data_service.process_data, request.data)
        return {"status": "processing"}
    except Exception as e:
        logger.error(f"Data ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_data(request: QueryRequest):
    try:
        results = await data_service.query_data(
            request.start_time,
            request.end_time,
            request.metric_types
        )
        return results.to_dict(orient='records')
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {
            "data_points_processed": data_service.data_points_processed._value.get()
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 