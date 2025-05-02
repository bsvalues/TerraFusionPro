#!/usr/bin/env python3
"""
TerraFusion Model Inference Audit Log Exporter
Script to export and analyze model inference audit logs

Usage:
  python export_audit_log.py --format csv --output audit_export.csv
  python export_audit_log.py --format json --output audit_export.json
  python export_audit_log.py --stats --days 7 --output stats_report.json
"""

import os
import sys
import csv
import json
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import audit inference module
from backend.audit_inference import AUDIT_PATH, get_inference_stats

def export_csv(output_path: str, days: Optional[int] = None) -> None:
    """Export audit log to CSV format"""
    if not os.path.exists(AUDIT_PATH):
        print(f"Error: Audit log file not found at {AUDIT_PATH}")
        sys.exit(1)
        
    # Read the original audit log
    with open(AUDIT_PATH, "r", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    
    # Filter by date if specified
    if days is not None:
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_rows = []
        
        for row in rows:
            try:
                timestamp = datetime.fromisoformat(row[0])
                if timestamp >= cutoff_date:
                    filtered_rows.append(row)
            except (ValueError, IndexError):
                continue
                
        rows = filtered_rows
    
    # Write to the output file
    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    
    print(f"Exported {len(rows)} records to {output_path}")

def export_json(output_path: str, days: Optional[int] = None) -> None:
    """Export audit log to JSON format"""
    if not os.path.exists(AUDIT_PATH):
        print(f"Error: Audit log file not found at {AUDIT_PATH}")
        sys.exit(1)
        
    # Read the original audit log
    with open(AUDIT_PATH, "r", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    
    # Filter by date if specified
    if days is not None:
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_rows = []
        
        for row in rows:
            try:
                timestamp = datetime.fromisoformat(row[0])
                if timestamp >= cutoff_date:
                    filtered_rows.append(row)
            except (ValueError, IndexError):
                continue
                
        rows = filtered_rows
    
    # Convert to JSON format
    json_data = []
    for row in rows:
        try:
            record = {
                header[i]: row[i] for i in range(len(header))
            }
            
            # Convert some fields to appropriate types
            if record.get("score"):
                record["score"] = float(record["score"])
                
            if record.get("confidence") and record["confidence"]:
                record["confidence"] = float(record["confidence"])
                
            if record.get("execution_time_ms") and record["execution_time_ms"]:
                record["execution_time_ms"] = float(record["execution_time_ms"])
                
            if record.get("fallback_used"):
                record["fallback_used"] = record["fallback_used"].lower() == "true"
                
            if record.get("metadata") and record["metadata"] != "{}":
                try:
                    record["metadata"] = json.loads(record["metadata"])
                except json.JSONDecodeError:
                    pass
                    
            json_data.append(record)
        except Exception as e:
            print(f"Error converting row to JSON: {str(e)}")
            continue
    
    # Write to the output file
    with open(output_path, "w") as f:
        json.dump(json_data, f, indent=2)
    
    print(f"Exported {len(json_data)} records to {output_path}")

def export_stats(output_path: str, days: Optional[int] = None) -> None:
    """Export statistics about the audit log"""
    # Get inference statistics
    stats = get_inference_stats(limit=10000)  # Use a large limit to get comprehensive stats
    
    # Add export timestamp
    stats["export_timestamp"] = datetime.now().isoformat()
    stats["export_period_days"] = days or "all"
    
    # Optionally filter by date
    # Note: The get_inference_stats function doesn't support date filtering directly,
    # so for a production system, you'd want to enhance that function to support it.
    
    # Write to the output file
    with open(output_path, "w") as f:
        json.dump(stats, f, indent=2)
    
    print(f"Exported statistics to {output_path}")
    
    # Print a summary to the console
    print("\nSummary Statistics:")
    print(f"Total inferences: {stats['total_inferences']}")
    print(f"Average score: {stats['average_score']}")
    print(f"Fallback rate: {stats['fallback_rate']}%")
    print("\nVersion usage:")
    for version, count in stats["version_usage"].items():
        print(f"  {version}: {count} inferences")
    print("\nScore distribution:")
    for range_name, count in stats["score_distribution"].items():
        print(f"  {range_name}: {count} inferences")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Export and analyze model inference audit logs")
    
    parser.add_argument("--format", choices=["csv", "json"], help="Output format for the export")
    parser.add_argument("--stats", action="store_true", help="Generate statistics instead of raw export")
    parser.add_argument("--days", type=int, help="Limit export to the last N days")
    parser.add_argument("--output", required=True, help="Output file path")
    
    args = parser.parse_args()
    
    if args.stats:
        export_stats(args.output, args.days)
    elif args.format == "csv":
        export_csv(args.output, args.days)
    elif args.format == "json":
        export_json(args.output, args.days)
    else:
        print("Error: You must specify either --stats or --format")
        sys.exit(1)

if __name__ == "__main__":
    main()