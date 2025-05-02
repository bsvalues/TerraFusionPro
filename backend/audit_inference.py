"""
TerraFusion Model Inference Audit Trail
Logs every model inference with detailed information for tracking and analysis
"""

import os
import csv
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
AUDIT_DIR = os.path.join(os.getcwd(), "models", "audit_logs")
AUDIT_PATH = os.path.join(AUDIT_DIR, "inference_audit_log.csv")

# Ensure directory exists
if not os.path.exists(AUDIT_DIR):
    os.makedirs(AUDIT_DIR)

# Initialize log file with headers if it doesn't exist
if not os.path.exists(AUDIT_PATH):
    with open(AUDIT_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", 
            "filename", 
            "model_name", 
            "model_version", 
            "score", 
            "confidence", 
            "execution_time_ms",
            "fallback_used",
            "user_id",
            "metadata"
        ])
    print(f"Created inference audit log: {AUDIT_PATH}")

def log_inference(
    filename: str, 
    model_name: str, 
    model_version: str, 
    score: float, 
    confidence: Optional[float] = None, 
    execution_time_ms: Optional[float] = None,
    fallback_used: bool = False,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log a model inference to the audit trail
    
    Args:
        filename: The filename of the uploaded image
        model_name: Name of the model used (e.g., "condition_model")
        model_version: Version of the model used (e.g., "1.0.0", "2.0.0")
        score: The predicted score
        confidence: Confidence level of the prediction (optional)
        execution_time_ms: Time taken for inference in milliseconds (optional)
        fallback_used: Whether a fallback model was used (optional)
        user_id: Identifier for the user who uploaded the image (optional)
        metadata: Additional information about the inference (optional)
    """
    timestamp = datetime.now().isoformat()
    
    with open(AUDIT_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            timestamp, 
            filename, 
            model_name, 
            model_version, 
            score, 
            confidence or "", 
            execution_time_ms or "",
            fallback_used,
            user_id or "",
            str(metadata or {})
        ])

def get_inference_stats(limit: int = 100) -> Dict[str, Any]:
    """
    Get statistics about recent model inferences
    
    Args:
        limit: Maximum number of records to analyze (default: 100)
        
    Returns:
        Dict: Statistics about model inferences
    """
    if not os.path.exists(AUDIT_PATH):
        return {"error": "No audit logs found"}
        
    stats = {
        "total_inferences": 0,
        "version_usage": {},
        "fallback_rate": 0.0,
        "average_score": 0.0,
        "average_execution_time_ms": 0.0,
        "score_distribution": {
            "1.0-1.9": 0,
            "2.0-2.9": 0,
            "3.0-3.9": 0,
            "4.0-5.0": 0
        }
    }
    
    total_score = 0.0
    total_execution_time = 0.0
    execution_time_count = 0
    fallback_count = 0
    
    with open(AUDIT_PATH, "r", newline="") as f:
        reader = csv.reader(f)
        # Skip header
        next(reader, None)
        
        rows = []
        for row in reader:
            rows.append(row)
        
        # Get the most recent 'limit' rows
        recent_rows = rows[-limit:] if len(rows) > limit else rows
        stats["total_inferences"] = len(recent_rows)
        
        if not recent_rows:
            return stats
            
        for row in recent_rows:
            try:
                # Parse the row
                model_name = row[2]
                model_version = row[3]
                score = float(row[4]) if row[4] else 0.0
                execution_time = float(row[6]) if row[6] else None
                fallback = row[7].lower() == "true"
                
                # Update version usage
                version_key = f"{model_name} v{model_version}"
                stats["version_usage"][version_key] = stats["version_usage"].get(version_key, 0) + 1
                
                # Update score statistics
                total_score += score
                
                # Update score distribution
                if 1.0 <= score < 2.0:
                    stats["score_distribution"]["1.0-1.9"] += 1
                elif 2.0 <= score < 3.0:
                    stats["score_distribution"]["2.0-2.9"] += 1
                elif 3.0 <= score < 4.0:
                    stats["score_distribution"]["3.0-3.9"] += 1
                elif 4.0 <= score <= 5.0:
                    stats["score_distribution"]["4.0-5.0"] += 1
                
                # Update execution time statistics
                if execution_time is not None:
                    total_execution_time += execution_time
                    execution_time_count += 1
                
                # Update fallback statistics
                if fallback:
                    fallback_count += 1
                    
            except (ValueError, IndexError) as e:
                print(f"Error parsing row: {e}")
                continue
        
        # Calculate average score
        stats["average_score"] = round(total_score / stats["total_inferences"], 2) if stats["total_inferences"] > 0 else 0.0
        
        # Calculate average execution time
        stats["average_execution_time_ms"] = round(total_execution_time / execution_time_count, 2) if execution_time_count > 0 else 0.0
        
        # Calculate fallback rate
        stats["fallback_rate"] = round(fallback_count / stats["total_inferences"] * 100, 2) if stats["total_inferences"] > 0 else 0.0
        
    return stats