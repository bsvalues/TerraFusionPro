import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, RefreshCw, Wifi, WifiOff, Check, AlertTriangle, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Initialize Yjs document for photos
const ydoc = new Y.Doc();
const photoSyncMap = ydoc.getMap('photoSync');

// Persist document to IndexedDB
const persistence = new IndexeddbPersistence('terrafield-photo-sync', ydoc);

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
  serverId?: number;
}

export default function PhotoSyncTestPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportId, setReportId] = useState(1); // Default to report ID 1
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingPhotos, setPendingPhotos] = useState<PhotoMetadata[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoType, setPhotoType] = useState('property');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingPhotos();
      toast({
        title: "You're back online!",
        description: "Syncing pending photos...",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Photos will be synced when you reconnect.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load pending photos from Yjs
  useEffect(() => {
    persistence.on('synced', () => {
      console.log('IndexedDB synced');
      loadPendingPhotos();
    });

    // Listen for changes to the Yjs document
    photoSyncMap.observe(loadPendingPhotos);

    return () => {
      photoSyncMap.unobserve(loadPendingPhotos);
    };
  }, []);

  // Load photos for the current report
  const { data: reportPhotos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['/api/photos', reportId],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/sync/reports/${reportId}/photos`, { 
          method: 'GET'
        });
        return response;
      } catch (error) {
        console.error('Error fetching photos:', error);
        return { photos: [] };
      }
    },
    enabled: isOnline,
  });

  const syncMutation = useMutation({
    mutationFn: async (photo: PhotoMetadata) => {
      return await apiRequest('/api/sync/photo-sync', { 
        method: 'POST',
        data: photo
      });
    },
    onSuccess: (data, variables) => {
      // Update the local photo status
      if (data.success) {
        // Remove from pending queue
        removePhotoFromPending(variables.id);
        
        // Invalidate photos query
        queryClient.invalidateQueries({queryKey: ['/api/photos', reportId]});
        
        toast({
          title: "Photo synced successfully",
          description: `Photo ${variables.id.substring(0, 8)} has been synced to the server.`,
          variant: "default",
        });
      }
    },
    onError: (error, variables) => {
      console.error('Error syncing photo:', error);
      
      // Update photo status in Yjs
      const photo = photoSyncMap.get(variables.id) as PhotoMetadata;
      if (photo) {
        photo.syncStatus = 'failed';
        photo.syncError = error instanceof Error ? error.message : 'Unknown error';
        photoSyncMap.set(variables.id, photo);
      }
      
      toast({
        title: "Failed to sync photo",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a photo to the local storage and queue for sync
  const addPhoto = async () => {
    if (!selectedFile) {
      toast({
        title: "No photo selected",
        description: "Please select a photo to add",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a unique ID for this photo
      const photoId = uuidv4();
      
      // Create a data URL from the file for local storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        
        // Create photo metadata with sync status
        const newPhoto: PhotoMetadata = {
          id: photoId,
          reportId,
          originalUrl: dataUrl,
          photoType,
          caption: photoCaption,
          dateTaken: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          pendingSync: true,
          syncStatus: 'pending',
        };
        
        // Store in Yjs
        photoSyncMap.set(photoId, newPhoto);
        
        // Try to sync immediately if online
        if (isOnline) {
          syncMutation.mutate(newPhoto);
        }
        
        // Reset form
        setPhotoCaption('');
        setSelectedFile(null);
        setPreviewUrl(null);
        
        toast({
          title: "Photo added",
          description: isOnline 
            ? "Photo is being synced to the server" 
            : "Photo saved locally and will sync when you're online",
          variant: "default",
        });
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error adding photo:', error);
      toast({
        title: "Failed to add photo",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    }
  };

  // Load pending photos from Yjs
  const loadPendingPhotos = () => {
    const photos: PhotoMetadata[] = [];
    
    // Get all photos from Yjs map
    photoSyncMap.forEach((value, key) => {
      photos.push(value as PhotoMetadata);
    });
    
    // Sort by creation date, newest first
    photos.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setPendingPhotos(photos);
  };

  // Remove a photo from the pending queue
  const removePhotoFromPending = (photoId: string) => {
    photoSyncMap.delete(photoId);
  };

  // Sync all pending photos
  const syncPendingPhotos = () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Cannot sync photos while offline",
        variant: "destructive",
      });
      return;
    }

    // Find photos that need syncing
    const photosToSync = pendingPhotos.filter(p => 
      p.syncStatus === 'pending' || p.syncStatus === 'failed'
    );
    
    if (photosToSync.length === 0) {
      toast({
        title: "Nothing to sync",
        description: "All photos are already synced",
        variant: "default",
      });
      return;
    }

    // Sync each photo
    photosToSync.forEach(photo => {
      // Update status in Yjs
      const updatedPhoto: PhotoMetadata = { 
        ...photo, 
        syncStatus: 'pending' as const 
      };
      photoSyncMap.set(photo.id, updatedPhoto);
      
      // Trigger sync
      syncMutation.mutate(updatedPhoto);
    });

    toast({
      title: "Syncing photos",
      description: `Attempting to sync ${photosToSync.length} photos`,
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">TerraField Photo Sync Test</h1>
          <p className="text-muted-foreground">
            Test the offline-first photo synchronization using CRDT
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Add Photo Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Photo</CardTitle>
          <CardDescription>
            Add a photo to be synchronized with the server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="report-id">Report ID</Label>
                <Input
                  id="report-id"
                  type="number"
                  value={reportId}
                  onChange={(e) => setReportId(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="photo-type">Photo Type</Label>
                <Select value={photoType} onValueChange={setPhotoType}>
                  <SelectTrigger id="photo-type" className="mt-1">
                    <SelectValue placeholder="Select photo type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="photo-caption">Caption</Label>
                <Textarea
                  id="photo-caption"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="mt-1"
                  placeholder="Enter a caption for the photo"
                />
              </div>
              <div>
                <Label htmlFor="photo-file">Select Photo</Label>
                <Input
                  id="photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              {previewUrl ? (
                <div className="relative w-full">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-md max-h-64 max-w-full object-contain mx-auto"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-md p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a photo to preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setPhotoCaption('');
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
          >
            Reset
          </Button>
          <Button onClick={addPhoto} disabled={!selectedFile}>
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Photo'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Pending Photos */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending Photos</CardTitle>
            <CardDescription>
              Photos waiting to be synchronized with the server
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={syncPendingPhotos}
            disabled={!isOnline || pendingPhotos.length === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Now
          </Button>
        </CardHeader>
        <CardContent>
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending photos to sync
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-video w-full relative">
                    <img
                      src={photo.originalUrl}
                      alt={photo.caption || 'Photo'}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      {photo.syncStatus === 'synced' ? (
                        <Badge className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Synced
                        </Badge>
                      ) : photo.syncStatus === 'failed' ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium line-clamp-1">
                      {photo.caption || 'No caption'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {photo.photoType} • ID: {photo.id.substring(0, 8)}
                      {photo.serverId && ` • Server ID: ${photo.serverId}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synced Photos from Server */}
      <Card>
        <CardHeader>
          <CardTitle>Server Photos</CardTitle>
          <CardDescription>
            Photos retrieved from the server for Report ID: {reportId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOnline ? (
            <div className="text-center py-8 text-muted-foreground">
              <WifiOff className="mx-auto h-8 w-8 mb-2" />
              You're offline. Cannot fetch server photos.
            </div>
          ) : isLoadingPhotos ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              <p className="mt-2 text-muted-foreground">Loading photos...</p>
            </div>
          ) : reportPhotos?.photos?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportPhotos.photos.map((photo: any) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-video w-full">
                    <img
                      src={photo.url.startsWith('data:') ? photo.url : photo.url.startsWith('http') ? photo.url : `${window.location.origin}${photo.url}`}
                      alt={photo.caption || 'Photo'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium line-clamp-1">
                      {photo.caption || 'No caption'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {photo.photoType} • ID: {photo.id}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No photos found for this report
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}