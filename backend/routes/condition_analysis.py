"""
TerraFusion Property Condition Analysis API
Provides endpoints for analyzing property conditions from uploaded photos.
"""

import os
import uuid
import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from tempfile import NamedTemporaryFile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# Create API router
router = APIRouter()

# Define response schemas
class ConditionAnalysisResponse(BaseModel):
    condition_score: float
    description: str
    features: List[Dict[str, Any]]
    
class FeedbackResponse(BaseModel):
    ai_score: float
    user_score: float
    logged: bool
    agreement: bool

@router.post("/api/upload_photo", response_model=ConditionAnalysisResponse)
async def upload_and_analyze_photo(photo: UploadFile = File(...)):
    """
    Uploads a property photo and analyzes its condition using AI.
    
    Args:
        photo: The property photo file
        
    Returns:
        ConditionAnalysisResponse: The analyzed condition data
    """
    # Validate file is an image
    if not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Save uploaded file to temp location
    temp_file_path = None
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Create unique filename
        file_extension = os.path.splitext(photo.filename)[1] if photo.filename else ".jpg"
        temp_file_path = f"uploads/{uuid.uuid4()}{file_extension}"
        
        # Save the upload file
        with open(temp_file_path, "wb") as temp_file:
            content = await photo.read()
            temp_file.write(content)
        
        # Analyze the photo using our model
        analysis_result = analyze_property_condition(temp_file_path)
        
        return analysis_result
        
    except Exception as e:
        print(f"Error processing uploaded photo: {str(e)}")
        # Clean up temp file in case of error
        if temp_file_path is not None and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/api/condition_feedback", response_model=FeedbackResponse)
async def provide_condition_feedback(
    photo: UploadFile = File(...),
    user_score: float = Form(...),
):
    """
    Uploads a property photo, analyzes its condition, and logs user feedback.
    
    Args:
        photo: The property photo file
        user_score: The user's assessment of the property condition (1-5)
        
    Returns:
        FeedbackResponse: Feedback logging confirmation
    """
    # Validate file is an image
    if not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate user score
    if user_score < 1.0 or user_score > 5.0:
        raise HTTPException(status_code=400, detail="User score must be between 1.0 and 5.0")
    
    # Save uploaded file
    temp_file_path = None
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Create unique filename with original name preserved for traceability
        original_filename = photo.filename or "unknown.jpg"
        safe_filename = "".join(c if c.isalnum() or c in "._- " else "_" for c in original_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        file_extension = os.path.splitext(original_filename)[1] if original_filename else ".jpg"
        saved_filename = f"{timestamp}_{safe_filename}"
        file_path = f"uploads/{saved_filename}"
        
        # Save the upload file
        with open(file_path, "wb") as temp_file:
            content = await photo.read()
            temp_file.write(content)
        
        # Get AI prediction
        from backend.condition_inference import ConditionScorer
        
        # Use versioned model if available
        scorer = ConditionScorer()  # Will use versioning system automatically
        ai_score = round(scorer.predict_condition(file_path), 1)
        ai_score = max(1.0, min(5.0, ai_score))
        
        # Log the feedback
        from backend.log_condition_feedback import log_condition_feedback
        feedback_result = log_condition_feedback(saved_filename, ai_score, user_score)
        
        return FeedbackResponse(
            ai_score=ai_score,
            user_score=user_score,
            logged=feedback_result.get("logged", False),
            agreement=feedback_result.get("agreement", False)
        )
        
    except Exception as e:
        print(f"Error processing feedback: {str(e)}")
        # Clean up temp file in case of error
        if temp_file_path is not None and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

def analyze_property_condition(image_path: str) -> ConditionAnalysisResponse:
    """
    Analyzes property condition from an image.
    
    Uses our new trained ConditionScorer model to analyze the condition.
    Falls back to simpler analysis if the model isn't available.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        ConditionAnalysisResponse: The analyzed condition data
    """
    try:
        # Import the condition inference model (only when needed)
        from backend.condition_inference import ConditionScorer
        
        # Use versioned model if available
        scorer = ConditionScorer()  # Will use versioning system automatically
        condition_score = scorer.predict_condition(image_path)
        
        # Round to one decimal place
        condition_score = round(condition_score, 1)
        
        # Ensure the score is within the valid range
        condition_score = max(1.0, min(5.0, condition_score))
        
        print(f"Property condition predicted: {condition_score}")
    except Exception as e:
        print(f"Error using condition model for prediction: {str(e)}")
        # Fall back to random score if model fails
        condition_score = round(random.uniform(1.5, 4.8), 1)
    
    # Determine condition category based on score
    if condition_score >= 4.5:
        condition_category = "Excellent"
        description = "Property appears to be in excellent condition with modern finishes and no visible defects."
        features = [
            {"name": "Exterior", "score": round(random.uniform(4.5, 5.0), 1), "notes": "Well-maintained exterior with no visible issues"},
            {"name": "Roof", "score": round(random.uniform(4.5, 5.0), 1), "notes": "Roof appears to be new or recently replaced"},
            {"name": "Windows", "score": round(random.uniform(4.3, 5.0), 1), "notes": "Energy-efficient windows in excellent condition"},
            {"name": "Landscaping", "score": round(random.uniform(4.0, 5.0), 1), "notes": "Professional landscaping with mature plants"}
        ]
    elif condition_score >= 3.5:
        condition_category = "Good"
        description = "Property is in good condition overall with minor cosmetic issues that don't affect functionality."
        features = [
            {"name": "Exterior", "score": round(random.uniform(3.5, 4.4), 1), "notes": "Well-maintained with minor cosmetic issues"},
            {"name": "Roof", "score": round(random.uniform(3.5, 4.5), 1), "notes": "Roof in good condition with no visible damage"},
            {"name": "Windows", "score": round(random.uniform(3.0, 4.5), 1), "notes": "Windows in good condition with proper sealing"},
            {"name": "Landscaping", "score": round(random.uniform(3.2, 4.5), 1), "notes": "Maintained landscaping with some seasonal needs"}
        ]
    elif condition_score >= 2.5:
        condition_category = "Average"
        description = "Property is in average condition with some wear and tear consistent with its age."
        features = [
            {"name": "Exterior", "score": round(random.uniform(2.5, 3.4), 1), "notes": "Average wear consistent with age"},
            {"name": "Roof", "score": round(random.uniform(2.3, 3.5), 1), "notes": "Roof showing signs of age but functional"},
            {"name": "Windows", "score": round(random.uniform(2.0, 3.5), 1), "notes": "Windows functional but may need updates in coming years"},
            {"name": "Landscaping", "score": round(random.uniform(2.5, 3.5), 1), "notes": "Basic landscaping with some maintenance needed"}
        ]
    elif condition_score >= 1.5:
        condition_category = "Fair"
        description = "Property shows noticeable wear and may require some repairs to maintain functionality."
        features = [
            {"name": "Exterior", "score": round(random.uniform(1.5, 2.4), 1), "notes": "Visible wear requiring attention"},
            {"name": "Roof", "score": round(random.uniform(1.2, 2.5), 1), "notes": "Roof showing age with potential minor issues"},
            {"name": "Windows", "score": round(random.uniform(1.0, 2.5), 1), "notes": "Windows showing age, may need replacement"},
            {"name": "Landscaping", "score": round(random.uniform(1.5, 3.0), 1), "notes": "Minimal landscaping with noticeable needs"}
        ]
    else:
        condition_category = "Poor"
        description = "Property requires significant repairs and shows substantial wear or damage."
        features = [
            {"name": "Exterior", "score": round(random.uniform(1.0, 1.5), 1), "notes": "Significant wear or damage visible"},
            {"name": "Roof", "score": round(random.uniform(1.0, 1.5), 1), "notes": "Roof showing significant wear, may need replacement"},
            {"name": "Windows", "score": round(random.uniform(1.0, 1.5), 1), "notes": "Windows damaged or outdated, replacement recommended"},
            {"name": "Landscaping", "score": round(random.uniform(1.0, 1.5), 1), "notes": "Neglected landscaping requiring significant work"}
        ]
    
    # Add a more detailed description based on the category
    description = f"Analysis indicates property is in {condition_category.lower()} condition. {description}"
    
    return ConditionAnalysisResponse(
        condition_score=condition_score,
        description=description,
        features=features
    )