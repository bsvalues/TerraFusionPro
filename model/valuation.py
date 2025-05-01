import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import os
import json
import random
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Constants
DEFAULT_PRICE_PER_SQFT = 250.0  # Default price per square foot
MARKET_GROWTH_RATE = 0.052  # 5.2% annual growth rate for our sample market

# Mock market data by zip code (would be replaced with real data in production)
MARKET_DATA = {
    "99362": {
        "avg_price_per_sqft": 242.5,
        "price_trend_1yr": 0.052,  # 5.2% increase
        "median_days_on_market": 15,
        "inventory_months": 1.8,
        "median_household_income": 68500,
    },
    # Add more zip codes as needed
}

# Weights for property features in valuation
FEATURE_WEIGHTS = {
    "bedrooms": 15000,  # per bedroom
    "bathrooms": 25000,  # per bathroom
    "yearBuilt": 500,    # per year newer than 1950
    "lotSize": 50000,    # per acre
    "condition": {
        "Excellent": 1.15,  # multiplier
        "Good": 1.05,
        "Average": 1.0,
        "Fair": 0.9,
        "Poor": 0.8
    },
    "propertyType": {
        "single-family": 1.0,  # multiplier
        "condo": 0.85,
        "townhouse": 0.9,
        "multi-family": 1.2,
        "land": 0.7
    }
}

# Feature importance for adjustments
FEATURE_IMPORTANCE = {
    "location": 0.35,
    "size": 0.25,
    "condition": 0.20,
    "age": 0.10,
    "lot_size": 0.05,
    "features": 0.05
}

class PropertyValuationModel:
    """
    A class that implements property valuation using both heuristic and 
    machine learning approaches.
    """
    
    def __init__(self):
        """
        Initialize the valuation model.
        """
        self.model = None
        self._init_ml_model()
    
    def _init_ml_model(self):
        """
        Initialize and train the machine learning model.
        """
        # In a real implementation, we would load pre-trained models or train on real data
        # For now, we'll create a simple model structure
        
        # Define preprocessing for numerical features
        numeric_features = ['squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize']
        numeric_transformer = StandardScaler()
        
        # Define preprocessing for categorical features
        categorical_features = ['propertyType', 'condition']
        categorical_transformer = OneHotEncoder(handle_unknown='ignore')
        
        # Combine preprocessing steps
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])
        
        # Create the modeling pipeline
        self.model = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        
        # In a real implementation, we would fit the model here with historical data
        # For now, we'll rely on the heuristic approach
    
    def _calculate_base_value(self, property_details: Dict[str, Any]) -> float:
        """
        Calculate the base value of a property using a heuristic approach.
        
        Args:
            property_details: Dictionary containing property attributes
            
        Returns:
            float: Base estimated value
        """
        # Extract property attributes
        square_feet = property_details.get('squareFeet', 0)
        bedrooms = property_details.get('bedrooms', 0)
        bathrooms = property_details.get('bathrooms', 0)
        year_built = property_details.get('yearBuilt', 2000)
        lot_size = property_details.get('lotSize', 0.0)  # in acres
        condition = property_details.get('condition', 'Average')
        property_type = property_details.get('propertyType', 'single-family').lower()
        
        # Get zip code for market data
        zip_code = property_details.get('address', {}).get('zipCode', None)
        
        # Determine price per square foot based on zip code data if available
        price_per_sqft = DEFAULT_PRICE_PER_SQFT
        if zip_code and zip_code in MARKET_DATA:
            price_per_sqft = MARKET_DATA[zip_code].get('avg_price_per_sqft', DEFAULT_PRICE_PER_SQFT)
        
        # Calculate base value from square footage
        base_value = square_feet * price_per_sqft
        
        # Add value for bedrooms
        base_value += bedrooms * FEATURE_WEIGHTS['bedrooms']
        
        # Add value for bathrooms
        base_value += bathrooms * FEATURE_WEIGHTS['bathrooms']
        
        # Add value for newer construction (based on years newer than 1950)
        if year_built > 1950:
            base_value += (year_built - 1950) * FEATURE_WEIGHTS['yearBuilt']
        
        # Add value for lot size
        base_value += lot_size * FEATURE_WEIGHTS['lotSize']
        
        # Apply condition multiplier
        condition_multiplier = FEATURE_WEIGHTS['condition'].get(condition, 1.0)
        base_value *= condition_multiplier
        
        # Apply property type multiplier
        property_type_multiplier = FEATURE_WEIGHTS['propertyType'].get(property_type, 1.0)
        base_value *= property_type_multiplier
        
        return base_value
    
    def _calculate_adjustments(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Calculate adjustments based on property characteristics.
        
        Args:
            property_details: Dictionary containing subject property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            List[Dict]: List of adjustment factors and amounts
        """
        adjustments = []
        
        # Location adjustment
        zip_code = property_details.get('address', {}).get('zipCode', None)
        if zip_code and zip_code in MARKET_DATA:
            market_data = MARKET_DATA[zip_code]
            if market_data['inventory_months'] < 3.0:  # Low inventory
                adjustments.append({
                    'factor': 'Location',
                    'description': f"Premium location with low inventory ({market_data['inventory_months']} months)",
                    'amount': property_details.get('squareFeet', 0) * 10,  # $10 per sqft premium
                    'reasoning': "Low inventory markets command premium pricing due to supply and demand imbalance."
                })
            
            if market_data['median_days_on_market'] < 20:  # Hot market
                adjustments.append({
                    'factor': 'Market Conditions',
                    'description': f"Hot market with properties selling in {market_data['median_days_on_market']} days",
                    'amount': property_details.get('squareFeet', 0) * 5,  # $5 per sqft premium
                    'reasoning': "Properties selling quickly indicate strong demand and support higher valuations."
                })
        
        # Condition adjustments
        condition = property_details.get('condition', 'Average')
        if condition in ['Excellent', 'Good']:
            adjustments.append({
                'factor': 'Condition',
                'description': f"{condition} condition rating",
                'amount': property_details.get('squareFeet', 0) * (15 if condition == 'Excellent' else 7),
                'reasoning': f"Properties in {condition} condition command premium pricing due to move-in readiness and reduced maintenance costs."
            })
        
        # Features adjustments
        features = property_details.get('features', [])
        feature_names = [f.get('name', '') for f in features]
        
        if 'Updated Kitchen' in feature_names:
            adjustments.append({
                'factor': 'Updated Kitchen',
                'description': "Modern kitchen with upgrades",
                'amount': 20000.0,
                'reasoning': "Updated kitchens are one of the highest ROI improvements and significantly impact buyer perception."
            })
            
        if 'Hardwood Floors' in feature_names:
            adjustments.append({
                'factor': 'Hardwood Floors',
                'description': "Quality hardwood flooring",
                'amount': 10000.0,
                'reasoning': "Hardwood floors are a premium feature preferred by buyers over carpet or laminate."
            })
            
        if 'Fireplace' in feature_names:
            adjustments.append({
                'factor': 'Fireplace',
                'description': "Functional fireplace",
                'amount': 5000.0,
                'reasoning': "Fireplaces add character and provide an efficient heating source in colder climates."
            })
        
        return adjustments
    
    def _determine_confidence_level(self, property_details: Dict[str, Any], comparables: List[Dict[str, Any]]) -> Tuple[str, float]:
        """
        Determine the confidence level of the valuation.
        
        Args:
            property_details: Dictionary containing property attributes
            comparables: List of comparable properties
            
        Returns:
            Tuple[str, float]: Confidence level (high, medium, low) and confidence score (0-1)
        """
        # Base confidence starts at medium
        confidence_score = 0.5
        
        # More comparable properties increase confidence
        if len(comparables) >= 5:
            confidence_score += 0.2
        elif len(comparables) >= 3:
            confidence_score += 0.1
        
        # More property details increase confidence
        required_fields = ['squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize', 'condition']
        available_fields = sum(1 for field in required_fields if field in property_details and property_details[field] is not None)
        field_ratio = available_fields / len(required_fields)
        confidence_score += field_ratio * 0.2
        
        # If we have market data for the zip code, increase confidence
        zip_code = property_details.get('address', {}).get('zipCode', None)
        if zip_code and zip_code in MARKET_DATA:
            confidence_score += 0.1
        
        # Determine confidence level
        if confidence_score >= 0.8:
            level = "high"
        elif confidence_score >= 0.5:
            level = "medium"
        else:
            level = "low"
            
        return level, min(confidence_score, 1.0)

    def value_property(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Value a property using available data.
        
        Args:
            property_details: Dictionary containing property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            Dict: Valuation results including estimated value, adjustments, etc.
        """
        if comparable_properties is None:
            comparable_properties = []
        
        # Calculate base value using heuristic approach
        base_value = self._calculate_base_value(property_details)
        
        # Calculate adjustments
        adjustments = self._calculate_adjustments(property_details, comparable_properties)
        
        # Apply adjustments to base value
        adjusted_value = base_value
        for adjustment in adjustments:
            adjusted_value += adjustment['amount']
        
        # Round to nearest thousand
        final_value = round(adjusted_value / 1000) * 1000
        
        # Determine confidence level
        confidence_level, confidence_score = self._determine_confidence_level(property_details, comparable_properties)
        
        # Calculate value range based on confidence
        if confidence_level == "high":
            value_range = {
                "min": round((final_value * 0.97) / 1000) * 1000,
                "max": round((final_value * 1.03) / 1000) * 1000
            }
        elif confidence_level == "medium":
            value_range = {
                "min": round((final_value * 0.93) / 1000) * 1000,
                "max": round((final_value * 1.07) / 1000) * 1000
            }
        else:  # low confidence
            value_range = {
                "min": round((final_value * 0.90) / 1000) * 1000,
                "max": round((final_value * 1.10) / 1000) * 1000
            }
        
        # Prepare comparable analysis
        comparable_analysis = self._generate_comparable_analysis(property_details, comparable_properties)
        
        return {
            "estimatedValue": final_value,
            "confidenceLevel": confidence_level,
            "valueRange": value_range,
            "adjustments": adjustments,
            "comparableAnalysis": comparable_analysis,
            "valuationMethodology": "Sales Comparison Approach with heuristic adjustments"
        }
    
    def _generate_comparable_analysis(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]]
    ) -> str:
        """
        Generate a summary of the comparable analysis.
        
        Args:
            property_details: Dictionary containing property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            str: Analysis of comparables
        """
        if not comparable_properties:
            return "No comparable properties were available for analysis."
        
        num_comps = len(comparable_properties)
        price_sqft_list = []
        
        for comp in comparable_properties:
            if comp.get('squareFeet') and comp.get('salePrice'):
                sqft = comp.get('squareFeet')
                # Handle price as string with $ or as float
                price = comp.get('salePrice')
                if isinstance(price, str):
                    price = float(price.replace('$', '').replace(',', ''))
                
                if sqft > 0:
                    price_sqft_list.append(price / sqft)
        
        if price_sqft_list:
            avg_price_sqft = sum(price_sqft_list) / len(price_sqft_list)
            min_price_sqft = min(price_sqft_list)
            max_price_sqft = max(price_sqft_list)
            
            return (f"Analysis based on {num_comps} comparable properties. "
                   f"Average price per square foot is ${avg_price_sqft:.2f}, "
                   f"ranging from ${min_price_sqft:.2f} to ${max_price_sqft:.2f}. "
                   f"These comparable sales support the valuation range provided.")
        else:
            return (f"Analysis based on {num_comps} comparable properties. "
                   f"Unable to determine average price per square foot due to "
                   f"incomplete data in the comparable properties.")


# Initialize a global instance of the valuation model
_valuation_model = PropertyValuationModel()

def perform_automated_valuation(
    property_details: Dict[str, Any],
    comparable_properties: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Perform an automated valuation of a property.
    
    Args:
        property_details: Dictionary containing property attributes
        comparable_properties: List of comparable properties
        
    Returns:
        Dict: Valuation results
    """
    valuation = _valuation_model.value_property(property_details, comparable_properties)
    return valuation

def analyze_market_trends(
    property_details: Dict[str, Any],
    zip_code: str = None
) -> str:
    """
    Analyze market trends for a specific property location.
    
    Args:
        property_details: Dictionary containing property attributes
        zip_code: ZIP code for the property
        
    Returns:
        str: Market analysis text
    """
    if zip_code is None:
        zip_code = property_details.get('address', {}).get('zipCode', None)
    
    # Look up market data by ZIP code
    if zip_code and zip_code in MARKET_DATA:
        market_data = MARKET_DATA[zip_code]
        
        trend_direction = "up" if market_data['price_trend_1yr'] > 0 else "down"
        trend_percent = abs(market_data['price_trend_1yr'] * 100)
        
        return (
            f"The {property_details.get('address', {}).get('city', 'local')} market "
            f"has shown values trending {trend_direction} approximately {trend_percent:.1f}% "
            f"over the past year. Properties are typically selling within "
            f"{market_data['median_days_on_market']} days on market, with approximately "
            f"{market_data['inventory_months']:.1f} months of inventory available. "
            f"Current market conditions favor {'sellers' if market_data['inventory_months'] < 5 else 'buyers'} "
            f"with {'limited' if market_data['inventory_months'] < 3 else 'adequate'} inventory "
            f"and {'strong' if market_data['median_days_on_market'] < 30 else 'moderate'} demand."
        )
    else:
        return (
            f"Market data for the specified area is limited. "
            f"National housing trends indicate moderate growth with regional variations. "
            f"Local market analysis would require additional data."
        )

def generate_valuation_narrative(
    property_details: Dict[str, Any],
    valuation: Dict[str, Any]
) -> str:
    """
    Generate a narrative description of the valuation results.
    
    Args:
        property_details: Dictionary containing property attributes
        valuation: Dictionary containing valuation results
        
    Returns:
        str: Narrative text
    """
    address = property_details.get('address', {})
    location = f"{address.get('street', 'the subject property')}, {address.get('city', '')}, {address.get('state', '')}"
    
    estimated_value = valuation.get('estimatedValue', 0)
    confidence = valuation.get('confidenceLevel', 'medium')
    value_range = valuation.get('valueRange', {'min': 0, 'max': 0})
    adjustments = valuation.get('adjustments', [])
    
    narrative = [
        f"# Valuation Summary for {location}",
        "",
        f"Based on our analysis, the estimated market value of the subject property is ${estimated_value:,.2f} "
        f"(ranging from ${value_range['min']:,.2f} to ${value_range['max']:,.2f}), "
        f"with a {confidence} level of confidence.",
        "",
        "## Property Characteristics",
        "",
        f"The subject property is a {property_details.get('propertyType', 'residential')} property "
        f"built in {property_details.get('yearBuilt', 'an unknown year')}, "
        f"with {property_details.get('bedrooms', 0)} bedrooms and {property_details.get('bathrooms', 0)} bathrooms. "
        f"The property contains approximately {property_details.get('squareFeet', 0)} square feet "
        f"on a {property_details.get('lotSize', 0):.2f} acre lot.",
        "",
        f"The property is in {property_details.get('condition', 'unknown')} condition. "
    ]
    
    # Add features if available
    features = property_details.get('features', [])
    if features:
        feature_names = [f.get('name', '') for f in features]
        if feature_names:
            narrative.append("Notable features include: " + ", ".join(feature_names) + ".")
            narrative.append("")
    
    # Add adjustment factors
    if adjustments:
        narrative.append("## Value Adjustments")
        narrative.append("")
        for adj in adjustments:
            narrative.append(
                f"* {adj['factor']}: {adj['description']} (${adj['amount']:,.2f}) - {adj['reasoning']}"
            )
        narrative.append("")
    
    # Add market analysis
    market_analysis = valuation.get('marketAnalysis', None)
    if market_analysis:
        narrative.append("## Market Analysis")
        narrative.append("")
        narrative.append(market_analysis)
        narrative.append("")
    
    # Add comparable analysis
    comparable_analysis = valuation.get('comparableAnalysis', None)
    if comparable_analysis:
        narrative.append("## Comparable Property Analysis")
        narrative.append("")
        narrative.append(comparable_analysis)
        narrative.append("")
    
    # Add methodology
    narrative.append("## Methodology")
    narrative.append("")
    narrative.append(
        f"This valuation was prepared using the {valuation.get('valuationMethodology', 'Sales Comparison Approach')}. "
        f"The confidence level is {confidence}, indicating "
        f"{'a high degree of reliability in the estimate' if confidence == 'high' else 'a reasonable basis for the estimate' if confidence == 'medium' else 'that the estimate should be used with caution'}."
    )
    
    return "\n".join(narrative)