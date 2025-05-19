import express from "express";
import { generatePropertyValuation, analyzePropertyByAddress } from "../valuation-service";

const router = express.Router();

/**
 * API endpoint for property analysis
 * POST /api/property-analysis
 * Analyzes a property based on provided details
 */
router.post("/", async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData || !propertyData.address) {
      return res.status(400).json({
        error: "Property data including address is required"
      });
    }
    
    // Generate AI valuation for the property
    const analysisResult = await generatePropertyValuation(propertyData);
    
    return res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing property:", error);
    return res.status(500).json({
      error: "Failed to analyze property",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * API endpoint for analyzing a specific property at 406 Stardust Court
 * GET /api/property-analysis/specific/stardust
 * This is a convenience endpoint for testing with a pre-defined property
 */
router.get("/specific/stardust", async (req, res) => {
  try {
    // Use our pre-defined Stardust property data
    const analysisResult = await analyzePropertyByAddress(
      "406 Stardust Ct", 
      "Grandview", 
      "WA", 
      "98930"
    );
    
    return res.json(analysisResult);
  } catch (error) {
    console.error("Error analyzing Stardust property:", error);
    return res.status(500).json({
      error: "Failed to analyze Stardust property",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;