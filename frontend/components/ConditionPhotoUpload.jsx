import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  Stack,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import axios from 'axios';
import { useToast } from './Toast';

// Styled components
const UploadPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: '8px',
  borderStyle: 'dashed',
  borderWidth: '2px',
  borderColor: theme.palette.primary.light,
  backgroundColor: theme.palette.background.default,
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const PreviewImage = styled('img')({
  width: '100%',
  maxHeight: '300px',
  objectFit: 'contain',
  borderRadius: '4px'
});

const ConditionScoreChip = styled(Box)(({ theme, score }) => {
  let color;
  if (score >= 4) {
    color = theme.palette.success.main; // Excellent/Good condition
  } else if (score >= 3) {
    color = theme.palette.info.main; // Average condition
  } else if (score >= 2) {
    color = theme.palette.warning.main; // Fair condition
  } else {
    color = theme.palette.error.main; // Poor condition
  }
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
    borderRadius: '16px',
    backgroundColor: color,
    color: theme.palette.getContrastText(color),
    fontWeight: 'bold',
    marginLeft: theme.spacing(1)
  };
});

// Mapping score to condition label
const scoreToCondition = (score) => {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Average';
  if (score >= 1.5) return 'Fair';
  return 'Poor';
};

const ConditionPhotoUpload = ({ onScore }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [conditionScore, setConditionScore] = useState(null);
  const [conditionDetails, setConditionDetails] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  
  const handleFileDrop = (event) => {
    event.preventDefault();
    
    const file = event.dataTransfer?.files[0] || event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', { severity: 'error' });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
    
    // Reset condition score when new image is selected
    setConditionScore(null);
    setConditionDetails(null);
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setConditionScore(null);
    setConditionDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const uploadImage = async () => {
    if (!selectedFile) {
      showToast('Please select an image first', { severity: 'warning' });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create FormData and append file
      const formData = new FormData();
      formData.append('photo', selectedFile);
      
      // Send to backend API
      const response = await axios.post('/api/upload_photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { condition_score, description, features } = response.data;
      
      // Set the condition score and details
      setConditionScore(condition_score);
      setConditionDetails({
        description,
        features
      });
      
      // Call the callback with the score
      if (onScore && typeof onScore === 'function') {
        onScore(condition_score);
      }
      
      // Show success message
      showToast(`Property condition scored as ${scoreToCondition(condition_score)}`, {
        severity: 'success',
        title: 'AI Analysis Complete'
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      showToast('Failed to analyze property condition. Please try again.', {
        severity: 'error',
        title: 'Upload Error'
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <PhotoCameraIcon sx={{ mr: 1 }} />
        AI Property Condition Analysis
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload a photo of the property for automatic condition evaluation.
      </Typography>
      
      {!previewUrl ? (
        <UploadPaper
          elevation={1}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={triggerFileSelect}
        >
          <Box sx={{ p: 3 }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Drag & drop an image here or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: JPG, PNG, WEBP
            </Typography>
          </Box>
          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileDrop}
          />
        </UploadPaper>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <PreviewImage src={previewUrl} alt="Property preview" />
            
            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={clearSelection}
                disabled={isUploading}
              >
                Remove
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                onClick={uploadImage}
                disabled={isUploading}
              >
                {isUploading ? 'Analyzing...' : conditionScore ? 'Re-analyze' : 'Analyze Condition'}
              </Button>
            </Stack>
            
            {conditionScore !== null && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body1" fontWeight="500">
                  Analysis Results:
                  <ConditionScoreChip score={conditionScore}>
                    {scoreToCondition(conditionScore)} ({conditionScore.toFixed(1)}/5)
                  </ConditionScoreChip>
                </Typography>
                
                {conditionDetails && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {conditionDetails.description}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ConditionPhotoUpload;