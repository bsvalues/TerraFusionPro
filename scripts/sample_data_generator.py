import random
import json
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Any

class SampleDataGenerator:
    def __init__(self):
        self.scenarios = {
            'normal': self._generate_normal_data,
            'high_load': self._generate_high_load_data,
            'security_breach': self._generate_security_breach_data,
            'performance_degradation': self._generate_performance_degradation_data,
            'resource_contention': self._generate_resource_contention_data
        }
        
    def generate_data(self, scenario: str = 'normal', duration_minutes: int = 60) -> List[Dict[str, Any]]:
        if scenario not in self.scenarios:
            raise ValueError(f"Unknown scenario: {scenario}")
            
        return self.scenarios[scenario](duration_minutes)
        
    def _generate_normal_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.3, 0.7),
                    'memory_usage': random.uniform(0.4, 0.6),
                    'cpu_usage': random.uniform(0.3, 0.7),
                    'disk_usage': random.uniform(0.4, 0.6),
                    'network_usage': random.uniform(0.3, 0.7),
                    'error_rate': random.uniform(0.0, 0.1),
                    'response_time': random.uniform(50, 150),
                    'throughput': random.uniform(800, 1200),
                    'security_score': random.uniform(0.8, 1.0),
                    'reliability_score': random.uniform(0.8, 1.0)
                }
            })
            
        return data
        
    def _generate_high_load_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            load_factor = min(1.0, 0.3 + (i / duration_minutes) * 0.7)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.7, 0.9) * load_factor,
                    'memory_usage': random.uniform(0.7, 0.9) * load_factor,
                    'cpu_usage': random.uniform(0.7, 0.9) * load_factor,
                    'disk_usage': random.uniform(0.6, 0.8),
                    'network_usage': random.uniform(0.7, 0.9) * load_factor,
                    'error_rate': random.uniform(0.1, 0.3),
                    'response_time': random.uniform(150, 300),
                    'throughput': random.uniform(600, 800),
                    'security_score': random.uniform(0.6, 0.8),
                    'reliability_score': random.uniform(0.6, 0.8)
                }
            })
            
        return data
        
    def _generate_security_breach_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            breach_factor = min(1.0, 0.2 + (i / duration_minutes) * 0.8)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.5, 0.7),
                    'memory_usage': random.uniform(0.5, 0.7),
                    'cpu_usage': random.uniform(0.5, 0.7),
                    'disk_usage': random.uniform(0.5, 0.7),
                    'network_usage': random.uniform(0.7, 0.9) * breach_factor,
                    'error_rate': random.uniform(0.2, 0.4) * breach_factor,
                    'response_time': random.uniform(100, 200),
                    'throughput': random.uniform(700, 900),
                    'security_score': random.uniform(0.2, 0.4) * (1 - breach_factor),
                    'reliability_score': random.uniform(0.6, 0.8)
                }
            })
            
        return data
        
    def _generate_performance_degradation_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            degradation_factor = min(1.0, 0.3 + (i / duration_minutes) * 0.7)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.6, 0.8) * degradation_factor,
                    'memory_usage': random.uniform(0.7, 0.9) * degradation_factor,
                    'cpu_usage': random.uniform(0.6, 0.8) * degradation_factor,
                    'disk_usage': random.uniform(0.5, 0.7),
                    'network_usage': random.uniform(0.5, 0.7),
                    'error_rate': random.uniform(0.1, 0.3) * degradation_factor,
                    'response_time': random.uniform(200, 400) * degradation_factor,
                    'throughput': random.uniform(500, 700) * (1 - degradation_factor),
                    'security_score': random.uniform(0.7, 0.9),
                    'reliability_score': random.uniform(0.4, 0.6) * (1 - degradation_factor)
                }
            })
            
        return data
        
    def _generate_resource_contention_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            contention_factor = np.sin(i / duration_minutes * np.pi) * 0.5 + 0.5
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.6, 0.8) * contention_factor,
                    'memory_usage': random.uniform(0.7, 0.9) * contention_factor,
                    'cpu_usage': random.uniform(0.6, 0.8) * contention_factor,
                    'disk_usage': random.uniform(0.7, 0.9) * contention_factor,
                    'network_usage': random.uniform(0.6, 0.8) * contention_factor,
                    'error_rate': random.uniform(0.1, 0.3) * contention_factor,
                    'response_time': random.uniform(150, 300) * contention_factor,
                    'throughput': random.uniform(600, 800) * (1 - contention_factor),
                    'security_score': random.uniform(0.7, 0.9),
                    'reliability_score': random.uniform(0.5, 0.7) * (1 - contention_factor)
                }
            })
            
        return data
        
    def save_data(self, data: List[Dict[str, Any]], filename: str):
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
            
    def load_data(self, filename: str) -> List[Dict[str, Any]]:
        with open(filename, 'r') as f:
            return json.load(f)
            
if __name__ == '__main__':
    generator = SampleDataGenerator()
    
    # Generate data for each scenario
    scenarios = ['normal', 'high_load', 'security_breach', 'performance_degradation', 'resource_contention']
    
    for scenario in scenarios:
        data = generator.generate_data(scenario, duration_minutes=60)
        generator.save_data(data, f'sample_data_{scenario}.json')
        print(f"Generated {len(data)} data points for scenario: {scenario}") 