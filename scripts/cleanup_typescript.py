import os
import subprocess
import json
from pathlib import Path

def run_tsc_check():
    try:
        result = subprocess.run(['tsc', '--noEmit'], capture_output=True, text=True)
        return result.stdout, result.stderr
    except Exception as e:
        return None, str(e)

def parse_tsc_output(output):
    errors = []
    for line in output.split('\n'):
        if 'error TS' in line:
            errors.append(line.strip())
    return errors

def categorize_errors(errors):
    categories = {
        'type_missing': [],
        'type_mismatch': [],
        'unused_code': [],
        'import_issues': [],
        'other': []
    }
    
    for error in errors:
        if 'TS2307' in error or 'TS2304' in error:
            categories['type_missing'].append(error)
        elif 'TS2322' in error or 'TS2345' in error:
            categories['type_mismatch'].append(error)
        elif 'TS6133' in error or 'TS6134' in error:
            categories['unused_code'].append(error)
        elif 'TS2306' in error or 'TS2305' in error:
            categories['import_issues'].append(error)
        else:
            categories['other'].append(error)
    
    return categories

def generate_report(categories):
    report = "# TypeScript Issues Report\n\n"
    
    for category, errors in categories.items():
        if errors:
            report += f"## {category.replace('_', ' ').title()}\n"
            report += f"Total issues: {len(errors)}\n\n"
            for error in errors:
                report += f"- {error}\n"
            report += "\n"
    
    return report

def main():
    stdout, stderr = run_tsc_check()
    if stderr:
        print("Error running TypeScript check:", stderr)
        return
    
    errors = parse_tsc_output(stdout)
    categories = categorize_errors(errors)
    
    report = generate_report(categories)
    
    with open('typescript_issues_report.md', 'w') as f:
        f.write(report)
    
    print(f"Generated report with {len(errors)} issues. See typescript_issues_report.md")

if __name__ == "__main__":
    main() 