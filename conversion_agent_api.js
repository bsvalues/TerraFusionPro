/**
 * TerraFusion Universal Conversion Agent API
 * Express endpoint for data conversion services
 */

const express = require("express");
const multer = require("multer");
const UniversalConversionAgent = require("./rust_bridge");

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const conversionAgent = new UniversalConversionAgent();

// Health check endpoint
router.get("/conversion/health", async (req, res) => {
  try {
    const isReady = await conversionAgent.isReady();
    res.json({
      status: "ok",
      service: "Universal Conversion Agent",
      rustAgentReady: isReady,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Convert CSV data using XML template
router.post("/conversion/convert", upload.single("csvFile"), async (req, res) => {
  try {
    const { templateName, csvData } = req.body;
    let dataToProcess;

    if (req.file) {
      // File upload - read CSV from uploaded file
      const fs = require("fs").promises;
      const csvContent = await fs.readFile(req.file.path, "utf8");
      // Parse CSV content into array format
      const lines = csvContent.split("\n").filter((line) => line.trim());
      dataToProcess = lines.map((line) => line.split(","));
    } else if (csvData) {
      // JSON data provided
      dataToProcess = Array.isArray(csvData) ? csvData : [csvData];
    } else {
      return res.status(400).json({
        success: false,
        error: "No CSV file or data provided",
      });
    }

    const result = await conversionAgent.processPropertyData(
      dataToProcess,
      templateName || "sample_template.xml"
    );

    // Clean up uploaded file
    if (req.file) {
      const fs = require("fs").promises;
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Create new conversion template
router.post("/conversion/template", async (req, res) => {
  try {
    const templateConfig = req.body;

    if (!templateConfig.name || !templateConfig.fields) {
      return res.status(400).json({
        success: false,
        error: "Template name and fields are required",
      });
    }

    const templatePath = await conversionAgent.createTemplate(templateConfig);

    res.json({
      success: true,
      templatePath,
      templateName: templateConfig.name,
      message: "Template created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// List available templates
router.get("/conversion/templates", async (req, res) => {
  try {
    const templates = await conversionAgent.listTemplates();
    res.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Build Rust agent if needed
router.post("/conversion/build", async (req, res) => {
  try {
    const isReady = await conversionAgent.isReady();

    if (isReady) {
      return res.json({
        success: true,
        message: "Rust agent is already built and ready",
      });
    }

    const buildSuccess = await conversionAgent.buildAgent();

    res.json({
      success: buildSuccess,
      message: buildSuccess ? "Rust agent built successfully" : "Failed to build Rust agent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Convert property data specifically for TerraFusion format
router.post("/conversion/property", async (req, res) => {
  try {
    const { properties, templateName } = req.body;

    if (!properties || !Array.isArray(properties)) {
      return res.status(400).json({
        success: false,
        error: "Properties array is required",
      });
    }

    // Convert property objects to CSV format for processing
    const csvData = properties.map((prop) => [
      prop.address || "",
      prop.price || 0,
      prop.sqft || 0,
      prop.bedrooms || 0,
    ]);

    const result = await conversionAgent.processPropertyData(
      csvData,
      templateName || "sample_template.xml"
    );

    res.json({
      ...result,
      terrafusionFormat: true,
      inputProperties: properties.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
