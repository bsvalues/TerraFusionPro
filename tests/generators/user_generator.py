import random
import string
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import faker
from faker.providers import internet, person, address, phone_number

class UserGenerator:
    def __init__(self, locale: str = "en_US"):
        self.faker = faker.Faker(locale)
        self.faker.add_provider(internet)
        self.faker.add_provider(person)
        self.faker.add_provider(address)
        self.faker.add_provider(phone_number)
        
        # User roles and permissions
        self.roles = ["admin", "user", "manager", "viewer"]
        self.permissions = {
            "admin": ["read", "write", "delete", "manage"],
            "user": ["read", "write"],
            "manager": ["read", "write", "manage"],
            "viewer": ["read"]
        }
        
        # User statuses
        self.statuses = ["active", "inactive", "suspended", "pending"]
        
        # Password requirements
        self.password_requirements = {
            "min_length": 8,
            "require_uppercase": True,
            "require_lowercase": True,
            "require_numbers": True,
            "require_special": True
        }

    def generate_password(self) -> str:
        """Generate a secure password meeting requirements."""
        chars = []
        if self.password_requirements["require_uppercase"]:
            chars.extend(string.ascii_uppercase)
        if self.password_requirements["require_lowercase"]:
            chars.extend(string.ascii_lowercase)
        if self.password_requirements["require_numbers"]:
            chars.extend(string.digits)
        if self.password_requirements["require_special"]:
            chars.extend(string.punctuation)
        
        password = []
        for _ in range(self.password_requirements["min_length"]):
            password.append(random.choice(chars))
        
        return "".join(password)

    def generate_user(self, role: Optional[str] = None) -> Dict:
        """Generate a single user with random data."""
        if role is None:
            role = random.choice(self.roles)
        
        created_at = self.faker.date_time_between(
            start_date="-1y",
            end_date="now"
        )
        
        last_login = self.faker.date_time_between(
            start_date=created_at,
            end_date="now"
        ) if random.random() > 0.2 else None
        
        user = {
            "id": str(self.faker.uuid4()),
            "username": self.faker.user_name(),
            "email": self.faker.email(),
            "password": self.generate_password(),
            "first_name": self.faker.first_name(),
            "last_name": self.faker.last_name(),
            "role": role,
            "permissions": self.permissions[role],
            "status": random.choice(self.statuses),
            "created_at": created_at.isoformat(),
            "last_login": last_login.isoformat() if last_login else None,
            "phone": self.faker.phone_number(),
            "address": {
                "street": self.faker.street_address(),
                "city": self.faker.city(),
                "state": self.faker.state(),
                "zip": self.faker.zipcode(),
                "country": self.faker.country()
            },
            "preferences": {
                "language": self.faker.language_code(),
                "timezone": self.faker.timezone(),
                "notifications": {
                    "email": random.choice([True, False]),
                    "sms": random.choice([True, False]),
                    "push": random.choice([True, False])
                }
            },
            "metadata": {
                "last_password_change": self.faker.date_time_between(
                    start_date=created_at,
                    end_date="now"
                ).isoformat(),
                "failed_login_attempts": random.randint(0, 5),
                "account_locked": random.choice([True, False]),
                "two_factor_enabled": random.choice([True, False])
            }
        }
        
        return user

    def generate_users(self, count: int, role: Optional[str] = None) -> List[Dict]:
        """Generate multiple users."""
        return [self.generate_user(role) for _ in range(count)]

    def generate_test_data(self, output_file: str, count: int = 100):
        """Generate test data and save to file."""
        users = self.generate_users(count)
        
        with open(output_file, "w") as f:
            json.dump(users, f, indent=2)
        
        return users

    def validate_user(self, user: Dict) -> bool:
        """Validate user data structure and requirements."""
        required_fields = [
            "id", "username", "email", "password", "first_name",
            "last_name", "role", "permissions", "status", "created_at"
        ]
        
        # Check required fields
        for field in required_fields:
            if field not in user:
                return False
        
        # Validate email format
        if "@" not in user["email"] or "." not in user["email"]:
            return False
        
        # Validate password requirements
        password = user["password"]
        if len(password) < self.password_requirements["min_length"]:
            return False
        if self.password_requirements["require_uppercase"] and not any(c.isupper() for c in password):
            return False
        if self.password_requirements["require_lowercase"] and not any(c.islower() for c in password):
            return False
        if self.password_requirements["require_numbers"] and not any(c.isdigit() for c in password):
            return False
        if self.password_requirements["require_special"] and not any(c in string.punctuation for c in password):
            return False
        
        # Validate role and permissions
        if user["role"] not in self.roles:
            return False
        if not all(p in self.permissions[user["role"]] for p in user["permissions"]):
            return False
        
        # Validate status
        if user["status"] not in self.statuses:
            return False
        
        return True

if __name__ == "__main__":
    # Example usage
    generator = UserGenerator()
    
    # Generate test data
    users = generator.generate_test_data("tests/fixtures/users.json", count=100)
    
    # Validate generated data
    valid_users = [user for user in users if generator.validate_user(user)]
    print(f"Generated {len(users)} users, {len(valid_users)} valid") 