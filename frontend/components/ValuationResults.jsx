import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Paper,
  styled,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InfoIcon from '@mui/icons-material/Info';
import AdjustIcon from '@mui/icons-material/Adjust';
import ShapVisualization from './ShapVisualization';

// Styled components
const ValueCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'visible',
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
  }
}));

const ConfidenceChip = styled(Chip)(({ theme, confidence }) => {
  let color;
  switch (confidence) {
    case 'high':
      color = theme.palette.success.main;
      break;
    case 'medium':
      color = theme.palette.warning.main;
      break;
    case 'low':
    default:
      color = theme.palette.error.main;
      break;
  }
  return {
    backgroundColor: color,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    position: 'absolute',
    top: '-12px',
    right: '20px',
  };
});

const AdjustmentCard = styled(Paper)(({ theme, positive }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderLeft: `4px solid ${positive ? theme.palette.success.main : theme.palette.error.main}`,
  backgroundColor: positive ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateX(5px)'
  }
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
  '& svg': {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  }
}));

const formatCurrency = (value) => {
  if (!value && value !== 0) return 'N/A';
  
  // If it's already a string with a dollar sign, return it
  if (typeof value === 'string' && value.includes('$')) {
    return value;
  }
  
  // Otherwise format as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const ValuationResults = ({ valuationResult, propertyDetails, shapData }) => {
  const theme = useTheme();
  
  if (!valuationResult) {
    return null;
  }
  
  const {
    estimatedValue,
    confidenceLevel,
    valueRange,
    adjustments = [],
    marketAnalysis,
    comparableAnalysis,
    valuationMethodology,
    propertyAnalysis,
    appraisalSummary
  } = valuationResult;
  
  // Format the estimated value
  const formattedEstimatedValue = formatCurrency(estimatedValue);
  
  // Format value range
  const formattedMinValue = valueRange?.min ? formatCurrency(valueRange.min) : 'N/A';
  const formattedMaxValue = valueRange?.max ? formatCurrency(valueRange.max) : 'N/A';
  const valueRangeText = `${formattedMinValue} - ${formattedMaxValue}`;
  
  // Property details to display
  const displayAddress = propertyDetails?.address
    ? `${propertyDetails.address}, ${propertyDetails.city}, ${propertyDetails.state} ${propertyDetails.zipCode}`
    : 'Address not provided';
    
  return (
    <>
      <ValueCard elevation={3}>
        <ConfidenceChip 
          label={`${confidenceLevel.toUpperCase()} CONFIDENCE`} 
          confidence={confidenceLevel}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Estimated Value
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              {formattedEstimatedValue}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
              Value Range: {valueRangeText}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1">{displayAddress}</Typography>
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {propertyDetails?.propertyType && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Type</Typography>
                <Typography variant="body1">{propertyDetails.propertyType}</Typography>
              </Grid>
            )}
            
            {propertyDetails?.bedrooms && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Bedrooms</Typography>
                <Typography variant="body1">{propertyDetails.bedrooms}</Typography>
              </Grid>
            )}
            
            {propertyDetails?.bathrooms && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Bathrooms</Typography>
                <Typography variant="body1">{propertyDetails.bathrooms}</Typography>
              </Grid>
            )}
            
            {propertyDetails?.squareFeet && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Square Feet</Typography>
                <Typography variant="body1">{propertyDetails.squareFeet}</Typography>
              </Grid>
            )}
            
            {propertyDetails?.yearBuilt && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Year Built</Typography>
                <Typography variant="body1">{propertyDetails.yearBuilt}</Typography>
              </Grid>
            )}
            
            {propertyDetails?.condition && (
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="textSecondary">Condition</Typography>
                <Typography variant="body1">{propertyDetails.condition}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </ValueCard>
      
      {/* SHAP Visualization */}
      {shapData && <ShapVisualization shapValues={shapData.shapValues} baseValue={shapData.baseValue} />}
      
      {/* Adjustments */}
      {adjustments && adjustments.length > 0 && (
        <Section>
          <SectionTitle variant="h6">
            <AdjustIcon />
            Value Adjustments
          </SectionTitle>
          
          {adjustments.map((adjustment, index) => (
            <AdjustmentCard 
              key={index} 
              elevation={1} 
              positive={adjustment.amount >= 0}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {adjustment.factor}
                </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: adjustment.amount >= 0 ? theme.palette.success.main : theme.palette.error.main
                  }}
                >
                  {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>{adjustment.description}</Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                {adjustment.reasoning}
              </Typography>
            </AdjustmentCard>
          ))}
        </Section>
      )}
      
      {/* Analysis Sections */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Market Analysis</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {marketAnalysis || 'Market analysis not available.'}
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CompareArrowsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Comparable Properties</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {comparableAnalysis || 'Comparable property analysis not available.'}
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      {propertyAnalysis && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HomeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">Property Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {propertyAnalysis}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
      
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">Valuation Methodology</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {valuationMethodology || 'Valuation methodology information not available.'}
          </Typography>
        </AccordionDetails>
      </Accordion>
      
      {appraisalSummary && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AttachMoneyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              <Typography variant="h6">Appraisal Summary</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {appraisalSummary}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </>
  );
};

export default ValuationResults;