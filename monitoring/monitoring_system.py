import os
import json
import yaml
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
import requests
from prometheus_client import start_http_server, Gauge, Counter, Summary
import slack_sdk
from slack_sdk.webhook import WebhookClient
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class MonitoringSystem:
    def __init__(self, config_path: str = "monitoring/pipeline_monitoring.yml"):
        self.config = self._load_config(config_path)
        self._setup_logging()
        self._setup_metrics()
        self._setup_notifications()
        self._start_metrics_server()
    
    def _load_config(self, config_path: str) -> dict:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('monitoring/monitoring.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('MonitoringSystem')
    
    def _setup_metrics(self):
        self.metrics = {}
        
        for metric in self.config['metrics']['pipeline']:
            if metric['type'] == 'gauge':
                self.metrics[metric['name']] = Gauge(
                    metric['name'],
                    metric['description'],
                    metric['labels']
                )
            elif metric['type'] == 'counter':
                self.metrics[metric['name']] = Counter(
                    metric['name'],
                    metric['description'],
                    metric['labels']
                )
    
    def _setup_notifications(self):
        self.slack = WebhookClient(url=os.getenv('SLACK_WEBHOOK_URL'))
        self.email_config = {
            'server': os.getenv('SMTP_SERVER'),
            'port': int(os.getenv('SMTP_PORT', '587')),
            'username': os.getenv('SMTP_USERNAME'),
            'password': os.getenv('SMTP_PASSWORD'),
            'from_address': os.getenv('NOTIFICATION_EMAIL'),
            'to_addresses': [os.getenv('NOTIFICATION_EMAIL')]
        }
    
    def _start_metrics_server(self):
        start_http_server(8000)
    
    def record_pipeline_metric(self, name: str, value: float, labels: Dict[str, str]):
        if name in self.metrics:
            self.metrics[name].labels(**labels).set(value)
            self.logger.info(f"Recorded metric {name} with value {value} and labels {labels}")
    
    def increment_counter(self, name: str, labels: Dict[str, str], amount: int = 1):
        if name in self.metrics:
            self.metrics[name].labels(**labels).inc(amount)
            self.logger.info(f"Incremented counter {name} by {amount} with labels {labels}")
    
    def check_alerts(self):
        for alert in self.config['alerts']['pipeline']:
            metric_name = alert['condition'].split()[0]
            if metric_name in self.metrics:
                value = self.metrics[metric_name]._value.get()
                condition = eval(alert['condition'])
                if condition:
                    self._send_alert(alert, value)
    
    def _send_alert(self, alert: dict, value: float):
        message = alert['notification']['message'].format(
            severity=alert['severity'],
            description=alert['description'],
            value=value
        )
        
        if 'slack' in alert['notification']['channels']:
            self._send_slack_alert(message, alert['severity'])
        
        if 'email' in alert['notification']['channels']:
            self._send_email_alert(message, alert['severity'])
    
    def _send_slack_alert(self, message: str, severity: str):
        try:
            self.slack.send(
                text=message,
                blocks=[
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*{severity.upper()} Alert*\n{message}"
                        }
                    }
                ]
            )
            self.logger.info(f"Sent Slack alert: {message}")
        except Exception as e:
            self.logger.error(f"Failed to send Slack alert: {str(e)}")
    
    def _send_email_alert(self, message: str, severity: str):
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_config['from_address']
            msg['To'] = ', '.join(self.email_config['to_addresses'])
            msg['Subject'] = f"Pipeline Alert: {severity} - {message.split('.')[0]}"
            
            msg.attach(MIMEText(message, 'plain'))
            
            with smtplib.SMTP(self.email_config['server'], self.email_config['port']) as server:
                server.starttls()
                server.login(self.email_config['username'], self.email_config['password'])
                server.send_message(msg)
            
            self.logger.info(f"Sent email alert: {message}")
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {str(e)}")
    
    def cleanup_old_data(self):
        retention = self.config['retention']
        now = datetime.now()
        
        for metric_type, days in retention.items():
            cutoff_date = now - timedelta(days=int(days[:-1]))
            self._cleanup_metric_data(metric_type, cutoff_date)
    
    def _cleanup_metric_data(self, metric_type: str, cutoff_date: datetime):
        if metric_type == 'metrics':
            self._cleanup_metrics(cutoff_date)
        elif metric_type == 'logs':
            self._cleanup_logs(cutoff_date)
        elif metric_type == 'reports':
            self._cleanup_reports(cutoff_date)
        elif metric_type == 'artifacts':
            self._cleanup_artifacts(cutoff_date)
    
    def _cleanup_metrics(self, cutoff_date: datetime):
        for metric in self.metrics.values():
            if hasattr(metric, '_value'):
                for label_set in metric._metrics.keys():
                    if metric._value.get(label_set) < cutoff_date.timestamp():
                        metric._value.remove(label_set)
    
    def _cleanup_logs(self, cutoff_date: datetime):
        log_dir = 'monitoring/logs'
        for file in os.listdir(log_dir):
            file_path = os.path.join(log_dir, file)
            if os.path.getmtime(file_path) < cutoff_date.timestamp():
                os.remove(file_path)
    
    def _cleanup_reports(self, cutoff_date: datetime):
        report_dir = 'tests/reports'
        for file in os.listdir(report_dir):
            file_path = os.path.join(report_dir, file)
            if os.path.getmtime(file_path) < cutoff_date.timestamp():
                os.remove(file_path)
    
    def _cleanup_artifacts(self, cutoff_date: datetime):
        artifact_dir = 'tests/artifacts'
        for file in os.listdir(artifact_dir):
            file_path = os.path.join(artifact_dir, file)
            if os.path.getmtime(file_path) < cutoff_date.timestamp():
                os.remove(file_path)

def main():
    monitoring = MonitoringSystem()
    
    while True:
        try:
            monitoring.check_alerts()
            monitoring.cleanup_old_data()
            time.sleep(60)
        except Exception as e:
            logging.error(f"Error in monitoring loop: {str(e)}")
            time.sleep(60)

if __name__ == "__main__":
    main() 