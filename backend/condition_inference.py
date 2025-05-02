"""
TerraFusion Property Condition Inference
More efficient implementation of property condition scoring with model versioning
"""

import os
import torch
import torchvision.transforms as transforms
from torchvision.models import mobilenet_v2
from PIL import Image
import numpy as np
from datetime import datetime

# Import model versioning system
try:
    from backend.model_versioning import (
        get_model_path, 
        get_current_version,
        register_model_version,
        initialize_model_registry
    )
    MODEL_VERSIONING_AVAILABLE = True
except ImportError:
    MODEL_VERSIONING_AVAILABLE = False
    print("Model versioning system not available. Using local model path.")

class ConditionScorer:
    """
    Handles loading and inference for the property condition model
    More efficient implementation with versioning support
    """
    def __init__(self, model_path=None, version=None):
        """
        Initialize the model with the specified model path or version
        
        Args:
            model_path: Path to the trained model weights (if None, use versioning system)
            version: Specific version to load (if None, use current version)
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.version = version
        self.model_path = model_path
        
        # Initialize the MobileNetV2 model architecture
        self.model = mobilenet_v2(pretrained=True)
        
        # Modify the classifier to output 5 classes (condition levels 1-5)
        num_ftrs = self.model.classifier[1].in_features
        self.model.classifier[1] = torch.nn.Linear(num_ftrs, 5)
        
        # Load model weights using versioning system if available
        self.model_loaded = False
        
        if MODEL_VERSIONING_AVAILABLE and model_path is None:
            try:
                if version is None:
                    # Get current version
                    self.version = get_current_version("condition_model")
                    
                # Get model path for the specified version
                resolved_path = get_model_path("condition_model", self.version)
                print(f"Using versioned model: condition_model v{self.version}")
                self.model_path = resolved_path
                
                # Load the model
                self.model.load_state_dict(torch.load(resolved_path, map_location=self.device))
                self.model.eval()
                self.model_loaded = True
                print(f"Model v{self.version} loaded successfully from {resolved_path}")
                
            except Exception as e:
                print(f"Error loading versioned model: {str(e)}")
                print("Falling back to default model path")
                # Fall back to provided path or default path
                self.model_path = model_path or os.path.join(os.getcwd(), "models", "condition_model.pth")
        
        # Load from specific path if versioning failed or not available
        if not self.model_loaded and self.model_path is not None:
            if os.path.exists(self.model_path):
                try:
                    self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                    self.model.eval()  # Set to evaluation mode
                    self.model_loaded = True
                    print(f"Model loaded successfully from {self.model_path}")
                    
                    # Register this model if versioning is available but it wasn't loaded from registry
                    if MODEL_VERSIONING_AVAILABLE and version is None and not self.model_path.startswith(os.path.join(os.getcwd(), "models", "registry")):
                        try:
                            # Register the current model if it's not already in the registry
                            initialize_model_registry(self.model_path)
                            print(f"Model registered in versioning system")
                        except Exception as e:
                            print(f"Error registering model: {str(e)}")
                except Exception as e:
                    print(f"Error loading model: {str(e)}")
            else:
                print(f"Model file not found at {self.model_path}. Using fallback scoring.")
        
        self.model.to(self.device)
        
        # Define image transformations for model inference
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    
    def predict_condition(self, image_path):
        """
        Predict the condition score (1-5) of a property based on an image
        
        Args:
            image_path: Path to the property image
            
        Returns:
            score: A float between 1.0 and 5.0 representing the property condition
        """
        # If model isn't loaded, use fallback scoring method
        if not self.model_loaded:
            return self._fallback_scoring(image_path)
            
        try:
            # Load and transform the image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(image_tensor)
                
                # Get softmax probabilities
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
                
                # Calculate weighted average for a more precise score
                weighted_score = 0
                for i in range(5):
                    weighted_score += (i + 1) * probabilities[i].item()
                
                # Return the weighted score (between 1-5)
                return float(weighted_score)
        except Exception as e:
            print(f"Error predicting condition: {str(e)}")
            return self._fallback_scoring(image_path)
    
    def _fallback_scoring(self, image_path):
        """
        Fallback method for scoring when the model is not available.
        Uses simple image analysis to estimate condition.
        
        Args:
            image_path: Path to the property image
            
        Returns:
            score: A float between 1.0 and 5.0 representing the property condition
        """
        try:
            # Load the image
            image = Image.open(image_path).convert('RGB')
            
            # Resize for faster processing
            image = image.resize((128, 128))
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Calculate basic image statistics
            brightness = np.mean(img_array)
            contrast = np.std(img_array)
            
            # Simple heuristic based on brightness and contrast
            # Higher brightness and contrast often correlate with better condition
            score_brightness = (brightness / 255) * 2.5  # Scale to 0-2.5
            score_contrast = (min(contrast, 80) / 80) * 2.5  # Scale to 0-2.5, cap at 80
            
            # Combine scores
            score = score_brightness + score_contrast
            
            # Ensure the score is within range 1.0-5.0
            score = max(1.0, min(5.0, score))
            
            return score
        except Exception as e:
            print(f"Error in fallback scoring: {str(e)}")
            # Return a neutral score if all else fails
            return 3.0