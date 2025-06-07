import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import faker
from faker.providers import credit_card, company, date_time

class TransactionGenerator:
    def __init__(self, locale: str = "en_US"):
        self.faker = faker.Faker(locale)
        self.faker.add_provider(credit_card)
        self.faker.add_provider(company)
        self.faker.add_provider(date_time)
        
        # Transaction types
        self.transaction_types = [
            "purchase",
            "refund",
            "transfer",
            "deposit",
            "withdrawal",
            "fee",
            "adjustment"
        ]
        
        # Transaction statuses
        self.statuses = [
            "pending",
            "completed",
            "failed",
            "cancelled",
            "refunded",
            "disputed"
        ]
        
        # Payment methods
        self.payment_methods = [
            "credit_card",
            "debit_card",
            "bank_transfer",
            "paypal",
            "crypto",
            "check"
        ]
        
        # Currency codes
        self.currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
        
        # Merchant categories
        self.merchant_categories = [
            "retail",
            "restaurant",
            "travel",
            "entertainment",
            "utilities",
            "services",
            "other"
        ]

    def generate_amount(self, min_amount: float = 1.0, max_amount: float = 10000.0) -> float:
        """Generate a random transaction amount."""
        return round(random.uniform(min_amount, max_amount), 2)

    def generate_transaction(self, user_id: str) -> Dict:
        """Generate a single transaction with random data."""
        transaction_type = random.choice(self.transaction_types)
        status = random.choice(self.statuses)
        payment_method = random.choice(self.payment_methods)
        currency = random.choice(self.currencies)
        
        # Generate timestamps
        created_at = self.faker.date_time_between(
            start_date="-1y",
            end_date="now"
        )
        
        # Calculate processing time based on status
        if status == "completed":
            processing_time = random.randint(1, 60)  # 1-60 minutes
        elif status == "pending":
            processing_time = None
        else:
            processing_time = random.randint(1, 30)  # 1-30 minutes
        
        updated_at = created_at + timedelta(minutes=processing_time) if processing_time else None
        
        # Generate amount based on transaction type
        if transaction_type == "refund":
            amount = -self.generate_amount(1.0, 1000.0)
        elif transaction_type == "fee":
            amount = self.generate_amount(1.0, 100.0)
        else:
            amount = self.generate_amount(1.0, 10000.0)
        
        transaction = {
            "id": str(self.faker.uuid4()),
            "user_id": user_id,
            "type": transaction_type,
            "status": status,
            "amount": amount,
            "currency": currency,
            "payment_method": payment_method,
            "created_at": created_at.isoformat(),
            "updated_at": updated_at.isoformat() if updated_at else None,
            "merchant": {
                "name": self.faker.company(),
                "category": random.choice(self.merchant_categories),
                "location": {
                    "country": self.faker.country_code(),
                    "city": self.faker.city()
                }
            },
            "payment_details": self._generate_payment_details(payment_method),
            "metadata": {
                "ip_address": self.faker.ipv4(),
                "device_id": self.faker.uuid4(),
                "session_id": self.faker.uuid4(),
                "risk_score": random.randint(0, 100),
                "fraud_detected": random.random() < 0.01
            }
        }
        
        return transaction

    def _generate_payment_details(self, payment_method: str) -> Dict:
        """Generate payment method specific details."""
        if payment_method in ["credit_card", "debit_card"]:
            return {
                "card_type": self.faker.credit_card_provider(),
                "last_four": self.faker.credit_card_number()[-4:],
                "expiry_date": self.faker.credit_card_expire(),
                "cvv": self.faker.credit_card_security_code()
            }
        elif payment_method == "bank_transfer":
            return {
                "account_number": self.faker.bban(),
                "routing_number": self.faker.aba(),
                "bank_name": self.faker.bank_name()
            }
        elif payment_method == "paypal":
            return {
                "email": self.faker.email(),
                "transaction_id": self.faker.uuid4()
            }
        elif payment_method == "crypto":
            return {
                "wallet_address": self.faker.sha256(),
                "transaction_hash": self.faker.sha256()
            }
        else:
            return {
                "check_number": self.faker.random_number(digits=6),
                "account_number": self.faker.bban()
            }

    def generate_transactions(self, user_id: str, count: int) -> List[Dict]:
        """Generate multiple transactions for a user."""
        return [self.generate_transaction(user_id) for _ in range(count)]

    def generate_test_data(self, output_file: str, user_ids: List[str], transactions_per_user: int = 10):
        """Generate test data and save to file."""
        all_transactions = []
        
        for user_id in user_ids:
            transactions = self.generate_transactions(user_id, transactions_per_user)
            all_transactions.extend(transactions)
        
        with open(output_file, "w") as f:
            json.dump(all_transactions, f, indent=2)
        
        return all_transactions

    def validate_transaction(self, transaction: Dict) -> bool:
        """Validate transaction data structure and requirements."""
        required_fields = [
            "id", "user_id", "type", "status", "amount",
            "currency", "payment_method", "created_at"
        ]
        
        # Check required fields
        for field in required_fields:
            if field not in transaction:
                return False
        
        # Validate transaction type
        if transaction["type"] not in self.transaction_types:
            return False
        
        # Validate status
        if transaction["status"] not in self.statuses:
            return False
        
        # Validate payment method
        if transaction["payment_method"] not in self.payment_methods:
            return False
        
        # Validate currency
        if transaction["currency"] not in self.currencies:
            return False
        
        # Validate amount
        if not isinstance(transaction["amount"], (int, float)):
            return False
        
        # Validate timestamps
        try:
            datetime.fromisoformat(transaction["created_at"])
            if transaction["updated_at"]:
                datetime.fromisoformat(transaction["updated_at"])
        except ValueError:
            return False
        
        return True

if __name__ == "__main__":
    # Example usage
    generator = TransactionGenerator()
    
    # Generate test user IDs
    user_ids = [str(faker.Faker().uuid4()) for _ in range(10)]
    
    # Generate test data
    transactions = generator.generate_test_data(
        "tests/fixtures/transactions.json",
        user_ids,
        transactions_per_user=10
    )
    
    # Validate generated data
    valid_transactions = [t for t in transactions if generator.validate_transaction(t)]
    print(f"Generated {len(transactions)} transactions, {len(valid_transactions)} valid") 