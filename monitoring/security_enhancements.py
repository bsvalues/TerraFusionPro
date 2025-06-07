import logging
from typing import Dict, List, Any
import json
from datetime import datetime
import hashlib
import hmac
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import jwt
import requests
from urllib.parse import urlparse

class SecurityEnhancements:
    def __init__(self, secret_key: str):
        self.setup_logging()
        self.secret_key = secret_key
        self.setup_encryption()
        self.setup_authentication()
        self.threat_patterns = self._load_threat_patterns()
        self.security_metrics = {}
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('SecurityEnhancements')
        
    def setup_encryption(self):
        salt = b'terrafusion_salt'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret_key.encode()))
        self.fernet = Fernet(key)
        
    def setup_authentication(self):
        self.jwt_secret = hashlib.sha256(self.secret_key.encode()).hexdigest()
        
    def _load_threat_patterns(self) -> Dict[str, Any]:
        return {
            'brute_force': {
                'pattern': r'failed_login_attempts > 5',
                'severity': 'high',
                'action': 'block_ip'
            },
            'data_exfiltration': {
                'pattern': r'large_data_transfer > 100MB',
                'severity': 'critical',
                'action': 'alert_admin'
            },
            'suspicious_activity': {
                'pattern': r'unusual_access_pattern',
                'severity': 'medium',
                'action': 'monitor'
            }
        }
        
    def encrypt_data(self, data: Dict[str, Any]) -> str:
        try:
            json_data = json.dumps(data)
            encrypted_data = self.fernet.encrypt(json_data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            self.logger.error(f"Error encrypting data: {str(e)}")
            return ""
            
    def decrypt_data(self, encrypted_data: str) -> Dict[str, Any]:
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data)
            decrypted_data = self.fernet.decrypt(decoded_data)
            return json.loads(decrypted_data.decode())
        except Exception as e:
            self.logger.error(f"Error decrypting data: {str(e)}")
            return {}
            
    def generate_token(self, user_data: Dict[str, Any]) -> str:
        try:
            payload = {
                'user_id': user_data.get('user_id'),
                'role': user_data.get('role'),
                'exp': datetime.utcnow().timestamp() + 3600
            }
            return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
        except Exception as e:
            self.logger.error(f"Error generating token: {str(e)}")
            return ""
            
    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            return jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
        except Exception as e:
            self.logger.error(f"Error verifying token: {str(e)}")
            return {}
            
    def analyze_security_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        try:
            security_score = self._calculate_security_score(metrics)
            threats = self._detect_threats(metrics)
            recommendations = self._generate_security_recommendations(metrics, threats)
            
            return {
                'security_score': security_score,
                'threats': threats,
                'recommendations': recommendations,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error analyzing security metrics: {str(e)}")
            return {}
            
    def _calculate_security_score(self, metrics: Dict[str, Any]) -> float:
        try:
            weights = {
                'error_rate': 0.2,
                'response_time': 0.1,
                'throughput': 0.1,
                'network_usage': 0.2,
                'system_load': 0.2,
                'memory_usage': 0.1,
                'cpu_usage': 0.1
            }
            
            score = 0.0
            for metric, weight in weights.items():
                value = metrics.get(metric, 0.0)
                if metric in ['error_rate', 'response_time']:
                    score += (1.0 - value) * weight
                else:
                    score += value * weight
                    
            return min(1.0, max(0.0, score))
        except Exception as e:
            self.logger.error(f"Error calculating security score: {str(e)}")
            return 0.0
            
    def _detect_threats(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            threats = []
            
            # Check for brute force attempts
            if metrics.get('error_rate', 0.0) > 0.5:
                threats.append({
                    'type': 'brute_force',
                    'severity': 'high',
                    'description': 'Multiple failed login attempts detected'
                })
                
            # Check for data exfiltration
            if metrics.get('network_usage', 0.0) > 0.8:
                threats.append({
                    'type': 'data_exfiltration',
                    'severity': 'critical',
                    'description': 'Unusual data transfer detected'
                })
                
            # Check for suspicious activity
            if metrics.get('system_load', 0.0) > 0.8 and metrics.get('memory_usage', 0.0) > 0.8:
                threats.append({
                    'type': 'suspicious_activity',
                    'severity': 'medium',
                    'description': 'Unusual system resource usage detected'
                })
                
            return threats
        except Exception as e:
            self.logger.error(f"Error detecting threats: {str(e)}")
            return []
            
    def _generate_security_recommendations(self, metrics: Dict[str, Any], threats: List[Dict[str, Any]]) -> List[str]:
        try:
            recommendations = []
            
            # General recommendations based on metrics
            if metrics.get('error_rate', 0.0) > 0.3:
                recommendations.append("Implement rate limiting for authentication attempts")
                
            if metrics.get('network_usage', 0.0) > 0.7:
                recommendations.append("Review network traffic patterns and implement traffic monitoring")
                
            if metrics.get('system_load', 0.0) > 0.7:
                recommendations.append("Implement resource usage monitoring and alerts")
                
            # Specific recommendations based on threats
            for threat in threats:
                if threat['type'] == 'brute_force':
                    recommendations.append("Implement IP-based blocking for failed login attempts")
                elif threat['type'] == 'data_exfiltration':
                    recommendations.append("Implement data loss prevention measures")
                elif threat['type'] == 'suspicious_activity':
                    recommendations.append("Implement real-time system monitoring and alerting")
                    
            return recommendations
        except Exception as e:
            self.logger.error(f"Error generating security recommendations: {str(e)}")
            return []
            
    def validate_url(self, url: str) -> bool:
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception as e:
            self.logger.error(f"Error validating URL: {str(e)}")
            return False
            
    def validate_input(self, data: Dict[str, Any]) -> bool:
        try:
            for key, value in data.items():
                if isinstance(value, str):
                    # Check for SQL injection patterns
                    if any(pattern in value.lower() for pattern in ['select', 'insert', 'update', 'delete', 'drop']):
                        return False
                    # Check for XSS patterns
                    if any(pattern in value for pattern in ['<script>', 'javascript:', 'onerror=']):
                        return False
            return True
        except Exception as e:
            self.logger.error(f"Error validating input: {str(e)}")
            return False
            
    def monitor_security_metrics(self, metrics: Dict[str, Any]):
        try:
            timestamp = datetime.now().isoformat()
            self.security_metrics[timestamp] = metrics
            
            # Keep only last 1000 metrics
            if len(self.security_metrics) > 1000:
                self.security_metrics = dict(list(self.security_metrics.items())[-1000:])
                
            # Analyze metrics
            analysis = self.analyze_security_metrics(metrics)
            
            # Log security events
            if analysis.get('threats'):
                for threat in analysis['threats']:
                    self.logger.warning(f"Security threat detected: {threat['description']}")
                    
            return analysis
        except Exception as e:
            self.logger.error(f"Error monitoring security metrics: {str(e)}")
            return {} 