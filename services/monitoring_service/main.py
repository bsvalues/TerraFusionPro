from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import logging
import json
from datetime import datetime, timedelta
import asyncio
import aiohttp
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import psutil
import os
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError

load_dotenv()

app = FastAPI(title="TerraFusion Monitoring Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MonitoringService:
    def __init__(self):
        self.setup_logging()
        self.setup_metrics()
        self.setup_storage()
        self.setup_alerting()

    def setup_logging(self):
        self.logger = logging.getLogger('MonitoringService')
        self.logger.setLevel(logging.INFO)

    def setup_metrics(self):
        self.system_metrics = {
            'cpu_usage': Gauge('cpu_usage_percent', 'CPU usage percentage'),
            'memory_usage': Gauge('memory_usage_percent', 'Memory usage percentage'),
            'disk_usage': Gauge('disk_usage_percent', 'Disk usage percentage'),
            'network_io': Gauge('network_io_bytes', 'Network I/O in bytes'),
            'error_count': Counter('error_count_total', 'Total number of errors'),
            'request_count': Counter('request_count_total', 'Total number of requests'),
            'response_time': Histogram('response_time_seconds', 'Response time in seconds')
        }
        start_http_server(8000)

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

    def setup_alerting(self):
        self.alert_thresholds = {
            'cpu_usage': 80,
            'memory_usage': 85,
            'disk_usage': 90,
            'error_rate': 0.05,
            'response_time': 1.0
        }
        self.active_alerts = {}

    async def collect_metrics(self):
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net_io = psutil.net_io_counters()

            self.system_metrics['cpu_usage'].set(cpu_percent)
            self.system_metrics['memory_usage'].set(memory.percent)
            self.system_metrics['disk_usage'].set(disk.percent)
            self.system_metrics['network_io'].set(net_io.bytes_sent + net_io.bytes_recv)

            await self.check_alerts({
                'cpu_usage': cpu_percent,
                'memory_usage': memory.percent,
                'disk_usage': disk.percent
            })

            self.logger.info("Metrics collected successfully")
        except Exception as e:
            self.logger.error(f"Error collecting metrics: {str(e)}")
            raise

    async def check_alerts(self, metrics: Dict[str, float]):
        try:
            for metric, value in metrics.items():
                if value > self.alert_thresholds[metric]:
                    if metric not in self.active_alerts:
                        await self.create_alert(metric, value)
                else:
                    if metric in self.active_alerts:
                        await self.resolve_alert(metric)
        except Exception as e:
            self.logger.error(f"Error checking alerts: {str(e)}")
            raise

    async def create_alert(self, metric: str, value: float):
        try:
            alert = {
                'metric': metric,
                'value': value,
                'threshold': self.alert_thresholds[metric],
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'active'
            }
            
            self.active_alerts[metric] = alert
            
            await self.store_alert(alert)
            await self.notify_alert(alert)
            
            self.logger.warning(f"Alert created: {metric} = {value}")
        except Exception as e:
            self.logger.error(f"Error creating alert: {str(e)}")
            raise

    async def resolve_alert(self, metric: str):
        try:
            if metric in self.active_alerts:
                alert = self.active_alerts[metric]
                alert['status'] = 'resolved'
                alert['resolved_at'] = datetime.utcnow().isoformat()
                
                await self.store_alert(alert)
                await self.notify_resolution(alert)
                
                del self.active_alerts[metric]
                
                self.logger.info(f"Alert resolved: {metric}")
        except Exception as e:
            self.logger.error(f"Error resolving alert: {str(e)}")
            raise

    async def store_alert(self, alert: Dict[str, Any]):
        try:
            filename = f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(filename, 'w') as f:
                json.dump(alert, f)
            
            self.s3_client.upload_file(
                filename,
                os.getenv('S3_BUCKET'),
                f"alerts/{filename}"
            )
            
            os.remove(filename)
            self.logger.info(f"Alert stored: {filename}")
        except Exception as e:
            self.logger.error(f"Error storing alert: {str(e)}")
            raise

    async def notify_alert(self, alert: Dict[str, Any]):
        try:
            message = f"ALERT: {alert['metric']} = {alert['value']} (threshold: {alert['threshold']})"
            self.logger.warning(message)
            
            if os.getenv('SLACK_WEBHOOK_URL'):
                async with aiohttp.ClientSession() as session:
                    await session.post(
                        os.getenv('SLACK_WEBHOOK_URL'),
                        json={'text': message}
                    )
        except Exception as e:
            self.logger.error(f"Error notifying alert: {str(e)}")
            raise

    async def notify_resolution(self, alert: Dict[str, Any]):
        try:
            message = f"RESOLVED: {alert['metric']} alert"
            self.logger.info(message)
            
            if os.getenv('SLACK_WEBHOOK_URL'):
                async with aiohttp.ClientSession() as session:
                    await session.post(
                        os.getenv('SLACK_WEBHOOK_URL'),
                        json={'text': message}
                    )
        except Exception as e:
            self.logger.error(f"Error notifying resolution: {str(e)}")
            raise

    def get_metrics(self) -> Dict[str, Any]:
        try:
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'metrics': {
                    'cpu_usage': self.system_metrics['cpu_usage']._value.get(),
                    'memory_usage': self.system_metrics['memory_usage']._value.get(),
                    'disk_usage': self.system_metrics['disk_usage']._value.get(),
                    'network_io': self.system_metrics['network_io']._value.get(),
                    'error_count': self.system_metrics['error_count']._value.get(),
                    'request_count': self.system_metrics['request_count']._value.get()
                },
                'alerts': list(self.active_alerts.values())
            }
        except Exception as e:
            self.logger.error(f"Error getting metrics: {str(e)}")
            raise

monitoring_service = MonitoringService()

@app.get("/metrics")
async def get_metrics():
    try:
        return monitoring_service.get_metrics()
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {
            "cpu_usage": monitoring_service.system_metrics['cpu_usage']._value.get(),
            "memory_usage": monitoring_service.system_metrics['memory_usage']._value.get()
        }
    }

async def collect_metrics_periodically():
    while True:
        await monitoring_service.collect_metrics()
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(collect_metrics_periodically())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 