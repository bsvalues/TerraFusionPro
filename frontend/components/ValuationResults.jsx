import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Grid, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// Helper function to format currency
function formatCurrency(value) {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

// Helper to determine color based on confidence level
function getConfidenceColor(confidenceLevel) {
  switch(confidenceLevel) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'error';
    default:
      return 'info';
  }
}

// Helper to get percentage for confidence level
function getConfidencePercentage(confidenceLevel) {
  switch(confidenceLevel) {
    case 'high':
      return 90;
    case 'medium':
      return 60;
    case 'low':
      return 30;
    default:
      return 50;
  }
}

const ValuationResults = ({ valuationResult }) => {
  const theme = useTheme();
  
  if (!valuationResult) return null;
  
  // Extract data from valuationResult
  const {
    estimatedValue,
    confidenceLevel,
    valueRange,
    adjustments = [],
    marketAnalysis,
    comparableAnalysis,
    valuationMethodology,
    appraisalSummary
  } = valuationResult;

  const formattedEstimatedValue = typeof estimatedValue === 'number' 
    ? formatCurrency(estimatedValue)
    : estimatedValue;
    
  const formattedMinValue = valueRange && typeof valueRange.min === 'number'
    ? formatCurrency(valueRange.min)
    : valueRange ? valueRange.min : '';
    
  const formattedMaxValue = valueRange && typeof valueRange.max === 'number'
    ? formatCurrency(valueRange.max)
    : valueRange ? valueRange.max : '';

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <HomeIcon fontSize="large" sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4" component="h2">
            Property Valuation Results
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Main valuation display */}
        <Box 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: theme.palette.background.default,
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Estimated Property Value
              </Typography>
              <Typography 
                variant="h3" 
                component="p" 
                color="primary" 
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <AttachMoneyIcon sx={{ mr: 1, opacity: 0.7 }} />
                {formattedEstimatedValue}
              </Typography>
              
              {valueRange && (
                <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                  Valuation Range: {formattedMinValue} - {formattedMaxValue}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Confidence Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip 
                  label={confidenceLevel?.toUpperCase() || 'UNKNOWN'} 
                  color={getConfidenceColor(confidenceLevel)}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  {confidenceLevel === 'high' 
                    ? 'Strong supporting data' 
                    : confidenceLevel === 'medium'
                      ? 'Moderate supporting data'
                      : 'Limited supporting data'}
                </Typography>
              </Box>
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={getConfidencePercentage(confidenceLevel)} 
                  color={getConfidenceColor(confidenceLevel)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Market Analysis */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="market-analysis-content"
            id="market-analysis-header"
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
              <Typography variant="h6">Market Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              {marketAnalysis || 'No market analysis available.'}
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        {/* Comparable Analysis */}
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="comparable-analysis-content"
            id="comparable-analysis-header"
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CompareArrowsIcon sx={{ mr: 1, color: theme.palette.info.main }} />
              <Typography variant="h6">Comparable Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              {comparableAnalysis || 'No comparable analysis available.'}
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        {/* Value Adjustments */}
        {adjustments && adjustments.length > 0 && (
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="adjustments-content"
              id="adjustments-header"
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingDownIcon sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="h6">Value Adjustments</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Factor</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Reasoning</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adjustments.map((adj, index) => (
                      <TableRow key={index}>
                        <TableCell>{adj.factor}</TableCell>
                        <TableCell>{adj.description}</TableCell>
                        <TableCell align="right">
                          {typeof adj.amount === 'number' 
                            ? formatCurrency(adj.amount) 
                            : adj.amount}
                        </TableCell>
                        <TableCell>{adj.reasoning}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Methodology */}
        {valuationMethodology && (
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="methodology-content"
              id="methodology-header"
            >
              <Typography variant="h6">Valuation Methodology</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                {valuationMethodology}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Summary */}
        {appraisalSummary && (
          <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Appraisal Summary
            </Typography>
            <Typography variant="body1">
              {appraisalSummary}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ValuationResults;