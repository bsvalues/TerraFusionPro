import logging
import json
from datetime import datetime, timedelta
import hashlib
import hmac
import base64
from typing import Dict, List, Any, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import jwt
import bcrypt
from dataclasses import dataclass
import os

@dataclass
class SecurityConfig:
    secret_key: str
    algorithm: str = 'HS256'
    token_expiry: int = 3600
    max_login_attempts: int = 5
    lockout_duration: int = 900
    password_min_length: int = 12
    require_special_chars: bool = True
    require_numbers: bool = True
    require_uppercase: bool = True
    require_lowercase: bool = True

class AdvancedSecurity:
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.setup_logging()
        self._load_threat_patterns()
        self._initialize_encryption()
        self._initialize_authentication()
        self._initialize_monitoring()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('AdvancedSecurity')

    def _load_threat_patterns(self):
        self.threat_patterns = {
            'brute_force': {
                'pattern': r'Failed login attempts: (\d+)',
                'threshold': 5,
                'window': 300
            },
            'sql_injection': {
                'pattern': r'(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)',
                'threshold': 1,
                'window': 60
            },
            'xss_attack': {
                'pattern': r'(?i)(<script|javascript:|on\w+=)',
                'threshold': 1,
                'window': 60
            },
            'path_traversal': {
                'pattern': r'(?i)(\.\./|\.\.\\|/etc/passwd)',
                'threshold': 1,
                'window': 60
            }
        }

    def _initialize_encryption(self):
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.config.secret_key.encode()))
        self.fernet = Fernet(key)

    def _initialize_authentication(self):
        self.login_attempts = {}
        self.locked_accounts = {}
        self.active_sessions = {}

    def _initialize_monitoring(self):
        self.security_metrics = {
            'failed_logins': 0,
            'successful_logins': 0,
            'blocked_requests': 0,
            'encryption_operations': 0,
            'decryption_operations': 0,
            'token_generations': 0,
            'token_validations': 0
        }
        self.threat_detections = []

    def encrypt_data(self, data: str) -> str:
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            self.security_metrics['encryption_operations'] += 1
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            self.logger.error(f"Encryption error: {str(e)}")
            raise

    def decrypt_data(self, encrypted_data: str) -> str:
        try:
            decrypted_data = self.fernet.decrypt(base64.urlsafe_b64decode(encrypted_data))
            self.security_metrics['decryption_operations'] += 1
            return decrypted_data.decode()
        except Exception as e:
            self.logger.error(f"Decryption error: {str(e)}")
            raise

    def generate_token(self, user_id: str, additional_claims: Optional[Dict] = None) -> str:
        try:
            claims = {
                'user_id': user_id,
                'exp': datetime.utcnow() + timedelta(seconds=self.config.token_expiry)
            }
            if additional_claims:
                claims.update(additional_claims)
            
            token = jwt.encode(claims, self.config.secret_key, algorithm=self.config.algorithm)
            self.security_metrics['token_generations'] += 1
            return token
        except Exception as e:
            self.logger.error(f"Token generation error: {str(e)}")
            raise

    def verify_token(self, token: str) -> Dict:
        try:
            claims = jwt.decode(token, self.config.secret_key, algorithms=[self.config.algorithm])
            self.security_metrics['token_validations'] += 1
            return claims
        except jwt.ExpiredSignatureError:
            self.logger.warning("Token has expired")
            raise
        except jwt.InvalidTokenError as e:
            self.logger.error(f"Invalid token: {str(e)}")
            raise

    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode(), salt).decode()

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(password.encode(), hashed_password.encode())

    def validate_password_strength(self, password: str) -> bool:
        if len(password) < self.config.password_min_length:
            return False
        
        if self.config.require_special_chars and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            return False
        
        if self.config.require_numbers and not any(c.isdigit() for c in password):
            return False
        
        if self.config.require_uppercase and not any(c.isupper() for c in password):
            return False
        
        if self.config.require_lowercase and not any(c.islower() for c in password):
            return False
        
        return True

    def check_login_attempts(self, user_id: str) -> bool:
        if user_id in self.locked_accounts:
            lockout_time = self.locked_accounts[user_id]
            if datetime.utcnow() < lockout_time:
                return False
            else:
                del self.locked_accounts[user_id]
                self.login_attempts[user_id] = 0
        
        return True

    def record_login_attempt(self, user_id: str, success: bool):
        if success:
            self.login_attempts[user_id] = 0
            self.security_metrics['successful_logins'] += 1
        else:
            self.login_attempts[user_id] = self.login_attempts.get(user_id, 0) + 1
            self.security_metrics['failed_logins'] += 1
            
            if self.login_attempts[user_id] >= self.config.max_login_attempts:
                self.locked_accounts[user_id] = datetime.utcnow() + timedelta(seconds=self.config.lockout_duration)

    def detect_threats(self, request_data: Dict) -> List[Dict]:
        detected_threats = []
        
        for threat_type, pattern_info in self.threat_patterns.items():
            if self._check_threat_pattern(request_data, pattern_info):
                threat = {
                    'type': threat_type,
                    'timestamp': datetime.utcnow().isoformat(),
                    'details': request_data
                }
                detected_threats.append(threat)
                self.threat_detections.append(threat)
                self.security_metrics['blocked_requests'] += 1
        
        return detected_threats

    def _check_threat_pattern(self, data: Dict, pattern_info: Dict) -> bool:
        import re
        pattern = re.compile(pattern_info['pattern'])
        
        for value in data.values():
            if isinstance(value, str) and pattern.search(value):
                return True
        
        return False

    def get_security_metrics(self) -> Dict:
        return {
            'metrics': self.security_metrics,
            'threat_detections': len(self.threat_detections),
            'locked_accounts': len(self.locked_accounts),
            'active_sessions': len(self.active_sessions)
        }

    def validate_input(self, data: Any, validation_rules: Dict) -> bool:
        if not isinstance(data, dict):
            return False
        
        for field, rules in validation_rules.items():
            if field not in data:
                return False
            
            value = data[field]
            
            if 'type' in rules and not isinstance(value, rules['type']):
                return False
            
            if 'min_length' in rules and len(str(value)) < rules['min_length']:
                return False
            
            if 'max_length' in rules and len(str(value)) > rules['max_length']:
                return False
            
            if 'pattern' in rules and not re.match(rules['pattern'], str(value)):
                return False
        
        return True

    def sanitize_input(self, data: str) -> str:
        import html
        return html.escape(data)

    def generate_secure_random_string(self, length: int = 32) -> str:
        return base64.urlsafe_b64encode(os.urandom(length)).decode()[:length]

    def create_session(self, user_id: str) -> str:
        session_id = self.generate_secure_random_string()
        self.active_sessions[session_id] = {
            'user_id': user_id,
            'created_at': datetime.utcnow(),
            'last_activity': datetime.utcnow()
        }
        return session_id

    def validate_session(self, session_id: str) -> bool:
        if session_id not in self.active_sessions:
            return False
        
        session = self.active_sessions[session_id]
        if datetime.utcnow() - session['last_activity'] > timedelta(hours=1):
            del self.active_sessions[session_id]
            return False
        
        session['last_activity'] = datetime.utcnow()
        return True

    def end_session(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

    def get_active_sessions(self) -> List[Dict]:
        return [
            {
                'session_id': session_id,
                'user_id': session['user_id'],
                'created_at': session['created_at'].isoformat(),
                'last_activity': session['last_activity'].isoformat()
            }
            for session_id, session in self.active_sessions.items()
        ] 