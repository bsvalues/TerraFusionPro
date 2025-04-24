import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createPhotoSyncManager, PhotoSyncManager, PhotoMetadata } from '../../../packages/crdt/src/photo-sync';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image as ImageIcon, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react';

// Test report ID - in a real app, this would come from the route or context
const TEST_REPORT_ID = 1;

export default function PhotoSyncTestPage() {
  const [photoManager, setPhotoManager] = useState<PhotoSyncManager | null>(null);
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<string>('property');
  const [caption, setCaption] = useState<string>('');

  // Initialize photo sync manager
  useEffect(() => {
    const manager = createPhotoSyncManager(TEST_REPORT_ID);
    
    // Subscribe to photo updates
    const unsubscribe = manager.subscribe((updatedPhotos) => {
      setPhotos(updatedPhotos);
      setIsLoading(false);
    });
    
    setPhotoManager(manager);
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Add a new photo to the sync manager
  const handleAddPhoto = async () => {
    if (!photoManager || !selectedFile) return;
    
    try {
      // Create a local URL for the selected file
      const objectUrl = URL.createObjectURL(selectedFile);
      
      // Add the photo to the CRDT sync manager
      photoManager.addPhoto({
        originalUrl: objectUrl,
        photoType,
        caption,
        dateTaken: new Date(),
        latitude: '0',
        longitude: '0',
        enhancementOptions: {
          enhanceQuality: true,
          fixLighting: true
        }
      });
      
      toast({
        title: 'Photo added',
        description: 'The photo has been added to your offline storage',
      });
      
      // Reset form
      setSelectedFile(null);
      setCaption('');
      
      // If online, attempt to sync with server
      if (isOnline) {
        await photoManager.syncWithServer();
      }
    } catch (error) {
      console.error('Error adding photo:', error);
      toast({
        title: 'Error adding photo',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Manually trigger sync with server
  const handleSync = async () => {
    if (!photoManager) return;
    
    try {
      setIsLoading(true);
      await photoManager.syncWithServer();
      toast({
        title: 'Sync complete',
        description: 'Photos have been synchronized with the server',
      });
    } catch (error) {
      console.error('Error syncing photos:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a photo
  const handleDeletePhoto = (id: string) => {
    if (!photoManager) return;
    
    try {
      photoManager.deletePhoto(id);
      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed',
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error deleting photo',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Import photos from server
  const handleImport = async () => {
    if (!photoManager) return;
    
    try {
      setIsLoading(true);
      await photoManager.importFromServer();
      toast({
        title: 'Import complete',
        description: 'Photos have been imported from the server',
      });
    } catch (error) {
      console.error('Error importing photos:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Photo Sync Test</h1>
          <p className="text-muted-foreground">
            Test offline-first photo synchronization using CRDT
          </p>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? <Wifi className="mr-1 h-4 w-4" /> : <WifiOff className="mr-1 h-4 w-4" />}
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Photo</CardTitle>
          <CardDescription>
            Add a photo to be synchronized when online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="file">Select Photo</Label>
              <Input 
                id="file" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="photoType">Photo Type</Label>
              <Input 
                id="photoType" 
                value={photoType} 
                onChange={(e) => setPhotoType(e.target.value)} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input 
                id="caption" 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)} 
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => { setSelectedFile(null); setCaption(''); }}>
            Reset
          </Button>
          <Button onClick={handleAddPhoto} disabled={!selectedFile}>
            <Upload className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </CardFooter>
      </Card>
      
      <div className="flex flex-row gap-2 justify-end">
        <Button variant="outline" onClick={handleImport} disabled={!isOnline}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Import from Server
        </Button>
        <Button onClick={handleSync} disabled={!isOnline}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync with Server
        </Button>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Photo Collection</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No photos added yet. Add a photo above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {photo.enhancedUrl || photo.originalUrl ? (
                    <img 
                      src={photo.enhancedUrl || photo.originalUrl} 
                      alt={photo.caption || 'Property photo'} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{photo.photoType}</CardTitle>
                    <Badge variant={photo.syncStatus === 'synced' ? 'outline' : 'secondary'}>
                      {photo.syncStatus}
                    </Badge>
                  </div>
                  <CardDescription>{photo.caption || 'No caption'}</CardDescription>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    {new Date(photo.createdAt).toLocaleString()}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Offline-First Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Add photos while online to see them sync automatically</li>
          <li>Disable your network connection (toggle the browser offline mode)</li>
          <li>Add more photos while offline</li>
          <li>Re-enable your network and click "Sync with Server" to upload offline changes</li>
          <li>Use "Import from Server" to fetch any photos added from other devices</li>
        </ol>
      </div>
    </div>
  );
}