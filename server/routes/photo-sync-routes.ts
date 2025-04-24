import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

// Define PhotoMetadata interface for CRDT sync
interface PhotoMetadata {
  id: string;
  reportId: number;
  originalUrl: string;
  enhancedUrl?: string;
  photoType: string;
  caption?: string;
  dateTaken?: Date;
  latitude?: string;
  longitude?: string;
  enhancementOptions?: Record<string, boolean>;
  analysis?: any;
  createdAt: Date;
  updatedAt: Date;
  pendingSync: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncError?: string;
}

// Set up multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: multerStorage });

// Create router
const photoSyncRouter = Router();

/**
 * Sync a photo from the client to the server
 * This handles both new photos and updates to existing ones
 */
photoSyncRouter.post('/photo-sync', async (req: Request, res: Response) => {
  try {
    const photoData = req.body as PhotoMetadata;
    
    // Validate the incoming data
    if (!photoData || !photoData.reportId || !photoData.photoType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo data'
      });
    }

    // Check if the photo exists in our database by client-generated ID
    const existingPhotos = await storage.getPhotosByReportId(photoData.reportId);
    // We need to handle the case where photos might not have metadata in storage
    const existingPhoto = existingPhotos.find(p => {
      if (!p.metadata) return false;
      try {
        const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
        return meta && meta.clientId === photoData.id;
      } catch (e) {
        return false;
      }
    });

    if (existingPhoto) {
      // Update existing photo
      const updatedPhoto = await storage.updatePhoto(existingPhoto.id, {
        caption: photoData.caption,
        photoType: photoData.photoType,
        url: photoData.enhancedUrl || photoData.originalUrl,
        dateTaken: photoData.dateTaken,
        latitude: photoData.latitude,
        longitude: photoData.longitude,
        metadata: {
          ...existingPhoto.metadata,
          clientId: photoData.id,
          enhancementOptions: photoData.enhancementOptions,
          analysis: photoData.analysis,
          lastSynced: new Date().toISOString()
        }
      });

      return res.status(200).json({
        success: true,
        photo: {
          ...photoData,
          serverId: updatedPhoto.id,
          pendingSync: false,
          syncStatus: 'synced'
        }
      });
    } else {
      // Create new photo record
      const newPhoto = await storage.createPhoto({
        reportId: photoData.reportId,
        photoType: photoData.photoType,
        url: photoData.enhancedUrl || photoData.originalUrl,
        caption: photoData.caption,
        dateTaken: photoData.dateTaken,
        latitude: photoData.latitude,
        longitude: photoData.longitude,
        metadata: {
          clientId: photoData.id,
          enhancementOptions: photoData.enhancementOptions,
          analysis: photoData.analysis,
          createdFromMobile: true,
          lastSynced: new Date().toISOString()
        }
      });

      return res.status(201).json({
        success: true,
        photo: {
          ...photoData,
          serverId: newPhoto.id,
          pendingSync: false,
          syncStatus: 'synced'
        }
      });
    }
  } catch (error) {
    console.error('Error in photo sync:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload a photo file to the server for a report
 */
photoSyncRouter.post('/reports/:reportId/photo-upload', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const clientId = req.body.clientId;
    const photoType = req.body.photoType || 'property';
    const caption = req.body.caption;
    
    // Verify the photo was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    // Create a URL path to the photo
    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Store in database
    const photo = await storage.createPhoto({
      reportId: Number(reportId),
      photoType,
      url: photoUrl,
      caption,
      dateTaken: new Date(),
      metadata: {
        clientId,
        originalFilename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

    return res.status(201).json({
      success: true,
      photo
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get a specific photo with its CRDT sync status
 */
photoSyncRouter.get('/reports/:reportId/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    
    const photo = await storage.getPhoto(Number(photoId));
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    return res.status(200).json({
      success: true,
      photo
    });
  } catch (error) {
    console.error('Error getting photo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete a photo from the server
 */
photoSyncRouter.delete('/reports/:reportId/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    
    // Get the photo to check if we need to delete the file
    const photo = await storage.getPhoto(Number(photoId));
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Delete from database
    await storage.deletePhoto(Number(photoId));

    // Delete the file if it's stored locally
    if (photo.url && photo.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Photo deleted'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default photoSyncRouter;