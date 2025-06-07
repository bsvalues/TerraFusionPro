from typing import Dict, Any, Optional, List
import jwt
import time
import logging
from datetime import datetime, timedelta
import hashlib
import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import redis
import json
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityConfig(BaseModel):
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    token_expiry: int = 3600
    redis_url: str
    max_failed_attempts: int = 5
    lockout_duration: int = 300

class ZeroTrustSecurity:
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.redis_client = redis.from_url(config.redis_url)
        self.security = HTTPBearer()

    def generate_token(self, user_id: str, roles: List[str]) -> str:
        try:
            payload = {
                "user_id": user_id,
                "roles": roles,
                "exp": datetime.utcnow() + timedelta(seconds=self.config.token_expiry),
                "iat": datetime.utcnow()
            }
            return jwt.encode(payload, self.config.jwt_secret, algorithm=self.config.jwt_algorithm)
        except Exception as e:
            logger.error(f"Error generating token: {str(e)}")
            raise

    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, self.config.jwt_secret, algorithms=[self.config.jwt_algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def check_rate_limit(self, user_id: str) -> bool:
        key = f"rate_limit:{user_id}"
        current = int(time.time())
        window = 60  # 1 minute window
        
        # Get existing requests
        requests = self.redis_client.zrangebyscore(key, current - window, current)
        
        if len(requests) >= 100:  # Max 100 requests per minute
            return False
        
        # Add new request
        self.redis_client.zadd(key, {str(current): current})
        self.redis_client.expire(key, window)
        return True

    def check_failed_attempts(self, user_id: str) -> bool:
        key = f"failed_attempts:{user_id}"
        attempts = int(self.redis_client.get(key) or 0)
        
        if attempts >= self.config.max_failed_attempts:
            return False
        
        return True

    def record_failed_attempt(self, user_id: str):
        key = f"failed_attempts:{user_id}"
        self.redis_client.incr(key)
        self.redis_client.expire(key, self.config.lockout_duration)

    def reset_failed_attempts(self, user_id: str):
        key = f"failed_attempts:{user_id}"
        self.redis_client.delete(key)

    def verify_request(self, credentials: HTTPAuthorizationCredentials = Security(HTTPBearer())) -> Dict[str, Any]:
        try:
            # Verify token
            payload = self.verify_token(credentials.credentials)
            user_id = payload["user_id"]
            
            # Check rate limit
            if not self.check_rate_limit(user_id):
                raise HTTPException(status_code=429, detail="Rate limit exceeded")
            
            # Check failed attempts
            if not self.check_failed_attempts(user_id):
                raise HTTPException(status_code=403, detail="Account temporarily locked")
            
            return payload
            
        except Exception as e:
            logger.error(f"Error verifying request: {str(e)}")
            raise

    def generate_device_fingerprint(self, request_data: Dict[str, Any]) -> str:
        # Create a unique fingerprint based on request data
        fingerprint_data = {
            "ip": request_data.get("ip"),
            "user_agent": request_data.get("user_agent"),
            "timestamp": datetime.utcnow().isoformat()
        }
        return hashlib.sha256(json.dumps(fingerprint_data).encode()).hexdigest()

    def verify_device(self, user_id: str, fingerprint: str) -> bool:
        key = f"device:{user_id}"
        known_devices = self.redis_client.smembers(key)
        
        if not known_devices:
            # First time device, add it
            self.redis_client.sadd(key, fingerprint)
            return True
        
        return fingerprint in known_devices

    def log_security_event(self, event_type: str, user_id: str, details: Dict[str, Any]):
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "details": details
        }
        
        # Store in Redis for quick access
        key = f"security_events:{user_id}"
        self.redis_client.lpush(key, json.dumps(event))
        self.redis_client.ltrim(key, 0, 999)  # Keep last 1000 events
        
        # Log to file
        logger.info(f"Security event: {json.dumps(event)}")

    def get_security_events(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        key = f"security_events:{user_id}"
        events = self.redis_client.lrange(key, 0, limit - 1)
        return [json.loads(event) for event in events] 