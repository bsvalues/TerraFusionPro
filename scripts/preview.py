import os
import sys
import json
import time
import random
from datetime import datetime, timedelta
import numpy as np
from flask import Flask, jsonify
import threading
from monitoring.enhanced_monitoring import EnhancedMonitoringSystem

app = Flask(__name__)
monitoring = None

def generate_sample_metrics():
    base_time = datetime.now()
    metrics = []
    
    for i in range(100):
        timestamp = (base_time - timedelta(minutes=i)).isoformat()
        metrics.append({
            'name': 'system_load',
            'value': random.uniform(0.1, 0.9),
            'timestamp': timestamp
        })
    
    return metrics

def generate_sample_insights():
    return [
        {
            'type': 'performance',
            'data': {
                'reliability': random.uniform(0.8, 0.99),
                'efficiency': random.uniform(0.7, 0.95),
                'scalability': random.uniform(0.75, 0.98)
            },
            'recommendations': [
                'Optimize database queries for better performance',
                'Consider implementing caching for frequently accessed data',
                'Monitor memory usage and implement garbage collection'
            ]
        },
        {
            'type': 'security',
            'data': {
                'threat_level': random.choice(['low', 'medium', 'high']),
                'vulnerabilities': [
                    'Outdated dependencies',
                    'Weak password policies'
                ],
                'incidents': [
                    'Failed login attempts detected',
                    'Suspicious API access patterns'
                ]
            },
            'recommendations': [
                'Update system dependencies',
                'Implement rate limiting',
                'Enable two-factor authentication'
            ]
        },
        {
            'type': 'knowledge',
            'data': {
                'central_components': ['API Gateway', 'Database', 'Cache'],
                'critical_paths': [
                    ['API Gateway', 'Database'],
                    ['API Gateway', 'Cache']
                ],
                'communities': [
                    ['API Gateway', 'Load Balancer'],
                    ['Database', 'Cache']
                ]
            },
            'recommendations': [
                'Optimize API Gateway to Database communication',
                'Implement circuit breakers for critical paths',
                'Monitor community health metrics'
            ]
        }
    ]

@app.route('/api/metrics')
def get_metrics():
    return jsonify(generate_sample_metrics())

@app.route('/api/insights')
def get_insights():
    return jsonify(generate_sample_insights())

def start_monitoring():
    global monitoring
    monitoring = EnhancedMonitoringSystem()
    
    while True:
        try:
            metrics = generate_sample_metrics()
            insights = generate_sample_insights()
            
            for metric in metrics:
                monitoring.record_metric(metric['name'], metric['value'])
            
            for insight in insights:
                monitoring.update_knowledge_graph(insight)
            
            time.sleep(60)
        except Exception as e:
            print(f"Error in monitoring loop: {e}")
            time.sleep(60)

def main():
    print("Starting TerraFusion Preview Environment...")
    print("\n1. Starting monitoring system...")
    monitoring_thread = threading.Thread(target=start_monitoring)
    monitoring_thread.daemon = True
    monitoring_thread.start()
    
    print("2. Starting API server...")
    print("\nPreview environment is ready!")
    print("\nAccess the following endpoints:")
    print("- Metrics: http://localhost:5000/api/metrics")
    print("- Insights: http://localhost:5000/api/insights")
    print("\nTo view the dashboard:")
    print("1. Open a new terminal")
    print("2. Navigate to the frontend directory")
    print("3. Run 'npm start'")
    print("\nThe dashboard will be available at http://localhost:3000")
    
    app.run(port=5000)

if __name__ == "__main__":
    main() 