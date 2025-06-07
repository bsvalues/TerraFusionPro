import json
import os
from typing import Dict, List, Optional
import requests
from datetime import datetime, timedelta

class DashboardConfig:
    def __init__(self, config_path: str = "monitoring/pipeline_monitoring.yml"):
        self.config = self._load_config(config_path)
        self.grafana_url = os.getenv('GRAFANA_URL', 'http://localhost:3000')
        self.grafana_api_key = os.getenv('GRAFANA_API_KEY')
        self.headers = {
            'Authorization': f'Bearer {self.grafana_api_key}',
            'Content-Type': 'application/json'
        }
    
    def _load_config(self, config_path: str) -> dict:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    
    def create_dashboards(self):
        for dashboard_name, dashboard_config in self.config['dashboards'].items():
            self._create_dashboard(dashboard_name, dashboard_config)
    
    def _create_dashboard(self, name: str, config: dict):
        dashboard = {
            'dashboard': {
                'id': None,
                'uid': name.lower().replace(' ', '_'),
                'title': config['title'],
                'tags': ['pipeline', 'monitoring'],
                'timezone': 'browser',
                'schemaVersion': 30,
                'version': 1,
                'refresh': '10s',
                'panels': self._create_panels(config['panels'])
            },
            'overwrite': True
        }
        
        try:
            response = requests.post(
                f'{self.grafana_url}/api/dashboards/db',
                headers=self.headers,
                json=dashboard
            )
            response.raise_for_status()
            print(f"Created dashboard: {name}")
        except Exception as e:
            print(f"Failed to create dashboard {name}: {str(e)}")
    
    def _create_panels(self, panels: List[dict]) -> List[dict]:
        created_panels = []
        
        for i, panel in enumerate(panels):
            created_panel = {
                'id': i + 1,
                'title': panel['title'],
                'type': self._get_panel_type(panel['type']),
                'datasource': 'Prometheus',
                'gridPos': self._calculate_grid_position(i),
                'targets': self._create_targets(panel['metrics']),
                'options': self._get_panel_options(panel['type'])
            }
            created_panels.append(created_panel)
        
        return created_panels
    
    def _get_panel_type(self, type_name: str) -> str:
        type_mapping = {
            'graph': 'graph',
            'gauge': 'gauge',
            'pie': 'piechart',
            'stat': 'stat'
        }
        return type_mapping.get(type_name, 'graph')
    
    def _calculate_grid_position(self, index: int) -> dict:
        row = index // 2
        col = (index % 2) * 12
        return {
            'x': col,
            'y': row * 8,
            'w': 12,
            'h': 8
        }
    
    def _create_targets(self, metrics: List[str]) -> List[dict]:
        targets = []
        for metric in metrics:
            target = {
                'expr': metric,
                'refId': metric,
                'legendFormat': '{{' + '}}'.join(self._get_metric_labels(metric))
            }
            targets.append(target)
        return targets
    
    def _get_metric_labels(self, metric_name: str) -> List[str]:
        for metric in self.config['metrics']['pipeline']:
            if metric['name'] == metric_name:
                return metric['labels']
        return []
    
    def _get_panel_options(self, panel_type: str) -> dict:
        options = {
            'graph': {
                'legend': {'show': True},
                'tooltip': {'shared': True},
                'visualization': {'type': 'line'}
            },
            'gauge': {
                'orientation': 'auto',
                'showThresholdLabels': True,
                'showThresholdMarkers': True
            },
            'pie': {
                'legend': {'show': True},
                'pieType': 'pie',
                'tooltip': {'shared': True}
            },
            'stat': {
                'colorMode': 'value',
                'graphMode': 'area',
                'justifyMode': 'auto'
            }
        }
        return options.get(panel_type, {})
    
    def update_dashboards(self):
        for dashboard_name, dashboard_config in self.config['dashboards'].items():
            self._update_dashboard(dashboard_name, dashboard_config)
    
    def _update_dashboard(self, name: str, config: dict):
        try:
            response = requests.get(
                f'{self.grafana_url}/api/dashboards/uid/{name.lower().replace(" ", "_")}',
                headers=self.headers
            )
            response.raise_for_status()
            dashboard = response.json()['dashboard']
            
            dashboard['title'] = config['title']
            dashboard['panels'] = self._create_panels(config['panels'])
            
            update_response = requests.post(
                f'{self.grafana_url}/api/dashboards/db',
                headers=self.headers,
                json={'dashboard': dashboard, 'overwrite': True}
            )
            update_response.raise_for_status()
            print(f"Updated dashboard: {name}")
        except Exception as e:
            print(f"Failed to update dashboard {name}: {str(e)}")
    
    def delete_dashboards(self):
        for dashboard_name in self.config['dashboards'].keys():
            self._delete_dashboard(dashboard_name)
    
    def _delete_dashboard(self, name: str):
        try:
            response = requests.delete(
                f'{self.grafana_url}/api/dashboards/uid/{name.lower().replace(" ", "_")}',
                headers=self.headers
            )
            response.raise_for_status()
            print(f"Deleted dashboard: {name}")
        except Exception as e:
            print(f"Failed to delete dashboard {name}: {str(e)}")

def main():
    config = DashboardConfig()
    
    if os.getenv('DASHBOARD_ACTION') == 'create':
        config.create_dashboards()
    elif os.getenv('DASHBOARD_ACTION') == 'update':
        config.update_dashboards()
    elif os.getenv('DASHBOARD_ACTION') == 'delete':
        config.delete_dashboards()
    else:
        print("Please set DASHBOARD_ACTION environment variable to 'create', 'update', or 'delete'")

if __name__ == "__main__":
    main() 