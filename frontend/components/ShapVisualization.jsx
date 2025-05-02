import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Slider,
  styled,
  useTheme
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Custom styled components
const FeatureBar = styled(Box)(({ theme, value, baseline, color }) => {
  const isPositive = value >= baseline;
  const barWidth = Math.min(Math.abs(value - baseline) * 100, 100);
  
  return {
    position: 'relative',
    height: 28,
    width: '100%',
    backgroundColor: theme.palette.grey[200],
    borderRadius: 4,
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      [isPositive ? 'left' : 'right']: '50%',
      width: `${barWidth}%`,
      height: '100%',
      backgroundColor: color || (isPositive ? theme.palette.success.light : theme.palette.error.light),
      transition: 'width 0.5s ease',
    }
  };
});

const FeatureLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const FeatureValue = styled(Typography)(({ theme, isPositive }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  [isPositive ? 'right' : 'left']: theme.spacing(1),
  fontSize: '0.75rem',
  fontWeight: 'bold',
  color: theme.palette.common.white,
  zIndex: 1,
  textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)',
}));

const FeatureBaseline = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 2,
  height: '100%',
  backgroundColor: theme.palette.grey[500],
  zIndex: 0,
}));

const FeatureImpact = styled(Box)(({ theme, isPositive }) => ({
  display: 'flex',
  alignItems: 'center',
  marginLeft: theme.spacing(1),
  color: isPositive ? theme.palette.success.main : theme.palette.error.main,
  fontWeight: 'bold',
  fontSize: '0.75rem',
}));

// Main SHAP Visualization Component
const ShapVisualization = ({ shapValues, baseValue }) => {
  const theme = useTheme();
  const [threshold, setThreshold] = useState(0);
  
  // If no SHAP values provided, return placeholder
  if (!shapValues || shapValues.length === 0) {
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PriorityHighIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
            SHAP Feature Impact Not Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Feature importance data is not available for this valuation.
            This could be due to the model type used or incomplete property data.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Sort SHAP values by absolute magnitude
  const sortedShapValues = [...shapValues].sort((a, b) => 
    Math.abs(b.impact) - Math.abs(a.impact)
  );
  
  // Filter by threshold if needed
  const filteredShapValues = sortedShapValues.filter(
    feature => Math.abs(feature.impact) > threshold
  );
  
  // Calculate the normalized position for display (0-1 scale)
  const normalizeValue = (value) => {
    const maxImpact = Math.max(
      ...shapValues.map(f => Math.abs(f.impact))
    );
    return 0.5 + (value / (maxImpact * 2));
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Feature Impact Analysis (SHAP)
          </Typography>
          <Tooltip title="SHAP (SHapley Additive exPlanations) values show how each feature contributes to the property's estimated value. Positive values (green) increase the valuation, while negative values (red) decrease it.">
            <InfoIcon sx={{ ml: 1, color: theme.palette.info.main, cursor: 'pointer' }} />
          </Tooltip>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Base Value: ${Math.round(baseValue || 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" mb={2}>
            This is the average predicted value, before considering this property's specific features.
          </Typography>
          
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" gutterBottom>
              Impact Threshold: ${Math.round(threshold).toLocaleString()}
            </Typography>
            <Slider
              value={threshold}
              onChange={(e, newValue) => setThreshold(newValue)}
              min={0}
              max={Math.max(...shapValues.map(f => Math.abs(f.impact)), 5000)}
              step={1000}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `$${value.toLocaleString()}`}
              sx={{ mb: 2 }}
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          {filteredShapValues.map((feature, index) => {
            const isPositive = feature.impact > 0;
            const normalizedValue = normalizeValue(feature.impact);
            
            return (
              <Box key={index} sx={{ mb: 2 }}>
                <FeatureLabel>
                  {feature.name}
                  <FeatureImpact isPositive={isPositive}>
                    {isPositive ? <AddIcon fontSize="small" /> : <RemoveIcon fontSize="small" />}
                    ${Math.abs(Math.round(feature.impact)).toLocaleString()}
                  </FeatureImpact>
                </FeatureLabel>
                
                <Box sx={{ position: 'relative', height: 28 }}>
                  <FeatureBar 
                    value={normalizedValue} 
                    baseline={0.5}
                    color={isPositive ? theme.palette.success.light : theme.palette.error.light}
                  />
                  <FeatureBaseline />
                  <FeatureValue isPositive={isPositive}>
                    {feature.value} 
                  </FeatureValue>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {feature.explanation}
                </Typography>
              </Box>
            );
          })}
        </Box>
        
        {filteredShapValues.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
            No features meet the current impact threshold. Try lowering the threshold.
          </Typography>
        )}
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          This explanation shows how the property's specific features changed its value from the average. 
          Features pushing to the right (green) increase value, while those pushing to the left (red) decrease it.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ShapVisualization;