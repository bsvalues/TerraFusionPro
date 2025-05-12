import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Info,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Building,
  Map
} from 'lucide-react';

// Interfaces matching the AI valuation response
interface Adjustment {
  factor: string;
  description: string;
  amount: number;
  reasoning: string;
}

interface AIValuationResponse {
  estimatedValue: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  valueRange: {
    min: number;
    max: number;
  };
  adjustments: Adjustment[];
  marketAnalysis: string;
  valuationMethodology: string;
  modelVersion?: string;
  timestamp?: string;
}

interface SimplifiedValuationExplainerProps {
  valuation: AIValuationResponse;
  onEdit?: (adjustment: Adjustment) => void;
  onAccept?: () => void;
  onReject?: () => void;
}

/**
 * SimplifiedValuationExplainer Component
 * 
 * Presents a simplified, appraiser-friendly explanation of the AI valuation
 * results with practical guidance on how to interpret and use the results
 * in an appraisal context.
 */
export function SimplifiedValuationExplainer({ 
  valuation, 
  onEdit, 
  onAccept, 
  onReject 
}: SimplifiedValuationExplainerProps) {
  
  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Helper for confidence level explanation
  const getConfidenceDetails = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          message: 'Strong confidence based on high-quality data and comparable properties',
          recommendation: 'This valuation can be relied upon with minimal additional verification',
        };
      case 'medium':
        return {
          icon: <Scale className="h-5 w-5 text-amber-500" />,
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
          message: 'Moderate confidence based on adequate data with some gaps',
          recommendation: 'Validate key factors and check comparables for accuracy',
        };
      case 'low':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          message: 'Limited confidence due to data limitations or unique property characteristics',
          recommendation: 'Use caution and perform additional research before relying on this valuation',
        };
    }
  };
  
  const confidenceDetails = getConfidenceDetails(valuation.confidenceLevel);
  
  return (
    <div className="space-y-6">
      {/* Main valuation card with simplified presentation */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl flex items-center">
            AI-Assisted Valuation
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>This valuation is based on AI analysis of property data, market conditions, and comparable sales. 
                  It should be used as a supporting tool for your professional judgment.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Generated {valuation.timestamp ? new Date(valuation.timestamp).toLocaleString() : 'recently'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-1">
          <div className="flex flex-col space-y-4">
            {/* Estimated Value Section */}
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Estimated Value</div>
                  <div className="text-3xl font-bold">{formatCurrency(valuation.estimatedValue)}</div>
                  <div className="text-sm mt-1">
                    Range: {formatCurrency(valuation.valueRange.min)} - {formatCurrency(valuation.valueRange.max)}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="mr-3">
                    {confidenceDetails.icon}
                  </div>
                  <div>
                    <Badge className={confidenceDetails.color}>
                      {valuation.confidenceLevel.toUpperCase()} CONFIDENCE
                    </Badge>
                    <div className="text-sm mt-1">{confidenceDetails.message}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm p-2 bg-muted rounded-md">
                <div className="font-medium mb-1">Appraiser Recommendation:</div>
                <div>{confidenceDetails.recommendation}</div>
              </div>
            </div>
            
            {/* Key Value Drivers */}
            <div>
              <h3 className="text-sm font-medium mb-2">Key Value Drivers</h3>
              <div className="space-y-2">
                {valuation.adjustments
                  .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
                  .slice(0, 3)
                  .map((adjustment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        {adjustment.amount > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>{adjustment.factor}</span>
                      </div>
                      <div className={adjustment.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {adjustment.amount > 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 flex justify-between">
          {onReject && (
            <Button variant="outline" onClick={onReject}>
              Request Manual Review
            </Button>
          )}
          {onAccept && (
            <Button onClick={onAccept}>
              <ThumbsUp className="mr-2 h-4 w-4" /> 
              Accept Valuation
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Detailed explanation accordion for clarity */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="adjustment-details">
          <AccordionTrigger className="text-base">
            <div className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Property Adjustments Explained
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-2">
              <p className="text-sm text-muted-foreground">
                Below are the specific property characteristics that influenced this valuation.
                Each adjustment represents the estimated impact on value.
              </p>
              
              <div className="space-y-2">
                {valuation.adjustments.map((adjustment, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{adjustment.factor}</span>
                      <span className={adjustment.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {adjustment.amount > 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                      </span>
                    </div>
                    <p className="text-sm">{adjustment.reasoning}</p>
                    
                    {onEdit && (
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(adjustment)}
                        >
                          Adjust
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="market-analysis">
          <AccordionTrigger className="text-base">
            <div className="flex items-center">
              <Map className="mr-2 h-5 w-5" />
              Market Analysis Summary
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 border rounded-md">
              <p className="whitespace-pre-line">{valuation.marketAnalysis}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="methodology">
          <AccordionTrigger className="text-base">
            <div className="flex items-center">
              <Info className="mr-2 h-5 w-5" />
              Valuation Methodology
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 border rounded-md">
              <p className="whitespace-pre-line">{valuation.valuationMethodology}</p>
              
              {valuation.modelVersion && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  <span>Model version: {valuation.modelVersion}</span>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default SimplifiedValuationExplainer;