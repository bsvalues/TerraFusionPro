import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging
from typing import Dict, Any
import json
import shutil
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMInitializer:
    def __init__(self):
        self.models_dir = "models/llm"
        self.config_dir = "config/llm"
        self.models = {
            "gpt2": {
                "name": "gpt2",
                "size": "small",
                "type": "causal"
            },
            "bert": {
                "name": "bert-base-uncased",
                "size": "base",
                "type": "encoder"
            },
            "t5": {
                "name": "t5-small",
                "size": "small",
                "type": "seq2seq"
            }
        }

    def initialize(self):
        try:
            # Create directories
            self._create_directories()
            
            # Download and initialize models
            for model_id, model_info in self.models.items():
                self._initialize_model(model_id, model_info)
            
            # Create configuration files
            self._create_configs()
            
            logger.info("LLM initialization completed successfully")
            
        except Exception as e:
            logger.error(f"Error during LLM initialization: {str(e)}")
            raise

    def _create_directories(self):
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Create model-specific directories
        for model_id in self.models:
            os.makedirs(os.path.join(self.models_dir, model_id), exist_ok=True)

    def _initialize_model(self, model_id: str, model_info: Dict[str, Any]):
        logger.info(f"Initializing {model_id} model...")
        
        try:
            # Download model and tokenizer
            model = AutoModelForCausalLM.from_pretrained(model_info["name"])
            tokenizer = AutoTokenizer.from_pretrained(model_info["name"])
            
            # Save model and tokenizer
            model_path = os.path.join(self.models_dir, model_id)
            model.save_pretrained(model_path)
            tokenizer.save_pretrained(model_path)
            
            # Save model info
            info_path = os.path.join(model_path, "model_info.json")
            with open(info_path, "w") as f:
                json.dump(model_info, f, indent=2)
            
            logger.info(f"{model_id} model initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing {model_id} model: {str(e)}")
            raise

    def _create_configs(self):
        # Create main config
        main_config = {
            "models": self.models,
            "default_model": "gpt2",
            "max_length": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
            "batch_size": 4
        }
        
        config_path = os.path.join(self.config_dir, "config.json")
        with open(config_path, "w") as f:
            json.dump(main_config, f, indent=2)
        
        # Create model-specific configs
        for model_id, model_info in self.models.items():
            model_config = {
                "model_id": model_id,
                "model_info": model_info,
                "parameters": {
                    "max_length": 1024,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "batch_size": 4
                }
            }
            
            model_config_path = os.path.join(self.config_dir, f"{model_id}_config.json")
            with open(model_config_path, "w") as f:
                json.dump(model_config, f, indent=2)

    def cleanup(self):
        try:
            # Remove temporary files
            temp_dir = "temp"
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            
            logger.info("Cleanup completed successfully")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            raise

if __name__ == "__main__":
    initializer = LLMInitializer()
    initializer.initialize()
    initializer.cleanup() 