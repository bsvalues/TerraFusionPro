import random
import json
from datetime import datetime, timedelta
import numpy as np
from typing import Dict, List, Any

class AdvancedDataGenerator:
    def __init__(self):
        self.scenarios = {
            'normal': self._generate_normal_data,
            'high_load': self._generate_high_load_data,
            'security_breach': self._generate_security_breach_data,
            'performance_degradation': self._generate_performance_degradation_data,
            'resource_contention': self._generate_resource_contention_data,
            'network_issues': self._generate_network_issues_data,
            'database_bottleneck': self._generate_database_bottleneck_data,
            'memory_leak': self._generate_memory_leak_data,
            'cache_miss': self._generate_cache_miss_data,
            'api_latency': self._generate_api_latency_data
        }

    def generate_data(self, scenario: str, duration_minutes: int = 60) -> List[Dict[str, Any]]:
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
                    'system_load': random.uniform(0.2, 0.4),
                    'memory_usage': random.uniform(0.3, 0.5),
                    'cpu_usage': random.uniform(0.2, 0.4),
                    'disk_usage': random.uniform(0.4, 0.6),
                    'network_usage': random.uniform(0.1, 0.3),
                    'error_rate': random.uniform(0.01, 0.05),
                    'response_time': random.uniform(50, 150),
                    'throughput': random.uniform(800, 1200),
                    'security_score': random.uniform(0.8, 1.0),
                    'reliability_score': random.uniform(0.9, 1.0)
                }
            })
        
        return data

    def _generate_high_load_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            load_factor = 1 + np.sin(i / 10) * 0.5
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.9, random.uniform(0.6, 0.8) * load_factor),
                    'memory_usage': min(0.95, random.uniform(0.7, 0.9) * load_factor),
                    'cpu_usage': min(0.95, random.uniform(0.8, 0.9) * load_factor),
                    'disk_usage': min(0.9, random.uniform(0.7, 0.8) * load_factor),
                    'network_usage': min(0.9, random.uniform(0.6, 0.8) * load_factor),
                    'error_rate': min(0.2, random.uniform(0.1, 0.15) * load_factor),
                    'response_time': random.uniform(200, 500) * load_factor,
                    'throughput': random.uniform(1500, 2000) * load_factor,
                    'security_score': max(0.5, random.uniform(0.6, 0.8) * (2 - load_factor)),
                    'reliability_score': max(0.6, random.uniform(0.7, 0.9) * (2 - load_factor))
                }
            })
        
        return data

    def _generate_security_breach_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        breach_time = start_time + timedelta(minutes=duration_minutes//2)
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            time_since_breach = (timestamp - breach_time).total_seconds() / 60
            
            if time_since_breach < 0:
                security_factor = 1.0
            else:
                security_factor = max(0.2, 1 - (time_since_breach / 10))
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': random.uniform(0.4, 0.6) * (1 + (1 - security_factor)),
                    'memory_usage': random.uniform(0.5, 0.7) * (1 + (1 - security_factor)),
                    'cpu_usage': random.uniform(0.6, 0.8) * (1 + (1 - security_factor)),
                    'disk_usage': random.uniform(0.5, 0.7) * (1 + (1 - security_factor)),
                    'network_usage': random.uniform(0.7, 0.9) * (1 + (1 - security_factor)),
                    'error_rate': min(0.4, random.uniform(0.2, 0.3) * (1 + (1 - security_factor))),
                    'response_time': random.uniform(300, 600) * (1 + (1 - security_factor)),
                    'throughput': random.uniform(1000, 1500) * (1 - (1 - security_factor)),
                    'security_score': security_factor,
                    'reliability_score': max(0.3, security_factor - 0.2)
                }
            })
        
        return data

    def _generate_performance_degradation_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            degradation_factor = 1 + (i / duration_minutes)
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.95, random.uniform(0.5, 0.7) * degradation_factor),
                    'memory_usage': min(0.95, random.uniform(0.6, 0.8) * degradation_factor),
                    'cpu_usage': min(0.95, random.uniform(0.7, 0.9) * degradation_factor),
                    'disk_usage': min(0.95, random.uniform(0.6, 0.8) * degradation_factor),
                    'network_usage': min(0.95, random.uniform(0.5, 0.7) * degradation_factor),
                    'error_rate': min(0.3, random.uniform(0.1, 0.2) * degradation_factor),
                    'response_time': random.uniform(200, 400) * degradation_factor,
                    'throughput': random.uniform(1000, 1500) / degradation_factor,
                    'security_score': max(0.4, random.uniform(0.5, 0.7) / degradation_factor),
                    'reliability_score': max(0.3, random.uniform(0.4, 0.6) / degradation_factor)
                }
            })
        
        return data

    def _generate_resource_contention_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            contention_factor = 1 + np.sin(i / 5) * 0.5
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.95, random.uniform(0.6, 0.8) * contention_factor),
                    'memory_usage': min(0.95, random.uniform(0.7, 0.9) * contention_factor),
                    'cpu_usage': min(0.95, random.uniform(0.8, 0.9) * contention_factor),
                    'disk_usage': min(0.95, random.uniform(0.7, 0.8) * contention_factor),
                    'network_usage': min(0.95, random.uniform(0.6, 0.8) * contention_factor),
                    'error_rate': min(0.25, random.uniform(0.1, 0.2) * contention_factor),
                    'response_time': random.uniform(300, 500) * contention_factor,
                    'throughput': random.uniform(1200, 1800) / contention_factor,
                    'security_score': max(0.5, random.uniform(0.6, 0.8) / contention_factor),
                    'reliability_score': max(0.4, random.uniform(0.5, 0.7) / contention_factor)
                }
            })
        
        return data

    def _generate_network_issues_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            network_factor = 1 + np.sin(i / 3) * 0.8
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.9, random.uniform(0.4, 0.6) * network_factor),
                    'memory_usage': min(0.9, random.uniform(0.5, 0.7) * network_factor),
                    'cpu_usage': min(0.9, random.uniform(0.6, 0.8) * network_factor),
                    'disk_usage': min(0.9, random.uniform(0.5, 0.7) * network_factor),
                    'network_usage': min(0.95, random.uniform(0.8, 0.9) * network_factor),
                    'error_rate': min(0.3, random.uniform(0.15, 0.25) * network_factor),
                    'response_time': random.uniform(400, 800) * network_factor,
                    'throughput': random.uniform(800, 1200) / network_factor,
                    'security_score': max(0.4, random.uniform(0.5, 0.7) / network_factor),
                    'reliability_score': max(0.3, random.uniform(0.4, 0.6) / network_factor)
                }
            })
        
        return data

    def _generate_database_bottleneck_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            db_factor = 1 + np.sin(i / 4) * 0.6
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.9, random.uniform(0.5, 0.7) * db_factor),
                    'memory_usage': min(0.9, random.uniform(0.6, 0.8) * db_factor),
                    'cpu_usage': min(0.9, random.uniform(0.7, 0.9) * db_factor),
                    'disk_usage': min(0.95, random.uniform(0.8, 0.9) * db_factor),
                    'network_usage': min(0.9, random.uniform(0.5, 0.7) * db_factor),
                    'error_rate': min(0.25, random.uniform(0.1, 0.2) * db_factor),
                    'response_time': random.uniform(500, 1000) * db_factor,
                    'throughput': random.uniform(600, 1000) / db_factor,
                    'security_score': max(0.5, random.uniform(0.6, 0.8) / db_factor),
                    'reliability_score': max(0.4, random.uniform(0.5, 0.7) / db_factor)
                }
            })
        
        return data

    def _generate_memory_leak_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            leak_factor = 1 + (i / duration_minutes) * 2
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.95, random.uniform(0.6, 0.8) * leak_factor),
                    'memory_usage': min(0.98, random.uniform(0.7, 0.9) * leak_factor),
                    'cpu_usage': min(0.95, random.uniform(0.8, 0.9) * leak_factor),
                    'disk_usage': min(0.95, random.uniform(0.7, 0.8) * leak_factor),
                    'network_usage': min(0.9, random.uniform(0.5, 0.7) * leak_factor),
                    'error_rate': min(0.3, random.uniform(0.15, 0.25) * leak_factor),
                    'response_time': random.uniform(400, 800) * leak_factor,
                    'throughput': random.uniform(800, 1200) / leak_factor,
                    'security_score': max(0.3, random.uniform(0.4, 0.6) / leak_factor),
                    'reliability_score': max(0.2, random.uniform(0.3, 0.5) / leak_factor)
                }
            })
        
        return data

    def _generate_cache_miss_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            cache_factor = 1 + np.sin(i / 2) * 0.7
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.9, random.uniform(0.5, 0.7) * cache_factor),
                    'memory_usage': min(0.9, random.uniform(0.6, 0.8) * cache_factor),
                    'cpu_usage': min(0.9, random.uniform(0.7, 0.9) * cache_factor),
                    'disk_usage': min(0.9, random.uniform(0.6, 0.8) * cache_factor),
                    'network_usage': min(0.9, random.uniform(0.5, 0.7) * cache_factor),
                    'error_rate': min(0.2, random.uniform(0.1, 0.15) * cache_factor),
                    'response_time': random.uniform(300, 600) * cache_factor,
                    'throughput': random.uniform(1000, 1500) / cache_factor,
                    'security_score': max(0.5, random.uniform(0.6, 0.8) / cache_factor),
                    'reliability_score': max(0.4, random.uniform(0.5, 0.7) / cache_factor)
                }
            })
        
        return data

    def _generate_api_latency_data(self, duration_minutes: int) -> List[Dict[str, Any]]:
        data = []
        start_time = datetime.now()
        
        for i in range(duration_minutes):
            timestamp = start_time + timedelta(minutes=i)
            latency_factor = 1 + np.sin(i / 3) * 0.9
            
            data.append({
                'timestamp': timestamp.isoformat(),
                'metrics': {
                    'system_load': min(0.9, random.uniform(0.4, 0.6) * latency_factor),
                    'memory_usage': min(0.9, random.uniform(0.5, 0.7) * latency_factor),
                    'cpu_usage': min(0.9, random.uniform(0.6, 0.8) * latency_factor),
                    'disk_usage': min(0.9, random.uniform(0.5, 0.7) * latency_factor),
                    'network_usage': min(0.95, random.uniform(0.7, 0.9) * latency_factor),
                    'error_rate': min(0.25, random.uniform(0.1, 0.2) * latency_factor),
                    'response_time': random.uniform(600, 1200) * latency_factor,
                    'throughput': random.uniform(700, 1100) / latency_factor,
                    'security_score': max(0.4, random.uniform(0.5, 0.7) / latency_factor),
                    'reliability_score': max(0.3, random.uniform(0.4, 0.6) / latency_factor)
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
    generator = AdvancedDataGenerator()
    
    for scenario in generator.scenarios.keys():
        data = generator.generate_data(scenario, duration_minutes=60)
        generator.save_data(data, f'sample_data_{scenario}.json')
        print(f"Generated {len(data)} data points for {scenario} scenario") 