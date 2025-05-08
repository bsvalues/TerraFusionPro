import { Router } from 'express';
import { PropertyIdentifierService } from '../utils/property-identifier';

const router = Router();

/**
 * Process a property order
 * Uses the flexible property identifier system to handle various ID formats
 */
router.post('/process', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Use the flexible identifier service to process the order
    const result = await PropertyIdentifierService.processPropertyOrder(orderData);
    
    if (result.success) {
      // If property was found, return success with the property data
      return res.status(200).json({
        success: true,
        message: 'Order processed successfully',
        property: result.property
      });
    } else {
      // If property was not found, return appropriate error message
      return res.status(404).json({
        success: false,
        message: result.message || 'Property not found'
      });
    }
  } catch (error) {
    console.error('Error processing order:', error);
    
    // Provide helpful error messages
    let errorMessage = 'An error occurred while processing the order';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Special handling for the parcel_id column error
      if (errorMessage.includes('column "parcel_id" of relation "properties" does not exist')) {
        errorMessage = 'The database schema is missing the parcel_id column. Please use the flexible property identifier system.';
      }
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

/**
 * Search for a property using flexible identifier matching
 */
router.get('/search/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Property identifier is required'
      });
    }
    
    // Use the flexible identifier system to find the property
    const property = await PropertyIdentifierService.findProperty(identifier);
    
    if (property) {
      return res.status(200).json({
        success: true,
        property
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Property not found with the provided identifier'
      });
    }
  } catch (error) {
    console.error('Error searching for property:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while searching for the property'
    });
  }
});

export default router;