# TerraFusion Core AI Valuator

An advanced, AI-powered property valuation system that leverages machine learning to provide accurate real estate appraisals.

## Overview

TerraFusion Core AI Valuator is a sophisticated property valuation tool that combines:

- Advanced AI models for property value estimation
- Market trend analysis capabilities
- Comparable property assessment
- Detailed valuation narratives and reporting

The system provides a user-friendly interface for entering property details and receiving comprehensive valuation reports with confidence scores and supporting analysis.

## Architecture

The TerraFusion Core AI Valuator is built on a three-limb architecture:

1. **Backend API** (`backend/main.py`): FastAPI-based RESTful API that handles incoming requests, validation, and coordination between components.

2. **Neural Spine** (`model/valuation.py`): Core valuation engine that implements the property assessment algorithms, adjustment calculations, and machine learning models.

3. **User Interface** (`frontend/App.jsx`): React-based frontend that provides an intuitive interface for property data entry and result visualization.

## Key Features

- **Automated Valuation Model (AVM)**: Machine learning algorithms that consider property characteristics, location data, and market trends
- **Comparable Sales Analysis**: Identification and adjustment of comparable properties to determine subject property value
- **Market Trend Analysis**: Assessment of local real estate market conditions and trends
- **Valuation Narratives**: AI-generated explanations of valuation decisions and influencing factors
- **Confidence Scoring**: Transparent indication of confidence levels in the valuation results

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Required Python packages: fastapi, uvicorn, scikit-learn, pandas, numpy
- Required Node.js packages: http-proxy-middleware, express

### Installation

1. Clone the repository
2. Install Python dependencies:
   ```
   pip install fastapi uvicorn scikit-learn pandas numpy
   ```
3. Install Node.js dependencies:
   ```
   npm install http-proxy-middleware express
   ```

### Running the Application

For the simplest startup experience, use the provided starter script:

```
node start_terrafusion.js
```

This will:
1. Start the Python FastAPI backend on port 8000
2. Start the frontend proxy server on port 3000
3. Connect the two services together

Alternatively, you can run each component separately:

- Backend: `python run_api.py`
- Frontend: `node proxy.js`

## Usage

1. Navigate to the application in your web browser (default: http://localhost:3000)
2. Enter property details in the form (address, property characteristics, features, etc.)
3. Click "Appraise Property" to generate a valuation
4. Review the detailed results, including:
   - Estimated value with confidence level
   - Value range based on confidence
   - Market analysis
   - Value adjustments and their reasoning
   - Comparable property analysis

## Sample Property

For testing, you can use the "Fill Sample Data" button to populate the form with details for:

4234 Old Milton Hwy, Walla Walla, WA 99362

This sample property will trigger a special valuation pathway with detailed analysis.

## License

Copyright © 2025 TerraFusion. All rights reserved.