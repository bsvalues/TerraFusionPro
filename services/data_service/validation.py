from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import logging
from pydantic import BaseModel, Field, validator
import json
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataValidationRule(BaseModel):
    field: str
    rule_type: str
    parameters: Dict[str, Any]
    error_message: str

class DataQualityMetric(BaseModel):
    metric_name: str
    value: float
    threshold: float
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DataValidator:
    def __init__(self):
        self.rules: List[DataValidationRule] = []
        self.quality_metrics: List[DataQualityMetric] = []
        self.initialize_rules()

    def initialize_rules(self):
        # Define validation rules
        self.rules = [
            DataValidationRule(
                field="timestamp",
                rule_type="not_null",
                parameters={},
                error_message="Timestamp cannot be null"
            ),
            DataValidationRule(
                field="metrics",
                rule_type="not_empty",
                parameters={},
                error_message="Metrics cannot be empty"
            ),
            DataValidationRule(
                field="source",
                rule_type="in_list",
                parameters={"allowed_values": ["sensor", "manual", "api"]},
                error_message="Invalid source type"
            ),
            DataValidationRule(
                field="metrics.cpu_usage",
                rule_type="range",
                parameters={"min": 0, "max": 100},
                error_message="CPU usage must be between 0 and 100"
            ),
            DataValidationRule(
                field="metrics.memory_usage",
                rule_type="range",
                parameters={"min": 0, "max": 100},
                error_message="Memory usage must be between 0 and 100"
            )
        ]

    def validate_data_point(self, data_point: Dict[str, Any]) -> List[str]:
        errors = []
        
        for rule in self.rules:
            try:
                if rule.rule_type == "not_null":
                    if not self._get_nested_value(data_point, rule.field):
                        errors.append(rule.error_message)
                
                elif rule.rule_type == "not_empty":
                    value = self._get_nested_value(data_point, rule.field)
                    if not value or (isinstance(value, (list, dict)) and len(value) == 0):
                        errors.append(rule.error_message)
                
                elif rule.rule_type == "in_list":
                    value = self._get_nested_value(data_point, rule.field)
                    if value not in rule.parameters["allowed_values"]:
                        errors.append(rule.error_message)
                
                elif rule.rule_type == "range":
                    value = self._get_nested_value(data_point, rule.field)
                    if not (rule.parameters["min"] <= value <= rule.parameters["max"]):
                        errors.append(rule.error_message)
            
            except Exception as e:
                errors.append(f"Validation error for {rule.field}: {str(e)}")
        
        return errors

    def _get_nested_value(self, data: Dict[str, Any], field_path: str) -> Any:
        parts = field_path.split('.')
        value = data
        for part in parts:
            value = value[part]
        return value

    def calculate_quality_metrics(self, data: List[Dict[str, Any]]) -> List[DataQualityMetric]:
        df = pd.DataFrame(data)
        metrics = []
        
        # Completeness
        completeness = 1 - df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
        metrics.append(DataQualityMetric(
            metric_name="completeness",
            value=completeness,
            threshold=0.95,
            status="good" if completeness >= 0.95 else "warning"
        ))
        
        # Consistency
        if "metrics" in df.columns:
            consistency = 1 - df["metrics"].apply(lambda x: len(self.validate_data_point({"metrics": x})) > 0).mean()
            metrics.append(DataQualityMetric(
                metric_name="consistency",
                value=consistency,
                threshold=0.90,
                status="good" if consistency >= 0.90 else "warning"
            ))
        
        # Timeliness
        if "timestamp" in df.columns:
            max_delay = (datetime.utcnow() - pd.to_datetime(df["timestamp"]).max()).total_seconds()
            timeliness = 1 - (max_delay / 3600)  # Normalize to hours
            metrics.append(DataQualityMetric(
                metric_name="timeliness",
                value=timeliness,
                threshold=0.80,
                status="good" if timeliness >= 0.80 else "warning"
            ))
        
        self.quality_metrics = metrics
        return metrics

    def get_quality_report(self) -> Dict[str, Any]:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": [metric.dict() for metric in self.quality_metrics],
            "overall_status": "good" if all(m.status == "good" for m in self.quality_metrics) else "warning"
        }

    def save_quality_report(self, path: str):
        report = self.get_quality_report()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(report, f, indent=2) 