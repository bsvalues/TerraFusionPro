import os
import shutil
from pathlib import Path
import subprocess
import json

def get_unused_files():
    try:
        result = subprocess.run(['tsc', '--noEmit'], capture_output=True, text=True)
        unused_files = set()
        for line in result.stdout.split('\n'):
            if 'TS6133' in line or 'TS6134' in line:
                file_path = line.split('(')[0].strip()
                if file_path.endswith('.ts') or file_path.endswith('.tsx'):
                    unused_files.add(file_path)
        return unused_files
    except Exception as e:
        print(f"Error getting unused files: {e}")
        return set()

def create_archive_structure():
    archive_dir = Path('archive')
    if not archive_dir.exists():
        archive_dir.mkdir()
    
    for subdir in ['src', 'components', 'services', 'utils']:
        (archive_dir / subdir).mkdir(exist_ok=True)

def move_to_archive(file_path):
    try:
        src_path = Path(file_path)
        if not src_path.exists():
            return False
        
        archive_path = Path('archive') / src_path.relative_to(Path.cwd())
        archive_path.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.move(str(src_path), str(archive_path))
        print(f"Moved {file_path} to {archive_path}")
        return True
    except Exception as e:
        print(f"Error moving {file_path}: {e}")
        return False

def update_imports():
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = Path(root) / file
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    # Update imports to point to archive if needed
                    # This is a simple example - you might need more complex logic
                    updated_content = content.replace(
                        'from \'./',
                        'from \'../../archive/'
                    )
                    
                    with open(file_path, 'w') as f:
                        f.write(updated_content)
                except Exception as e:
                    print(f"Error updating imports in {file_path}: {e}")

def main():
    print("Starting code cleanup...")
    
    # Create archive structure
    create_archive_structure()
    
    # Get unused files
    unused_files = get_unused_files()
    print(f"Found {len(unused_files)} unused files")
    
    # Move files to archive
    moved_count = 0
    for file_path in unused_files:
        if move_to_archive(file_path):
            moved_count += 1
    
    print(f"Moved {moved_count} files to archive")
    
    # Update imports
    update_imports()
    print("Updated imports in remaining files")
    
    print("Cleanup complete!")

if __name__ == "__main__":
    main() 