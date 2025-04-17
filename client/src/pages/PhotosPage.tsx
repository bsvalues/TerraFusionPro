import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppraisal } from '@/contexts/AppraisalContext';
import { Photo, InsertPhoto } from '@shared/schema';

export default function PhotosPage() {
  const { currentReport, photos, createPhoto, updatePhoto, deletePhoto } = useAppraisal();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoType, setPhotoType] = useState('subject_front');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState<{ latitude: number | null, longitude: number | null }>({
    latitude: null,
    longitude: null
  });

  // Option for photo types
  const photoTypes = [
    { value: 'subject_front', label: 'Subject - Front' },
    { value: 'subject_rear', label: 'Subject - Rear' },
    { value: 'subject_street', label: 'Subject - Street Scene' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'living_room', label: 'Living Room' },
    { value: 'bedroom_primary', label: 'Primary Bedroom' },
    { value: 'bathroom_primary', label: 'Primary Bathroom' },
    { value: 'basement', label: 'Basement' },
    { value: 'garage', label: 'Garage' },
    { value: 'view', label: 'View' },
    { value: 'comp1', label: 'Comparable 1' },
    { value: 'comp2', label: 'Comparable 2' },
    { value: 'comp3', label: 'Comparable 3' },
  ];

  // Get geolocation
  const getGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting geolocation:', error);
        alert(`Error getting location: ${error.message}`);
      }
    );
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the file as a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUploadedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    
    // Automatically get geolocation when image is selected
    getGeolocation();
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle capturing a photo (simulated for desktop, would use camera API on mobile)
  const handleCapturePhoto = () => {
    // In a real mobile app, this would use the device camera
    // For now, just trigger the file input
    triggerFileInput();
  };

  // Save the photo
  const handleSavePhoto = async () => {
    if (!currentReport || !uploadedImage) return;

    try {
      const newPhoto: InsertPhoto = {
        reportId: currentReport.id,
        photoType: photoType,
        url: uploadedImage, // In a real app, you'd upload to server/cloud storage
        caption: photoCaption,
        dateTaken: new Date(),
        latitude: position.latitude,
        longitude: position.longitude,
      };

      await createPhoto(newPhoto);
      
      // Reset form
      setUploadedImage(null);
      setPhotoCaption('');
      setPhotoType('subject_front');
      setPosition({ latitude: null, longitude: null });
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  // Format the photo's location for display
  const formatLocation = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return 'No location data';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Find the label for a photo type
  const getPhotoTypeLabel = (type: string) => {
    const photoType = photoTypes.find(pt => pt.value === type);
    return photoType ? photoType.label : type;
  };

  if (!currentReport) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Property Photos</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCapturePhoto}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Photo
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={triggerFileInput}
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Photos
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* Photo gallery */}
        <div className="col-span-2 overflow-auto p-4 bg-neutral-lightest">
          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <Card 
                  key={photo.id} 
                  className={`overflow-hidden cursor-pointer transition-shadow hover:shadow-md ${selectedPhoto?.id === photo.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative aspect-square">
                    <img 
                      src={photo.url} 
                      alt={photo.caption || "Property photo"} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <div className="text-sm font-medium">{getPhotoTypeLabel(photo.photoType)}</div>
                    {photo.caption && (
                      <div className="text-xs mt-1 text-neutral-gray truncate">{photo.caption}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-gray">
              <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No photos added yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={triggerFileInput}
              >
                Upload your first photo
              </Button>
            </div>
          )}
        </div>

        {/* Photo details / upload form */}
        <div className="border-l border-neutral-medium overflow-auto bg-white">
          {uploadedImage ? (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">Upload New Photo</h3>
              
              <div className="mb-4 aspect-square bg-neutral-light relative overflow-hidden rounded-md">
                <img 
                  src={uploadedImage} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo-type">Photo Type</Label>
                  <Select 
                    value={photoType}
                    onValueChange={setPhotoType}
                  >
                    <SelectTrigger id="photo-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {photoTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="photo-caption">Caption</Label>
                  <Textarea 
                    id="photo-caption"
                    placeholder="Enter a caption for this photo"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    className="resize-none"
                  />
                </div>
                
                <div>
                  <Label>Location</Label>
                  <div className="flex">
                    <Input 
                      value={formatLocation(position.latitude, position.longitude)}
                      readOnly
                      className="flex-1 rounded-r-none"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-l-none"
                      onClick={getGeolocation}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setUploadedImage(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSavePhoto}
                  >
                    Save Photo
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedPhoto ? (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Photo Details</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-status-error hover:text-status-error/80 hover:bg-status-error/10"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this photo?')) {
                      deletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }
                  }}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              </div>
              
              <div className="mb-4 aspect-square bg-neutral-light relative overflow-hidden rounded-md">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.caption || "Property photo"} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="detail-photo-type">Photo Type</Label>
                  <Select 
                    value={selectedPhoto.photoType}
                    onValueChange={(value) => updatePhoto(selectedPhoto.id, { photoType: value })}
                  >
                    <SelectTrigger id="detail-photo-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {photoTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="detail-photo-caption">Caption</Label>
                  <Textarea 
                    id="detail-photo-caption"
                    value={selectedPhoto.caption || ''}
                    onChange={(e) => updatePhoto(selectedPhoto.id, { caption: e.target.value })}
                    className="resize-none"
                  />
                </div>
                
                {selectedPhoto.dateTaken && (
                  <div>
                    <Label>Date Taken</Label>
                    <Input 
                      value={new Date(selectedPhoto.dateTaken).toLocaleString()}
                      readOnly
                    />
                  </div>
                )}
                
                {(selectedPhoto.latitude && selectedPhoto.longitude) && (
                  <div>
                    <Label>Location</Label>
                    <div className="flex">
                      <Input 
                        value={formatLocation(Number(selectedPhoto.latitude), Number(selectedPhoto.longitude))}
                        readOnly
                        className="flex-1"
                      />
                    </div>
                    <div className="mt-2 text-xs text-neutral-gray">
                      <a 
                        href={`https://www.google.com/maps?q=${selectedPhoto.latitude},${selectedPhoto.longitude}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-gray p-4">
              <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-center">Select a photo to view its details or upload a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
