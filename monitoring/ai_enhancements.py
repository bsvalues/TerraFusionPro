import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
import logging
from typing import Dict, List, Any
import json
from datetime import datetime

class AIEnhancements:
    def __init__(self):
        self.setup_logging()
        self.performance_model = self._create_performance_model()
        self.anomaly_detector = IsolationForest(contamination=0.1)
        self.pattern_recognizer = RandomForestRegressor(n_estimators=100)
        self.scaler = StandardScaler()
        self.historical_data = []
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('AIEnhancements')
        
    def _create_performance_model(self) -> keras.Model:
        model = keras.Sequential([
            keras.layers.Dense(64, activation='relu', input_shape=(10,)),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dropout(0.2),
            keras.layers.Dense(16, activation='relu'),
            keras.layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
        
    def process_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        try:
            features = self._extract_features(metrics)
            predictions = self._generate_predictions(features)
            anomalies = self._detect_anomalies(features)
            patterns = self._recognize_patterns(features)
            
            return {
                'predictions': predictions,
                'anomalies': anomalies,
                'patterns': patterns,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error processing metrics: {str(e)}")
            return {}
            
    def _extract_features(self, metrics: Dict[str, Any]) -> np.ndarray:
        feature_vector = np.array([
            metrics.get('system_load', 0),
            metrics.get('memory_usage', 0),
            metrics.get('cpu_usage', 0),
            metrics.get('disk_usage', 0),
            metrics.get('network_usage', 0),
            metrics.get('error_rate', 0),
            metrics.get('response_time', 0),
            metrics.get('throughput', 0),
            metrics.get('security_score', 0),
            metrics.get('reliability_score', 0)
        ]).reshape(1, -1)
        return self.scaler.fit_transform(feature_vector)
        
    def _generate_predictions(self, features: np.ndarray) -> Dict[str, float]:
        try:
            prediction = self.performance_model.predict(features)[0][0]
            return {
                'predicted_performance': float(prediction),
                'confidence': float(1.0 - abs(prediction - 0.5) * 2)
            }
        except Exception as e:
            self.logger.error(f"Error generating predictions: {str(e)}")
            return {'predicted_performance': 0.0, 'confidence': 0.0}
            
    def _detect_anomalies(self, features: np.ndarray) -> Dict[str, Any]:
        try:
            anomaly_score = self.anomaly_detector.fit_predict(features)
            return {
                'is_anomaly': bool(anomaly_score[0] == -1),
                'anomaly_score': float(self.anomaly_detector.score_samples(features)[0])
            }
        except Exception as e:
            self.logger.error(f"Error detecting anomalies: {str(e)}")
            return {'is_anomaly': False, 'anomaly_score': 0.0}
            
    def _recognize_patterns(self, features: np.ndarray) -> Dict[str, Any]:
        try:
            pattern = self.pattern_recognizer.predict(features)[0]
            return {
                'pattern_type': 'normal' if pattern > 0.5 else 'degraded',
                'pattern_confidence': float(abs(pattern - 0.5) * 2)
            }
        except Exception as e:
            self.logger.error(f"Error recognizing patterns: {str(e)}")
            return {'pattern_type': 'unknown', 'pattern_confidence': 0.0}
            
    def update_models(self, new_data: List[Dict[str, Any]]):
        try:
            self.historical_data.extend(new_data)
            if len(self.historical_data) > 1000:
                self.historical_data = self.historical_data[-1000:]
                
            features = np.array([self._extract_features(d) for d in self.historical_data])
            labels = np.array([d.get('performance_score', 0) for d in self.historical_data])
            
            self.performance_model.fit(features, labels, epochs=10, verbose=0)
            self.anomaly_detector.fit(features)
            self.pattern_recognizer.fit(features, labels)
            
            self.logger.info("Models updated successfully")
        except Exception as e:
            self.logger.error(f"Error updating models: {str(e)}")
            
    def get_insights(self) -> List[Dict[str, Any]]:
        try:
            insights = []
            if len(self.historical_data) > 0:
                latest_data = self.historical_data[-1]
                features = self._extract_features(latest_data)
                
                predictions = self._generate_predictions(features)
                anomalies = self._detect_anomalies(features)
                patterns = self._recognize_patterns(features)
                
                insights.append({
                    'type': 'performance',
                    'message': f"Predicted performance: {predictions['predicted_performance']:.2f}",
                    'confidence': predictions['confidence']
                })
                
                if anomalies['is_anomaly']:
                    insights.append({
                        'type': 'security',
                        'message': "Anomaly detected in system behavior",
                        'severity': 'high'
                    })
                    
                insights.append({
                    'type': 'pattern',
                    'message': f"System showing {patterns['pattern_type']} pattern",
                    'confidence': patterns['pattern_confidence']
                })
                
            return insights
        except Exception as e:
            self.logger.error(f"Error generating insights: {str(e)}")
            return [] 