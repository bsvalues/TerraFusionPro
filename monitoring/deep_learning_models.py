import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import logging
from typing import Dict, List, Any
import json
from datetime import datetime
from sklearn.preprocessing import StandardScaler
import pandas as pd

class DeepLearningModels:
    def __init__(self):
        self.setup_logging()
        self.setup_models()
        self.scaler = StandardScaler()
        self.historical_data = []
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('DeepLearningModels')
        
    def setup_models(self):
        self.performance_predictor = self._create_performance_predictor()
        self.anomaly_detector = self._create_anomaly_detector()
        self.pattern_recognizer = self._create_pattern_recognizer()
        self.resource_optimizer = self._create_resource_optimizer()
        
    def _create_performance_predictor(self) -> keras.Model:
        model = keras.Sequential([
            layers.LSTM(64, input_shape=(10, 10), return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
        
    def _create_anomaly_detector(self) -> keras.Model:
        model = keras.Sequential([
            layers.Dense(128, activation='relu', input_shape=(10,)),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.Dense(10, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='binary_crossentropy')
        return model
        
    def _create_pattern_recognizer(self) -> keras.Model:
        model = keras.Sequential([
            layers.Conv1D(64, 3, activation='relu', input_shape=(10, 1)),
            layers.MaxPooling1D(2),
            layers.Conv1D(32, 3, activation='relu'),
            layers.MaxPooling1D(2),
            layers.Flatten(),
            layers.Dense(16, activation='relu'),
            layers.Dense(5, activation='softmax')
        ])
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        return model
        
    def _create_resource_optimizer(self) -> keras.Model:
        model = keras.Sequential([
            layers.Dense(64, activation='relu', input_shape=(10,)),
            layers.Dropout(0.2),
            layers.Dense(32, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(16, activation='relu'),
            layers.Dense(10, activation='sigmoid')
        ])
        model.compile(optimizer='adam', loss='mse')
        return model
        
    def process_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        try:
            features = self._extract_features(metrics)
            predictions = self._generate_predictions(features)
            anomalies = self._detect_anomalies(features)
            patterns = self._recognize_patterns(features)
            optimizations = self._optimize_resources(features)
            
            return {
                'predictions': predictions,
                'anomalies': anomalies,
                'patterns': patterns,
                'optimizations': optimizations,
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
            # Reshape for LSTM
            lstm_features = features.reshape(1, 1, 10)
            prediction = self.performance_predictor.predict(lstm_features)[0][0]
            
            return {
                'predicted_performance': float(prediction),
                'confidence': float(1.0 - abs(prediction - 0.5) * 2)
            }
        except Exception as e:
            self.logger.error(f"Error generating predictions: {str(e)}")
            return {'predicted_performance': 0.0, 'confidence': 0.0}
            
    def _detect_anomalies(self, features: np.ndarray) -> Dict[str, Any]:
        try:
            anomaly_scores = self.anomaly_detector.predict(features)[0]
            max_score = np.max(anomaly_scores)
            
            return {
                'is_anomaly': bool(max_score > 0.8),
                'anomaly_score': float(max_score),
                'anomaly_type': self._classify_anomaly_type(anomaly_scores)
            }
        except Exception as e:
            self.logger.error(f"Error detecting anomalies: {str(e)}")
            return {'is_anomaly': False, 'anomaly_score': 0.0}
            
    def _classify_anomaly_type(self, anomaly_scores: np.ndarray) -> str:
        try:
            anomaly_types = ['performance', 'security', 'reliability', 'resource', 'network']
            max_index = np.argmax(anomaly_scores)
            return anomaly_types[max_index]
        except Exception as e:
            self.logger.error(f"Error classifying anomaly: {str(e)}")
            return 'unknown'
            
    def _recognize_patterns(self, features: np.ndarray) -> Dict[str, Any]:
        try:
            # Reshape for CNN
            cnn_features = features.reshape(1, 10, 1)
            pattern = self.pattern_recognizer.predict(cnn_features)[0]
            pattern_type = np.argmax(pattern)
            
            return {
                'pattern_type': self._get_pattern_type(pattern_type),
                'pattern_confidence': float(pattern[pattern_type]),
                'pattern_details': self._analyze_pattern_details(features, pattern)
            }
        except Exception as e:
            self.logger.error(f"Error recognizing patterns: {str(e)}")
            return {'pattern_type': 'unknown', 'pattern_confidence': 0.0}
            
    def _get_pattern_type(self, pattern_index: int) -> str:
        pattern_types = ['normal', 'degraded', 'improving', 'fluctuating', 'critical']
        return pattern_types[pattern_index]
        
    def _analyze_pattern_details(self, features: np.ndarray, pattern: np.ndarray) -> Dict[str, Any]:
        try:
            return {
                'resource_utilization': float(features[0][0]),
                'security_status': float(features[0][8]),
                'reliability_level': float(features[0][9]),
                'pattern_distribution': pattern.tolist()
            }
        except Exception as e:
            self.logger.error(f"Error analyzing pattern details: {str(e)}")
            return {}
            
    def _optimize_resources(self, features: np.ndarray) -> Dict[str, Any]:
        try:
            optimization_scores = self.resource_optimizer.predict(features)[0]
            
            return {
                'cpu_optimization': float(optimization_scores[0]),
                'memory_optimization': float(optimization_scores[1]),
                'disk_optimization': float(optimization_scores[2]),
                'network_optimization': float(optimization_scores[3]),
                'recommendations': self._generate_optimization_recommendations(optimization_scores)
            }
        except Exception as e:
            self.logger.error(f"Error optimizing resources: {str(e)}")
            return {}
            
    def _generate_optimization_recommendations(self, optimization_scores: np.ndarray) -> List[str]:
        recommendations = []
        
        if optimization_scores[0] > 0.7:
            recommendations.append("Consider scaling CPU resources")
        if optimization_scores[1] > 0.7:
            recommendations.append("Optimize memory allocation")
        if optimization_scores[2] > 0.7:
            recommendations.append("Implement disk cleanup")
        if optimization_scores[3] > 0.7:
            recommendations.append("Optimize network bandwidth")
            
        return recommendations
        
    def update_models(self, new_data: List[Dict[str, Any]]):
        try:
            self.historical_data.extend(new_data)
            if len(self.historical_data) > 1000:
                self.historical_data = self.historical_data[-1000:]
                
            features = np.array([self._extract_features(d) for d in self.historical_data])
            labels = np.array([d.get('performance_score', 0) for d in self.historical_data])
            
            # Reshape for LSTM
            lstm_features = features.reshape(-1, 1, 10)
            self.performance_predictor.fit(lstm_features, labels, epochs=10, verbose=0)
            
            # Update anomaly detector
            anomaly_labels = np.zeros((len(features), 10))
            for i, data in enumerate(self.historical_data):
                if data.get('is_anomaly', False):
                    anomaly_labels[i] = 1
            self.anomaly_detector.fit(features, anomaly_labels, epochs=10, verbose=0)
            
            # Update pattern recognizer
            pattern_labels = np.zeros((len(features), 5))
            for i, data in enumerate(self.historical_data):
                pattern_type = data.get('pattern_type', 'normal')
                pattern_index = ['normal', 'degraded', 'improving', 'fluctuating', 'critical'].index(pattern_type)
                pattern_labels[i][pattern_index] = 1
            cnn_features = features.reshape(-1, 10, 1)
            self.pattern_recognizer.fit(cnn_features, pattern_labels, epochs=10, verbose=0)
            
            # Update resource optimizer
            optimization_labels = np.zeros((len(features), 10))
            for i, data in enumerate(self.historical_data):
                optimization_labels[i] = [
                    data.get('cpu_optimization', 0),
                    data.get('memory_optimization', 0),
                    data.get('disk_optimization', 0),
                    data.get('network_optimization', 0),
                    data.get('security_optimization', 0),
                    data.get('reliability_optimization', 0),
                    data.get('performance_optimization', 0),
                    data.get('scalability_optimization', 0),
                    data.get('efficiency_optimization', 0),
                    data.get('stability_optimization', 0)
                ]
            self.resource_optimizer.fit(features, optimization_labels, epochs=10, verbose=0)
            
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
                optimizations = self._optimize_resources(features)
                
                insights.append({
                    'type': 'performance',
                    'message': f"Predicted performance: {predictions['predicted_performance']:.2f}",
                    'confidence': predictions['confidence']
                })
                
                if anomalies['is_anomaly']:
                    insights.append({
                        'type': 'security',
                        'message': f"Anomaly detected: {anomalies['anomaly_type']}",
                        'severity': 'high'
                    })
                    
                insights.append({
                    'type': 'pattern',
                    'message': f"System showing {patterns['pattern_type']} pattern",
                    'confidence': patterns['pattern_confidence']
                })
                
                if optimizations.get('recommendations'):
                    insights.append({
                        'type': 'optimization',
                        'message': "Resource optimization recommendations available",
                        'recommendations': optimizations['recommendations']
                    })
                
            return insights
        except Exception as e:
            self.logger.error(f"Error generating insights: {str(e)}")
            return [] 