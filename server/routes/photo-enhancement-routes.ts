import { Router } from 'express';
import { 
  enhancePhoto, 
  analyzePhoto, 
  analyzePhotoAdvanced,
  inspectProperty,
  saveEnhancedPhoto,
  upload 
} from '../controllers/photo-enhancement-controller';

const router = Router();

// Route for photo enhancement
router.post('/enhance', upload.single('photo'), enhancePhoto);

// Route for basic photo analysis with OpenAI
router.post('/analyze', upload.single('photo'), analyzePhoto);

// Route for advanced photo analysis with Anthropic
router.post('/analyze-advanced', upload.single('photo'), analyzePhotoAdvanced);

// Route for detailed property inspection
router.post('/inspect', upload.single('photo'), inspectProperty);

// Route for saving enhanced photo to database
router.post('/save', saveEnhancedPhoto);

export default router;