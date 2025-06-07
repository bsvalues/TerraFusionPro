import os
import json
from typing import Dict, List, Optional, Any
from pathlib import Path
from .fixture_manager import FixtureManager

class FixtureLoader:
    def __init__(self, base_path: str = "tests/fixtures"):
        self.manager = FixtureManager(base_path)
        self.loaded_fixtures: Dict[str, Any] = {}

    def load_fixtures(self, fixture_names: List[str], category: str = "default") -> Dict[str, Any]:
        """Load multiple fixtures by name."""
        fixtures = {}
        for name in fixture_names:
            fixtures[name] = self.load_fixture(name, category)
        return fixtures

    def load_fixture(self, name: str, category: str = "default") -> Any:
        """Load a single fixture by name."""
        if name in self.loaded_fixtures:
            return self.loaded_fixtures[name]
        
        fixture_data = self.manager.load_fixture(name, category)
        self.loaded_fixtures[name] = fixture_data
        return fixture_data

    def clear_loaded_fixtures(self):
        """Clear the loaded fixtures cache."""
        self.loaded_fixtures.clear()

    def get_fixture_path(self, name: str, category: str = "default") -> Path:
        """Get the path to a fixture file."""
        return self.manager.fixtures_path / category / f"{name}.json"

    def fixture_exists(self, name: str, category: str = "default") -> bool:
        """Check if a fixture exists."""
        return self.get_fixture_path(name, category).exists()

    def create_test_fixtures(self, fixtures: Dict[str, Dict], category: str = "default"):
        """Create multiple test fixtures."""
        for name, data in fixtures.items():
            self.manager.create_fixture(name, data, category)

    def delete_test_fixtures(self, fixture_names: List[str], category: str = "default"):
        """Delete multiple test fixtures."""
        for name in fixture_names:
            if self.fixture_exists(name, category):
                self.manager.delete_fixture(name, category)

    def backup_test_fixtures(self, fixture_names: List[str], category: str = "default"):
        """Backup multiple test fixtures."""
        for name in fixture_names:
            if self.fixture_exists(name, category):
                self.manager.backup_fixture(name, category)

    def restore_test_fixtures(self, fixture_names: List[str], backup_timestamp: str, category: str = "default"):
        """Restore multiple test fixtures from backup."""
        for name in fixture_names:
            if self.fixture_exists(name, category):
                self.manager.restore_fixture(name, backup_timestamp, category)

    def get_fixture_categories(self) -> List[str]:
        """Get all fixture categories."""
        categories = []
        for category_path in self.manager.fixtures_path.glob("*"):
            if category_path.is_dir():
                categories.append(category_path.name)
        return categories

    def get_category_fixtures(self, category: str) -> List[str]:
        """Get all fixture names in a category."""
        fixtures = []
        category_path = self.manager.fixtures_path / category
        if category_path.exists():
            for fixture_file in category_path.glob("*.json"):
                fixtures.append(fixture_file.stem)
        return fixtures

    def validate_fixtures(self, fixture_names: List[str], category: str = "default") -> Dict[str, bool]:
        """Validate multiple fixtures."""
        validation_results = {}
        for name in fixture_names:
            try:
                self.manager.load_fixture(name, category)
                validation_results[name] = True
            except Exception:
                validation_results[name] = False
        return validation_results

    def get_fixture_metadata(self, name: str, category: str = "default") -> Optional[Dict]:
        """Get metadata for a fixture."""
        fixture_path = self.get_fixture_path(name, category)
        if fixture_path.exists():
            with open(fixture_path, "r") as f:
                fixture_data = json.load(f)
                return fixture_data.get("metadata")
        return None

    def update_fixture_metadata(self, name: str, metadata: Dict, category: str = "default"):
        """Update metadata for a fixture."""
        fixture_path = self.get_fixture_path(name, category)
        if fixture_path.exists():
            with open(fixture_path, "r") as f:
                fixture_data = json.load(f)
            
            fixture_data["metadata"].update(metadata)
            
            with open(fixture_path, "w") as f:
                json.dump(fixture_data, f, indent=2)

    def get_fixture_usage_stats(self) -> Dict:
        """Get usage statistics for all fixtures."""
        return self.manager.get_fixture_stats()

    def cleanup_unused_fixtures(self, days: int = 30):
        """Clean up fixtures that haven't been used in specified days."""
        self.manager.cleanup_old_fixtures(days)

if __name__ == "__main__":
    # Example usage
    loader = FixtureLoader()
    
    # Create test fixtures
    test_fixtures = {
        "user1": {
            "id": "1",
            "name": "Test User 1"
        },
        "user2": {
            "id": "2",
            "name": "Test User 2"
        }
    }
    loader.create_test_fixtures(test_fixtures, "users")
    
    # Load fixtures
    loaded_fixtures = loader.load_fixtures(["user1", "user2"], "users")
    print(f"Loaded fixtures: {loaded_fixtures}")
    
    # Get fixture stats
    stats = loader.get_fixture_usage_stats()
    print(f"Fixture stats: {stats}") 