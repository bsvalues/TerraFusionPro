import os
import json
import shutil
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

class FixtureManager:
    def __init__(self, base_path: str = "tests/fixtures"):
        self.base_path = Path(base_path)
        self.fixtures_path = self.base_path / "data"
        self.backup_path = self.base_path / "backups"
        self.temp_path = self.base_path / "temp"
        
        # Create necessary directories
        self._create_directories()
        
        # Track fixture usage
        self.usage_log = self._load_usage_log()

    def _create_directories(self):
        """Create necessary directories for fixtures."""
        for path in [self.fixtures_path, self.backup_path, self.temp_path]:
            path.mkdir(parents=True, exist_ok=True)

    def _load_usage_log(self) -> Dict:
        """Load fixture usage log."""
        log_file = self.base_path / "usage_log.json"
        if log_file.exists():
            with open(log_file, "r") as f:
                return json.load(f)
        return {}

    def _save_usage_log(self):
        """Save fixture usage log."""
        log_file = self.base_path / "usage_log.json"
        with open(log_file, "w") as f:
            json.dump(self.usage_log, f, indent=2)

    def create_fixture(self, name: str, data: Dict, category: str = "default"):
        """Create a new fixture."""
        fixture_path = self.fixtures_path / category / f"{name}.json"
        fixture_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add metadata
        fixture_data = {
            "data": data,
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "category": category,
                "name": name
            }
        }
        
        # Save fixture
        with open(fixture_path, "w") as f:
            json.dump(fixture_data, f, indent=2)
        
        # Update usage log
        self.usage_log[name] = {
            "created_at": datetime.now().isoformat(),
            "last_used": None,
            "use_count": 0,
            "category": category
        }
        self._save_usage_log()

    def load_fixture(self, name: str, category: str = "default") -> Dict:
        """Load a fixture by name."""
        fixture_path = self.fixtures_path / category / f"{name}.json"
        
        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture not found: {name} in category {category}")
        
        # Load fixture
        with open(fixture_path, "r") as f:
            fixture_data = json.load(f)
        
        # Update usage log
        if name in self.usage_log:
            self.usage_log[name]["last_used"] = datetime.now().isoformat()
            self.usage_log[name]["use_count"] += 1
            self._save_usage_log()
        
        return fixture_data["data"]

    def backup_fixture(self, name: str, category: str = "default"):
        """Create a backup of a fixture."""
        fixture_path = self.fixtures_path / category / f"{name}.json"
        backup_path = self.backup_path / category / f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture not found: {name} in category {category}")
        
        # Create backup
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(fixture_path, backup_path)

    def restore_fixture(self, name: str, backup_timestamp: str, category: str = "default"):
        """Restore a fixture from backup."""
        backup_path = self.backup_path / category / f"{name}_{backup_timestamp}.json"
        fixture_path = self.fixtures_path / category / f"{name}.json"
        
        if not backup_path.exists():
            raise FileNotFoundError(f"Backup not found: {name}_{backup_timestamp} in category {category}")
        
        # Restore fixture
        shutil.copy2(backup_path, fixture_path)

    def delete_fixture(self, name: str, category: str = "default"):
        """Delete a fixture."""
        fixture_path = self.fixtures_path / category / f"{name}.json"
        
        if not fixture_path.exists():
            raise FileNotFoundError(f"Fixture not found: {name} in category {category}")
        
        # Create backup before deletion
        self.backup_fixture(name, category)
        
        # Delete fixture
        fixture_path.unlink()
        
        # Update usage log
        if name in self.usage_log:
            del self.usage_log[name]
            self._save_usage_log()

    def list_fixtures(self, category: Optional[str] = None) -> List[Dict]:
        """List all fixtures or fixtures in a category."""
        fixtures = []
        
        if category:
            category_path = self.fixtures_path / category
            if not category_path.exists():
                return []
            
            for fixture_file in category_path.glob("*.json"):
                with open(fixture_file, "r") as f:
                    fixture_data = json.load(f)
                    fixtures.append({
                        "name": fixture_file.stem,
                        "category": category,
                        "created_at": fixture_data["metadata"]["created_at"],
                        "usage": self.usage_log.get(fixture_file.stem, {})
                    })
        else:
            for category_path in self.fixtures_path.glob("*"):
                if category_path.is_dir():
                    for fixture_file in category_path.glob("*.json"):
                        with open(fixture_file, "r") as f:
                            fixture_data = json.load(f)
                            fixtures.append({
                                "name": fixture_file.stem,
                                "category": category_path.name,
                                "created_at": fixture_data["metadata"]["created_at"],
                                "usage": self.usage_log.get(fixture_file.stem, {})
                            })
        
        return fixtures

    def cleanup_old_fixtures(self, days: int = 30):
        """Clean up fixtures that haven't been used in specified days."""
        current_time = datetime.now()
        
        for fixture_info in self.list_fixtures():
            if fixture_info["usage"].get("last_used"):
                last_used = datetime.fromisoformat(fixture_info["usage"]["last_used"])
                if (current_time - last_used).days > days:
                    self.delete_fixture(fixture_info["name"], fixture_info["category"])

    def get_fixture_stats(self) -> Dict:
        """Get statistics about fixtures."""
        stats = {
            "total_fixtures": 0,
            "categories": {},
            "most_used": [],
            "recently_used": [],
            "unused_fixtures": []
        }
        
        for fixture_info in self.list_fixtures():
            stats["total_fixtures"] += 1
            
            # Category stats
            category = fixture_info["category"]
            if category not in stats["categories"]:
                stats["categories"][category] = 0
            stats["categories"][category] += 1
            
            # Usage stats
            usage = fixture_info["usage"]
            if usage.get("use_count", 0) > 0:
                stats["most_used"].append({
                    "name": fixture_info["name"],
                    "category": category,
                    "use_count": usage["use_count"]
                })
            if usage.get("last_used"):
                stats["recently_used"].append({
                    "name": fixture_info["name"],
                    "category": category,
                    "last_used": usage["last_used"]
                })
            else:
                stats["unused_fixtures"].append({
                    "name": fixture_info["name"],
                    "category": category
                })
        
        # Sort lists
        stats["most_used"].sort(key=lambda x: x["use_count"], reverse=True)
        stats["recently_used"].sort(key=lambda x: x["last_used"], reverse=True)
        
        return stats

if __name__ == "__main__":
    # Example usage
    manager = FixtureManager()
    
    # Create a test fixture
    test_data = {
        "user": {
            "id": "123",
            "name": "Test User"
        }
    }
    manager.create_fixture("test_user", test_data, "users")
    
    # Load the fixture
    loaded_data = manager.load_fixture("test_user", "users")
    print(f"Loaded fixture: {loaded_data}")
    
    # Get fixture stats
    stats = manager.get_fixture_stats()
    print(f"Fixture stats: {stats}") 