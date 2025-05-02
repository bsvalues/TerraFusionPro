import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { log } from '../vite';

const router = Router();

// Configuration for the Python API backend
const PYTHON_API_BASE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

// Proxy endpoint for property appraisal
router.post('/appraise', async (req: Request, res: Response) => {
  try {
    log(`Proxying request to Python backend: ${PYTHON_API_BASE_URL}/appraise`);
    
    // Log the request body for debugging
    log(`Request body: ${JSON.stringify(req.body)}`);
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/appraise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Python API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        message: 'Error from valuation API', 
        error: errorText 
      });
    }
    
    const data = await response.json();
    log(`Received valuation response from Python API`);
    
    return res.status(200).json(data);
  } catch (error) {
    log(`Error in valuation proxy: ${error}`);
    res.status(500).json({ 
      message: 'Internal server error in valuation proxy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Proxy endpoint for market analysis
router.post('/market-analysis', async (req: Request, res: Response) => {
  try {
    log(`Proxying request to Python backend: ${PYTHON_API_BASE_URL}/analyze-market`);
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/analyze-market`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Python API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        message: 'Error from market analysis API', 
        error: errorText 
      });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    log(`Error in market analysis proxy: ${error}`);
    res.status(500).json({ 
      message: 'Internal server error in market analysis proxy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Proxy endpoint for valuation narrative generation
router.post('/valuation-narrative', async (req: Request, res: Response) => {
  try {
    log(`Proxying request to Python backend: ${PYTHON_API_BASE_URL}/generate-narrative`);
    
    const response = await fetch(`${PYTHON_API_BASE_URL}/generate-narrative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Python API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ 
        message: 'Error from narrative generation API', 
        error: errorText 
      });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    log(`Error in narrative generation proxy: ${error}`);
    res.status(500).json({ 
      message: 'Internal server error in narrative generation proxy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mock API response for local testing if Python API is not available
router.post('/mock-appraise', async (req: Request, res: Response) => {
  try {
    log('Using mock API response for appraise endpoint');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Extract property details from request
    const propertyDetails = req.body.property;
    
    // Generate a realistic property value based on square footage and location
    const baseValue = propertyDetails.squareFeet ? propertyDetails.squareFeet * 200 : 350000;
    const locationMultiplier = 
      propertyDetails.address?.state === 'CA' ? 1.5 : 
      propertyDetails.address?.state === 'NY' ? 1.4 : 
      propertyDetails.address?.state === 'FL' ? 1.2 : 1.0;
    
    const estimatedValue = Math.round(baseValue * locationMultiplier);
    
    // Create response
    const mockResponse = {
      estimatedValue,
      confidenceLevel: 'medium',
      valueRange: {
        min: Math.round(estimatedValue * 0.9),
        max: Math.round(estimatedValue * 1.1)
      },
      adjustments: [
        {
          factor: 'Location',
          description: 'Neighborhood quality adjustment',
          amount: Math.round(estimatedValue * 0.05),
          reasoning: 'Property is located in a desirable neighborhood with good schools and amenities'
        },
        {
          factor: 'Condition',
          description: 'Property condition adjustment',
          amount: Math.round(estimatedValue * 0.03),
          reasoning: `Property is in ${propertyDetails.condition || 'average'} condition`
        }
      ],
      marketAnalysis: `The market in ${propertyDetails.address?.city || 'this area'} has shown steady growth over the past year with average appreciation of 4.2%. Inventory levels remain low, creating a competitive environment for buyers.`,
      comparableAnalysis: 'Analysis based on 5 similar properties in the area sold in the last 6 months.',
      valuationMethodology: 'This valuation uses a hybrid approach combining sales comparison, cost, and income methodologies weighted according to property characteristics and available market data.'
    };
    
    return res.status(200).json(mockResponse);
  } catch (error) {
    log(`Error in mock appraise: ${error}`);
    res.status(500).json({ 
      message: 'Internal server error in mock appraise',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export const valuationProxyRouter = router;