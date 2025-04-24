import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

/**
 * Compression quality levels
 */
export enum CompressionQuality {
  LOW = 'low',          // High compression, lower quality (0.3)
  MEDIUM = 'medium',    // Medium compression, medium quality (0.6)
  HIGH = 'high',        // Low compression, high quality (0.8)
  ORIGINAL = 'original' // No compression, original quality (1.0)
}

/**
 * Compression format
 */
export enum CompressionFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp'
}

/**
 * Image resize mode
 */
export enum ResizeMode {
  COVER = 'cover',     // Maintain aspect ratio and cover target dimensions
  CONTAIN = 'contain', // Maintain aspect ratio and fit within target dimensions
  STRETCH = 'stretch'  // Stretch to fill target dimensions, may distort image
}

/**
 * Compression options
 */
export interface CompressionOptions {
  /**
   * Quality level for the compressed image
   * @default CompressionQuality.MEDIUM
   */
  quality: CompressionQuality;
  
  /**
   * Format for the compressed image
   * @default CompressionFormat.JPEG
   */
  format: CompressionFormat;
  
  /**
   * Maximum width for the compressed image (in pixels)
   * If not provided, the original width is used
   */
  maxWidth?: number;
  
  /**
   * Maximum height for the compressed image (in pixels)
   * If not provided, the original height is used
   */
  maxHeight?: number;
  
  /**
   * Resize mode to use when resizing the image
   * @default ResizeMode.CONTAIN
   */
  resizeMode: ResizeMode;
  
  /**
   * Whether to preserve metadata (EXIF) in the compressed image
   * @default false
   */
  preserveMetadata: boolean;
}

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  quality: CompressionQuality.MEDIUM,
  format: CompressionFormat.JPEG,
  resizeMode: ResizeMode.CONTAIN,
  preserveMetadata: false
};

/**
 * Compression results
 */
export interface CompressionResult {
  /**
   * URI of the compressed image
   */
  uri: string;
  
  /**
   * Original file size in bytes
   */
  originalSize: number;
  
  /**
   * Compressed file size in bytes
   */
  compressedSize: number;
  
  /**
   * Compression ratio (original size / compressed size)
   */
  compressionRatio: number;
  
  /**
   * Width of the compressed image
   */
  width: number;
  
  /**
   * Height of the compressed image
   */
  height: number;
}

/**
 * ImageCompressionService
 * 
 * Provides image compression and optimization for field photos
 * to reduce storage space and network usage.
 */
export class ImageCompressionService {
  private static instance: ImageCompressionService;
  
  /**
   * Folder for storing compressed images
   */
  private readonly COMPRESSED_IMAGES_FOLDER = `${FileSystem.cacheDirectory}compressed_images/`;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.ensureCompressedImagesFolder();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }
  
  /**
   * Ensure the compressed images folder exists
   */
  private async ensureCompressedImagesFolder(): Promise<void> {
    try {
      const folderInfo = await FileSystem.getInfoAsync(this.COMPRESSED_IMAGES_FOLDER);
      
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.COMPRESSED_IMAGES_FOLDER, {
          intermediates: true
        });
      }
    } catch (error) {
      console.error('Error creating compressed images folder:', error);
    }
  }
  
  /**
   * Compress an image with the specified options
   */
  public async compressImage(
    imageUri: string,
    options: Partial<CompressionOptions> = {}
  ): Promise<CompressionResult> {
    try {
      // Ensure the folder exists
      await this.ensureCompressedImagesFolder();
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri, { size: true });
      if (!fileInfo.exists || !fileInfo.size) {
        throw new Error(`Image file not found: ${imageUri}`);
      }
      
      // Merge options with defaults
      const fullOptions: CompressionOptions = { ...DEFAULT_OPTIONS, ...options };
      
      // Map quality enum to numerical value
      const qualityValue = this.getQualityValue(fullOptions.quality);
      
      // Create manipulation actions
      const actions: ImageManipulator.Action[] = [];
      
      // Add resize action if dimensions are specified
      if (fullOptions.maxWidth || fullOptions.maxHeight) {
        // Get image dimensions
        const { width, height } = await this.getImageDimensions(imageUri);
        
        // Calculate new dimensions
        const newDimensions = this.calculateNewDimensions(
          width,
          height,
          fullOptions.maxWidth,
          fullOptions.maxHeight,
          fullOptions.resizeMode
        );
        
        if (newDimensions.width !== width || newDimensions.height !== height) {
          actions.push({
            resize: {
              width: newDimensions.width,
              height: newDimensions.height,
            },
          });
        }
      }
      
      // Map format enum to string
      const format = this.getFormatValue(fullOptions.format);
      
      // Compress the image
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: qualityValue,
          format,
          base64: false,
          ...(fullOptions.preserveMetadata && Platform.OS === 'ios' ? { preserveMetadata: true } : {})
        }
      );
      
      // Get compressed file info
      const compressedFileInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
      
      // Save compressed image to the compressed images folder
      const fileName = imageUri.split('/').pop() || `image_${Date.now()}.${format.toLowerCase()}`;
      const compressedFileName = `compressed_${fileName}`;
      const compressedFilePath = `${this.COMPRESSED_IMAGES_FOLDER}${compressedFileName}`;
      
      await FileSystem.copyAsync({
        from: result.uri,
        to: compressedFilePath,
      });
      
      // Calculate compression ratio
      const originalSize = fileInfo.size;
      const compressedSize = compressedFileInfo.size || 0;
      const compressionRatio = originalSize / compressedSize;
      
      return {
        uri: compressedFilePath,
        originalSize,
        compressedSize,
        compressionRatio,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }
  
  /**
   * Get the numerical quality value from the enum
   */
  private getQualityValue(quality: CompressionQuality): number {
    switch (quality) {
      case CompressionQuality.LOW:
        return 0.3;
      case CompressionQuality.MEDIUM:
        return 0.6;
      case CompressionQuality.HIGH:
        return 0.8;
      case CompressionQuality.ORIGINAL:
        return 1.0;
      default:
        return 0.6;
    }
  }
  
  /**
   * Get the format value for ImageManipulator
   */
  private getFormatValue(format: CompressionFormat): ImageManipulator.SaveFormat {
    switch (format) {
      case CompressionFormat.JPEG:
        return ImageManipulator.SaveFormat.JPEG;
      case CompressionFormat.PNG:
        return ImageManipulator.SaveFormat.PNG;
      case CompressionFormat.WEBP:
        return Platform.OS === 'android' ? 'webp' as ImageManipulator.SaveFormat : ImageManipulator.SaveFormat.JPEG;
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }
  
  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // No actions
        { base64: false }
      );
      
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      throw error;
    }
  }
  
  /**
   * Calculate new dimensions based on resize mode
   */
  private calculateNewDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth?: number,
    maxHeight?: number,
    resizeMode: ResizeMode = ResizeMode.CONTAIN
  ): { width: number; height: number } {
    // If no max dimensions are provided, return original dimensions
    if (!maxWidth && !maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    // If only one dimension is provided, calculate the other to maintain aspect ratio
    if (!maxWidth) {
      maxWidth = Math.round((maxHeight! * originalWidth) / originalHeight);
    } else if (!maxHeight) {
      maxHeight = Math.round((maxWidth * originalHeight) / originalWidth);
    }
    
    // Calculate new dimensions based on resize mode
    switch (resizeMode) {
      case ResizeMode.COVER:
        // Maintain aspect ratio and cover target dimensions
        const coverRatio = Math.max(maxWidth / originalWidth, maxHeight / originalHeight);
        return {
          width: Math.round(originalWidth * coverRatio),
          height: Math.round(originalHeight * coverRatio),
        };
        
      case ResizeMode.CONTAIN:
        // Maintain aspect ratio and fit within target dimensions
        const containRatio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        return {
          width: Math.round(originalWidth * containRatio),
          height: Math.round(originalHeight * containRatio),
        };
        
      case ResizeMode.STRETCH:
        // Stretch to fill target dimensions
        return {
          width: maxWidth,
          height: maxHeight,
        };
        
      default:
        return { width: originalWidth, height: originalHeight };
    }
  }
  
  /**
   * Batch compress multiple images with the same options
   */
  public async batchCompressImages(
    imageUris: string[],
    options: Partial<CompressionOptions> = {}
  ): Promise<CompressionResult[]> {
    try {
      const results: CompressionResult[] = [];
      
      for (const uri of imageUris) {
        const result = await this.compressImage(uri, options);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error batch compressing images:', error);
      throw error;
    }
  }
  
  /**
   * Get adaptive compression options based on network conditions
   */
  public async getAdaptiveCompressionOptions(): Promise<Partial<CompressionOptions>> {
    try {
      // Get network state
      const networkState = await NetInfo.fetch();
      
      // Default options
      let options: Partial<CompressionOptions> = {
        quality: CompressionQuality.MEDIUM,
        maxWidth: 1920,
        maxHeight: 1080,
      };
      
      // Adjust based on network type and connection quality
      if (networkState.type === 'cellular') {
        if (networkState.details?.cellularGeneration === '2g') {
          // Very low bandwidth
          options = {
            quality: CompressionQuality.LOW,
            maxWidth: 800,
            maxHeight: 600,
          };
        } else if (networkState.details?.cellularGeneration === '3g') {
          // Low bandwidth
          options = {
            quality: CompressionQuality.LOW,
            maxWidth: 1280,
            maxHeight: 720,
          };
        } else if (networkState.details?.cellularGeneration === '4g') {
          // Medium bandwidth
          options = {
            quality: CompressionQuality.MEDIUM,
            maxWidth: 1920,
            maxHeight: 1080,
          };
        } else if (networkState.details?.cellularGeneration === '5g') {
          // High bandwidth
          options = {
            quality: CompressionQuality.HIGH,
            maxWidth: 2560,
            maxHeight: 1440,
          };
        }
      } else if (networkState.type === 'wifi') {
        // Wi-Fi connection
        options = {
          quality: CompressionQuality.HIGH,
          maxWidth: 2560,
          maxHeight: 1440,
        };
      } else if (networkState.type === 'none' || networkState.type === 'unknown') {
        // Offline or unknown
        options = {
          quality: CompressionQuality.HIGH, // store high quality locally
          maxWidth: 2560,
          maxHeight: 1440,
        };
      }
      
      return options;
    } catch (error) {
      console.error('Error getting adaptive compression options:', error);
      
      // Return default options on error
      return {
        quality: CompressionQuality.MEDIUM,
        maxWidth: 1920,
        maxHeight: 1080,
      };
    }
  }
  
  /**
   * Clean up old compressed images to free up space
   */
  public async cleanupCompressedImages(olderThanDays: number = 7): Promise<number> {
    try {
      // Ensure the folder exists
      await this.ensureCompressedImagesFolder();
      
      // Get all files in the compressed images folder
      const files = await FileSystem.readDirectoryAsync(this.COMPRESSED_IMAGES_FOLDER);
      
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let deletedCount = 0;
      
      // Delete files older than the cutoff date
      for (const file of files) {
        const filePath = `${this.COMPRESSED_IMAGES_FOLDER}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < cutoffDate.getTime()) {
          await FileSystem.deleteAsync(filePath);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up compressed images:', error);
      return 0;
    }
  }
}