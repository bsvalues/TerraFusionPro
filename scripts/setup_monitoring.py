import os
import sys
import subprocess
import json
import secrets
import string
from pathlib import Path
from typing import Dict, Optional

class MonitoringSetup:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.monitoring_dir = self.root_dir / "monitoring"
        self.scripts_dir = self.root_dir / "scripts"
        self.env_file = self.root_dir / ".env"
        self.config_file = self.monitoring_dir / "pipeline_monitoring.yml"
    
    def generate_secret(self, length: int = 32) -> str:
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def create_env_file(self):
        env_vars = {
            "SLACK_WEBHOOK_URL": f"https://hooks.slack.com/services/{self.generate_secret(24)}",
            "SMTP_SERVER": "smtp.gmail.com",
            "SMTP_PORT": "587",
            "SMTP_USERNAME": "monitoring@terrafusionpro.com",
            "SMTP_PASSWORD": self.generate_secret(),
            "NOTIFICATION_EMAIL": "alerts@terrafusionpro.com",
            "GRAFANA_URL": "http://localhost:3000",
            "GRAFANA_API_KEY": self.generate_secret(),
            "DASHBOARD_ACTION": "create"
        }
        
        env_content = "\n".join(f"{key}={value}" for key, value in env_vars.items())
        
        with open(self.env_file, "w") as f:
            f.write(env_content)
        
        print("Created .env file with secure configuration")
    
    def install_dependencies(self):
        requirements_files = [
            self.root_dir / "requirements.txt",
            self.monitoring_dir / "requirements.txt"
        ]
        
        for req_file in requirements_files:
            if req_file.exists():
                subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(req_file)], check=True)
                print(f"Installed dependencies from {req_file}")
    
    def setup_directories(self):
        directories = [
            self.monitoring_dir / "logs",
            self.monitoring_dir / "reports",
            self.monitoring_dir / "dashboards",
            self.root_dir / "tests" / "reports",
            self.root_dir / "tests" / "artifacts"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"Created directory: {directory}")
    
    def setup_prometheus(self):
        prometheus_config = {
            "global": {
                "scrape_interval": "15s",
                "evaluation_interval": "15s"
            },
            "scrape_configs": [
                {
                    "job_name": "pipeline_monitoring",
                    "static_configs": [
                        {
                            "targets": ["localhost:8000"]
                        }
                    ]
                }
            ]
        }
        
        prometheus_dir = self.monitoring_dir / "prometheus"
        prometheus_dir.mkdir(exist_ok=True)
        
        with open(prometheus_dir / "prometheus.yml", "w") as f:
            json.dump(prometheus_config, f, indent=2)
        
        print("Created Prometheus configuration")
    
    def setup_grafana(self):
        grafana_config = {
            "server": {
                "http_port": 3000,
                "domain": "localhost"
            },
            "security": {
                "admin_user": "admin",
                "admin_password": self.generate_secret()
            },
            "auth": {
                "disable_login_form": False,
                "oauth_auto_login": False
            }
        }
        
        grafana_dir = self.monitoring_dir / "grafana"
        grafana_dir.mkdir(exist_ok=True)
        
        with open(grafana_dir / "grafana.ini", "w") as f:
            for section, settings in grafana_config.items():
                f.write(f"[{section}]\n")
                for key, value in settings.items():
                    f.write(f"{key} = {value}\n")
                f.write("\n")
        
        print("Created Grafana configuration")
    
    def setup_docker_compose(self):
        docker_compose = {
            "version": "3.8",
            "services": {
                "prometheus": {
                    "image": "prom/prometheus:latest",
                    "ports": ["9090:9090"],
                    "volumes": [
                        "./monitoring/prometheus:/etc/prometheus",
                        "prometheus_data:/prometheus"
                    ],
                    "command": [
                        "--config.file=/etc/prometheus/prometheus.yml",
                        "--storage.tsdb.path=/prometheus",
                        "--web.console.libraries=/usr/share/prometheus/console_libraries",
                        "--web.console.templates=/usr/share/prometheus/consoles"
                    ]
                },
                "grafana": {
                    "image": "grafana/grafana:latest",
                    "ports": ["3000:3000"],
                    "volumes": [
                        "./monitoring/grafana:/etc/grafana",
                        "grafana_data:/var/lib/grafana"
                    ],
                    "environment": {
                        "GF_SECURITY_ADMIN_PASSWORD": "${GRAFANA_ADMIN_PASSWORD}"
                    },
                    "depends_on": ["prometheus"]
                }
            },
            "volumes": {
                "prometheus_data": {},
                "grafana_data": {}
            }
        }
        
        with open(self.root_dir / "docker-compose.yml", "w") as f:
            json.dump(docker_compose, f, indent=2)
        
        print("Created Docker Compose configuration")
    
    def setup_monitoring_system(self):
        try:
            subprocess.run([sys.executable, str(self.monitoring_dir / "monitoring_system.py")], check=True)
            print("Started monitoring system")
        except subprocess.CalledProcessError as e:
            print(f"Error starting monitoring system: {e}")
    
    def setup_dashboards(self):
        try:
            subprocess.run([sys.executable, str(self.monitoring_dir / "dashboard_config.py")], check=True)
            print("Created monitoring dashboards")
        except subprocess.CalledProcessError as e:
            print(f"Error creating dashboards: {e}")
    
    def run(self):
        print("Starting monitoring system setup...")
        
        self.create_env_file()
        self.install_dependencies()
        self.setup_directories()
        self.setup_prometheus()
        self.setup_grafana()
        self.setup_docker_compose()
        
        print("\nSetup completed successfully!")
        print("\nNext steps:")
        print("1. Start the monitoring system:")
        print("   python monitoring/monitoring_system.py")
        print("2. Start the containers:")
        print("   docker-compose up -d")
        print("3. Access the dashboards:")
        print("   - Prometheus: http://localhost:9090")
        print("   - Grafana: http://localhost:3000")

def main():
    setup = MonitoringSetup()
    setup.run()

if __name__ == "__main__":
    main() 