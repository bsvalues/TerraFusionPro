import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { 
  PhotoEnhancementService, 
  PhotoEnhancementOptions 
} from '../services/photo-enhancement-service';

const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

// Create router
export const photoEnhancementRouter = Router();

// Configure file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed!'));
  }
});

/**
 * Convert file to base64
 */
async function fileToBase64(filePath: string): Promise<string> {
  const data = await readFileAsync(filePath);
  return data.toString('base64');
}

/**
 * Endpoint to analyze a photo and get enhancement recommendations
 */
photoEnhancementRouter.post('/analyze', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    // Get service instance
    const enhancementService = PhotoEnhancementService.getInstance();
    
    // Convert file to base64
    const base64Image = await fileToBase64(req.file.path);
    
    // Get enhancement recommendations
    const recommendations = await enhancementService.getRecommendedEnhancements(base64Image);
    
    // Clean up temporary file
    await unlinkAsync(req.file.path);
    
    res.status(200).json({
      success: true,
      recommendations
    });
    
  } catch (error) {
    console.error('Error analyzing photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing photo',
      error: error.message
    });
  }
});

/**
 * Endpoint to enhance a property photo
 */
photoEnhancementRouter.post('/enhance', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }
    
    // Get service instance
    const enhancementService = PhotoEnhancementService.getInstance();
    
    // Parse enhancement options
    const options: PhotoEnhancementOptions = {
      improveLighting: req.body.improveLighting === 'true',
      correctPerspective: req.body.correctPerspective === 'true',
      enhanceDetails: req.body.enhanceDetails === 'true',
      removeClutter: req.body.removeClutter === 'true',
      identifyFeatures: req.body.identifyFeatures === 'true'
    };
    
    // Convert file to base64
    const base64Image = await fileToBase64(req.file.path);
    
    // Enhance photo
    const result = await enhancementService.enhancePropertyPhoto(base64Image, options);
    
    // Clean up temporary file
    await unlinkAsync(req.file.path);
    
    // Return result
    res.status(200).json({
      success: true,
      result: {
        ...result,
        // Convert paths to URLs
        enhancedImageUrl: `/uploads/${path.basename(result.enhancedImagePath)}`,
        originalImageUrl: `/uploads/${path.basename(result.originalImagePath)}`
      }
    });
    
  } catch (error) {
    console.error('Error enhancing photo:', error);
    res.status(500).json({
      success: false,
      message: 'Error enhancing photo',
      error: error.message
    });
  }
});

export default photoEnhancementRouter;