import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import faker
from faker.providers import internet, company

class ConfigGenerator:
    def __init__(self, locale: str = "en_US"):
        self.faker = faker.Faker(locale)
        self.faker.add_provider(internet)
        self.faker.add_provider(company)
        
        # Environment types
        self.environments = ["development", "staging", "production"]
        
        # Feature flags
        self.feature_flags = [
            "enable_new_ui",
            "enable_analytics",
            "enable_notifications",
            "enable_multi_currency",
            "enable_advanced_search",
            "enable_api_v2",
            "enable_caching",
            "enable_rate_limiting"
        ]
        
        # Integration types
        self.integration_types = [
            "payment_gateway",
            "email_service",
            "sms_service",
            "analytics",
            "storage",
            "cdn",
            "monitoring",
            "logging"
        ]
        
        # Security levels
        self.security_levels = ["low", "medium", "high", "critical"]
        
        # Cache types
        self.cache_types = ["redis", "memcached", "local"]
        
        # Database types
        self.database_types = ["postgresql", "mysql", "mongodb"]

    def generate_system_config(self, environment: str) -> Dict:
        """Generate system-wide configuration."""
        return {
            "system": {
                "environment": environment,
                "version": f"{random.randint(1, 10)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
                "debug": environment != "production",
                "timezone": self.faker.timezone(),
                "locale": self.faker.locale(),
                "maintenance_mode": False,
                "maintenance_message": "",
                "allowed_hosts": [
                    self.faker.domain_name(),
                    self.faker.domain_name(),
                    self.faker.domain_name()
                ]
            },
            "security": {
                "level": random.choice(self.security_levels),
                "ssl_enabled": True,
                "ssl_cert_path": "/etc/ssl/certs/terrafusionpro.crt",
                "ssl_key_path": "/etc/ssl/private/terrafusionpro.key",
                "allowed_origins": [
                    f"https://{self.faker.domain_name()}",
                    f"https://{self.faker.domain_name()}"
                ],
                "rate_limiting": {
                    "enabled": True,
                    "requests_per_minute": random.randint(60, 300),
                    "burst_limit": random.randint(10, 50)
                },
                "password_policy": {
                    "min_length": 8,
                    "require_uppercase": True,
                    "require_lowercase": True,
                    "require_numbers": True,
                    "require_special": True,
                    "max_age_days": 90
                }
            },
            "database": {
                "type": random.choice(self.database_types),
                "host": self.faker.hostname(),
                "port": random.randint(1024, 65535),
                "name": f"terrafusionpro_{environment}",
                "user": self.faker.user_name(),
                "password": self.faker.password(),
                "pool_size": random.randint(5, 50),
                "timeout": random.randint(5, 30),
                "ssl_mode": "require" if environment == "production" else "prefer"
            },
            "cache": {
                "type": random.choice(self.cache_types),
                "host": self.faker.hostname(),
                "port": random.randint(1024, 65535),
                "password": self.faker.password(),
                "ttl": random.randint(300, 3600),
                "max_memory": f"{random.randint(100, 1000)}MB"
            },
            "logging": {
                "level": "DEBUG" if environment != "production" else "INFO",
                "format": "json",
                "handlers": ["file", "console"],
                "file_path": f"/var/log/terrafusionpro/{environment}.log",
                "max_size": "100MB",
                "backup_count": 10,
                "sensitive_fields": [
                    "password",
                    "token",
                    "secret",
                    "key"
                ]
            },
            "monitoring": {
                "enabled": True,
                "metrics_port": random.randint(1024, 65535),
                "health_check_interval": 30,
                "alert_thresholds": {
                    "cpu_usage": 80,
                    "memory_usage": 80,
                    "disk_usage": 80,
                    "error_rate": 1
                }
            }
        }

    def generate_feature_flags(self, environment: str) -> Dict:
        """Generate feature flag configuration."""
        flags = {}
        for flag in self.feature_flags:
            if environment == "production":
                # In production, features are more likely to be disabled
                flags[flag] = random.random() < 0.3
            elif environment == "staging":
                # In staging, features are more likely to be enabled
                flags[flag] = random.random() < 0.7
            else:
                # In development, all features are enabled
                flags[flag] = True
        
        return {
            "features": flags,
            "rollout_percentage": random.randint(0, 100),
            "target_users": [],
            "target_organizations": [],
            "expiry_date": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat()
        }

    def generate_integration_config(self, environment: str) -> Dict:
        """Generate integration configuration."""
        integrations = {}
        for integration_type in self.integration_types:
            integrations[integration_type] = {
                "enabled": random.random() < 0.8,
                "api_key": self.faker.uuid4(),
                "api_secret": self.faker.uuid4(),
                "endpoint": f"https://api.{self.faker.domain_name()}/v1",
                "timeout": random.randint(5, 30),
                "retry_attempts": random.randint(1, 3),
                "retry_delay": random.randint(1, 5),
                "webhook_url": f"https://{self.faker.domain_name()}/webhook",
                "webhook_secret": self.faker.uuid4()
            }
        
        return {
            "integrations": integrations,
            "default_timeout": 30,
            "default_retry_attempts": 3,
            "default_retry_delay": 5
        }

    def generate_test_config(self, environment: str, output_file: str):
        """Generate complete test configuration and save to file."""
        config = {
            "system": self.generate_system_config(environment),
            "features": self.generate_feature_flags(environment),
            "integrations": self.generate_integration_config(environment),
            "generated_at": datetime.now().isoformat(),
            "environment": environment
        }
        
        with open(output_file, "w") as f:
            json.dump(config, f, indent=2)
        
        return config

    def validate_config(self, config: Dict) -> bool:
        """Validate configuration structure and requirements."""
        required_sections = ["system", "features", "integrations"]
        
        # Check required sections
        for section in required_sections:
            if section not in config:
                return False
        
        # Validate system config
        system = config["system"]
        if system["environment"] not in self.environments:
            return False
        
        # Validate feature flags
        features = config["features"]
        for flag in self.feature_flags:
            if flag not in features["features"]:
                return False
        
        # Validate integrations
        integrations = config["integrations"]
        for integration_type in self.integration_types:
            if integration_type not in integrations["integrations"]:
                return False
        
        return True

if __name__ == "__main__":
    # Example usage
    generator = ConfigGenerator()
    
    # Generate test configurations for each environment
    for env in generator.environments:
        config = generator.generate_test_config(
            env,
            f"tests/fixtures/config_{env}.json"
        )
        
        # Validate generated config
        if generator.validate_config(config):
            print(f"Generated valid configuration for {env} environment")
        else:
            print(f"Generated invalid configuration for {env} environment") 