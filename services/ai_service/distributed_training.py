import tensorflow as tf
import numpy as np
from typing import List, Dict, Any
import logging
import json
from datetime import datetime
import os
import ray
from ray import train
from ray.train.tensorflow import TensorflowTrainer
from ray.train import ScalingConfig
from ray.train import Checkpoint
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DistributedTrainer:
    def __init__(self, num_workers: int = 4):
        self.num_workers = num_workers
        ray.init(ignore_reinit_error=True)
        self.model_configs = {
            "performance": {
                "layers": [
                    tf.keras.layers.Dense(64, activation='relu'),
                    tf.keras.layers.Dense(32, activation='relu'),
                    tf.keras.layers.Dense(16, activation='relu'),
                    tf.keras.layers.Dense(1)
                ],
                "optimizer": tf.keras.optimizers.Adam(learning_rate=0.001),
                "loss": 'mse'
            },
            "anomaly": {
                "layers": [
                    tf.keras.layers.Dense(32, activation='relu'),
                    tf.keras.layers.Dense(16, activation='relu'),
                    tf.keras.layers.Dense(8, activation='relu'),
                    tf.keras.layers.Dense(1, activation='sigmoid')
                ],
                "optimizer": tf.keras.optimizers.Adam(learning_rate=0.001),
                "loss": 'binary_crossentropy'
            },
            "pattern": {
                "layers": [
                    tf.keras.layers.Dense(128, activation='relu'),
                    tf.keras.layers.Dense(64, activation='relu'),
                    tf.keras.layers.Dense(32, activation='relu'),
                    tf.keras.layers.Dense(16, activation='relu'),
                    tf.keras.layers.Dense(8, activation='softmax')
                ],
                "optimizer": tf.keras.optimizers.Adam(learning_rate=0.001),
                "loss": 'categorical_crossentropy'
            }
        }

    def create_model(self, model_type: str) -> tf.keras.Model:
        config = self.model_configs[model_type]
        model = tf.keras.Sequential(config["layers"])
        model.compile(
            optimizer=config["optimizer"],
            loss=config["loss"],
            metrics=['accuracy']
        )
        return model

    def prepare_data(self, data: List[Dict[str, Any]], model_type: str) -> tuple:
        df = pd.DataFrame(data)
        features = df.drop(['timestamp', 'source', 'metadata'], axis=1, errors='ignore')
        
        if model_type == "performance":
            targets = features.pop('actual_performance')
            return features.values, targets.values
        elif model_type == "anomaly":
            targets = (features.pop('is_anomaly') > 0.5).astype(int)
            return features.values, targets.values
        elif model_type == "pattern":
            targets = pd.get_dummies(features.pop('pattern_type'))
            return features.values, targets.values

    def train_func(self, config: Dict[str, Any]):
        model_type = config["model_type"]
        data = config["data"]
        
        # Create and compile model
        model = self.create_model(model_type)
        
        # Prepare data
        X, y = self.prepare_data(data, model_type)
        
        # Train model
        history = model.fit(
            X, y,
            epochs=config["epochs"],
            batch_size=config["batch_size"],
            validation_split=0.2,
            callbacks=[
                tf.keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=5,
                    restore_best_weights=True
                )
            ]
        )
        
        # Save checkpoint
        checkpoint = Checkpoint.from_dict({
            "model_weights": model.get_weights(),
            "model_config": model.get_config(),
            "optimizer_config": model.optimizer.get_config()
        })
        train.report({"loss": history.history["loss"][-1]}, checkpoint=checkpoint)

    def train_distributed(self, model_type: str, data: List[Dict[str, Any]], epochs: int = 10, batch_size: int = 32):
        try:
            trainer = TensorflowTrainer(
                train_loop_per_worker=self.train_func,
                train_loop_config={
                    "model_type": model_type,
                    "data": data,
                    "epochs": epochs,
                    "batch_size": batch_size
                },
                scaling_config=ScalingConfig(
                    num_workers=self.num_workers,
                    use_gpu=False
                )
            )
            
            result = trainer.fit()
            best_checkpoint = result.checkpoint
            
            # Load best model
            model = self.create_model(model_type)
            model.set_weights(best_checkpoint["model_weights"])
            
            # Save model
            model_path = f"models/{model_type}_model"
            model.save(model_path)
            
            logger.info(f"Distributed training completed for {model_type} model")
            return model
            
        except Exception as e:
            logger.error(f"Error in distributed training: {str(e)}")
            raise

    def evaluate_model(self, model: tf.keras.Model, test_data: List[Dict[str, Any]], model_type: str):
        try:
            X_test, y_test = self.prepare_data(test_data, model_type)
            results = model.evaluate(X_test, y_test)
            
            metrics = {
                "loss": float(results[0]),
                "accuracy": float(results[1])
            }
            
            logger.info(f"Model evaluation metrics: {metrics}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error in model evaluation: {str(e)}")
            raise

    def cleanup(self):
        ray.shutdown() 