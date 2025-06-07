import os
import json
from typing import Dict, List, Optional, Any
from pathlib import Path
from faker import Faker
from datetime import datetime, timedelta
import random
import string

class FixtureGenerator:
    def __init__(self, locale: str = "en_US"):
        self.faker = Faker(locale)
        self.generated_data: Dict[str, Any] = {}

    def generate_user_data(self, count: int = 1) -> Dict[str, Dict]:
        """Generate user test data."""
        users = {}
        for i in range(count):
            user_id = str(i + 1)
            users[f"user_{user_id}"] = {
                "id": user_id,
                "username": self.faker.user_name(),
                "email": self.faker.email(),
                "first_name": self.faker.first_name(),
                "last_name": self.faker.last_name(),
                "created_at": self.faker.date_time_this_year().isoformat(),
                "is_active": random.choice([True, False]),
                "role": random.choice(["admin", "user", "guest"]),
                "permissions": self._generate_permissions()
            }
        return users

    def generate_transaction_data(self, count: int = 1, user_ids: Optional[List[str]] = None) -> Dict[str, Dict]:
        """Generate transaction test data."""
        transactions = {}
        if not user_ids:
            user_ids = [str(i + 1) for i in range(count)]
        
        for i in range(count):
            transaction_id = str(i + 1)
            user_id = random.choice(user_ids)
            transactions[f"transaction_{transaction_id}"] = {
                "id": transaction_id,
                "user_id": user_id,
                "amount": round(random.uniform(10.0, 1000.0), 2),
                "currency": random.choice(["USD", "EUR", "GBP"]),
                "status": random.choice(["completed", "pending", "failed"]),
                "created_at": self.faker.date_time_this_month().isoformat(),
                "payment_method": random.choice(["credit_card", "debit_card", "bank_transfer"]),
                "description": self.faker.sentence()
            }
        return transactions

    def generate_product_data(self, count: int = 1) -> Dict[str, Dict]:
        """Generate product test data."""
        products = {}
        for i in range(count):
            product_id = str(i + 1)
            products[f"product_{product_id}"] = {
                "id": product_id,
                "name": self.faker.word().capitalize(),
                "description": self.faker.sentence(),
                "price": round(random.uniform(1.0, 1000.0), 2),
                "category": random.choice(["electronics", "clothing", "food", "books"]),
                "in_stock": random.choice([True, False]),
                "created_at": self.faker.date_time_this_year().isoformat(),
                "tags": self._generate_tags()
            }
        return products

    def generate_order_data(self, count: int = 1, user_ids: Optional[List[str]] = None, product_ids: Optional[List[str]] = None) -> Dict[str, Dict]:
        """Generate order test data."""
        orders = {}
        if not user_ids:
            user_ids = [str(i + 1) for i in range(count)]
        if not product_ids:
            product_ids = [str(i + 1) for i in range(count)]
        
        for i in range(count):
            order_id = str(i + 1)
            user_id = random.choice(user_ids)
            num_items = random.randint(1, 5)
            items = []
            total_amount = 0
            
            for _ in range(num_items):
                product_id = random.choice(product_ids)
                quantity = random.randint(1, 3)
                price = round(random.uniform(10.0, 100.0), 2)
                items.append({
                    "product_id": product_id,
                    "quantity": quantity,
                    "price": price,
                    "subtotal": round(quantity * price, 2)
                })
                total_amount += quantity * price
            
            orders[f"order_{order_id}"] = {
                "id": order_id,
                "user_id": user_id,
                "items": items,
                "total_amount": round(total_amount, 2),
                "status": random.choice(["pending", "processing", "shipped", "delivered"]),
                "created_at": self.faker.date_time_this_month().isoformat(),
                "shipping_address": self._generate_address(),
                "payment_status": random.choice(["paid", "pending", "failed"])
            }
        return orders

    def generate_address_data(self, count: int = 1) -> Dict[str, Dict]:
        """Generate address test data."""
        addresses = {}
        for i in range(count):
            address_id = str(i + 1)
            addresses[f"address_{address_id}"] = self._generate_address()
        return addresses

    def _generate_permissions(self) -> List[str]:
        """Generate random permissions."""
        all_permissions = ["read", "write", "delete", "admin", "view", "edit", "create"]
        return random.sample(all_permissions, random.randint(1, len(all_permissions)))

    def _generate_tags(self) -> List[str]:
        """Generate random tags."""
        return [self.faker.word() for _ in range(random.randint(1, 5))]

    def _generate_address(self) -> Dict:
        """Generate a random address."""
        return {
            "street": self.faker.street_address(),
            "city": self.faker.city(),
            "state": self.faker.state(),
            "country": self.faker.country(),
            "zip_code": self.faker.zipcode(),
            "is_default": random.choice([True, False])
        }

    def generate_test_data(self, data_types: List[str], counts: Optional[Dict[str, int]] = None) -> Dict[str, Dict]:
        """Generate test data for specified types."""
        if not counts:
            counts = {data_type: 1 for data_type in data_types}
        
        generated_data = {}
        for data_type in data_types:
            count = counts.get(data_type, 1)
            if data_type == "users":
                generated_data.update(self.generate_user_data(count))
            elif data_type == "transactions":
                generated_data.update(self.generate_transaction_data(count))
            elif data_type == "products":
                generated_data.update(self.generate_product_data(count))
            elif data_type == "orders":
                generated_data.update(self.generate_order_data(count))
            elif data_type == "addresses":
                generated_data.update(self.generate_address_data(count))
        
        self.generated_data = generated_data
        return generated_data

    def save_generated_data(self, output_path: str):
        """Save generated data to a file."""
        with open(output_path, "w") as f:
            json.dump(self.generated_data, f, indent=2)

    def load_generated_data(self, input_path: str) -> Dict[str, Dict]:
        """Load generated data from a file."""
        with open(input_path, "r") as f:
            self.generated_data = json.load(f)
        return self.generated_data

if __name__ == "__main__":
    # Example usage
    generator = FixtureGenerator()
    
    # Generate test data
    data_types = ["users", "transactions", "products", "orders", "addresses"]
    counts = {
        "users": 5,
        "transactions": 10,
        "products": 8,
        "orders": 15,
        "addresses": 5
    }
    
    test_data = generator.generate_test_data(data_types, counts)
    
    # Save generated data
    generator.save_generated_data("tests/fixtures/generated_test_data.json")
    
    print(f"Generated {len(test_data)} test fixtures") 