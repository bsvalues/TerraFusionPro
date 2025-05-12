import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  HelpCircle,
  Camera,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

// Define interfaces for the component
interface ConditionFeature {
  name: string;
  score: number;
  notes: string;
}

interface ConditionAnalysisResult {
  overallScore: number;
  conditionCategory: string;
  description: string;
  features: ConditionFeature[];
  imageUrl: string;
  confidence: number;
  modelVersion: string;
  fallbackUsed: boolean;
}

interface PropertyConditionDisplayProps {
  conditionData: ConditionAnalysisResult;
  onApprove?: () => void;
  onCorrect?: (newScore: number) => void;
  showImagePreview?: boolean;
}

/**
 * PropertyConditionDisplay Component
 * 
 * Presents property condition assessment results from AI analysis
 * in a clear, appraiser-friendly format with interpretations and 
 * guidance on how to use the information in appraisals.
 */
export function PropertyConditionDisplay({ 
  conditionData, 
  onApprove, 
  onCorrect,
  showImagePreview = true 
}: PropertyConditionDisplayProps) {
  
  // Helper function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 3.5) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    if (score >= 2.5) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    if (score >= 1.5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };
  
  // Helper function to get a human-readable interpretation
  const getConditionInterpretation = (score: number) => {
    if (score >= 4.5) return 'The property appears to be in excellent condition with high-quality finishes and no visible defects.';
    if (score >= 3.5) return 'The property appears to be in good condition with minor wear and tear typical for its age.';
    if (score >= 2.5) return 'The property appears to be in average condition with some updating or repairs needed.';
    if (score >= 1.5) return 'The property appears to be in fair condition with noticeable deferred maintenance.';
    return 'The property appears to be in poor condition with significant repairs needed.';
  };
  
  // Helper function to get an appraiser recommendation
  const getAppraiserRecommendation = (score: number) => {
    if (score >= 4.5) return 'Consider using this condition rating with minimal additional verification.';
    if (score >= 3.5) return 'Verify this rating with careful review of all major components.';
    if (score >= 2.5) return 'Examine specific components noted below for possible rating adjustments.';
    if (score >= 1.5) return 'Check for additional issues not captured in photos; consider adjustment needs.';
    return 'Detailed inspection recommended; automated score may not capture all issues.';
  };
  
  return (
    <Card className="w-full border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              Property Condition Assessment
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2 h-6 w-6">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>This assessment is based on AI analysis of property photos. 
                    The condition score ranges from 1.0 (Poor) to 5.0 (Excellent) 
                    and should be used to support your professional judgment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Generated using {conditionData.fallbackUsed ? 'alternative analysis' : 'AI condition model v' + conditionData.modelVersion}
            </CardDescription>
          </div>
          <div>
            <Badge 
              variant="outline"
              className={getScoreColor(conditionData.overallScore)}
            >
              {conditionData.conditionCategory.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main condition score */}
        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Overall Condition Score</div>
            <div className="text-3xl font-bold">{conditionData.overallScore.toFixed(1)}/5.0</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Confidence</div>
            <div className="flex items-center">
              <Progress value={conditionData.confidence * 100} className="w-24 h-2 mr-2" />
              <span>{Math.round(conditionData.confidence * 100)}%</span>
            </div>
          </div>
        </div>
        
        {/* Warning for fallback */}
        {conditionData.fallbackUsed && (
          <div className="flex items-start p-3 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-950 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800 dark:text-amber-300">Alternative Analysis Used</div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                The main AI model wasn't available, so we used a simpler analysis method.
                Consider this score as a starting point and verify with your own assessment.
              </p>
            </div>
          </div>
        )}
        
        {/* Image preview if enabled */}
        {showImagePreview && (
          <div className="border rounded-lg overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-muted flex items-center justify-center">
              {conditionData.imageUrl ? (
                <img 
                  src={conditionData.imageUrl} 
                  alt="Property condition analysis" 
                  className="object-cover w-full h-full" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2">No image available</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Interpretation and recommendation */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="font-medium">Professional Interpretation:</div>
            <p className="text-sm">{getConditionInterpretation(conditionData.overallScore)}</p>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Appraiser Recommendation:</div>
            <p className="text-sm">{getAppraiserRecommendation(conditionData.overallScore)}</p>
          </div>
        </div>
        
        {/* Feature breakdown */}
        <div>
          <div className="font-medium mb-2">Component Breakdown:</div>
          <div className="space-y-2">
            {conditionData.features.map((feature, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                <div>
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-muted-foreground">{feature.notes}</div>
                </div>
                <Badge 
                  variant="outline"
                  className={getScoreColor(feature.score)}
                >
                  {feature.score.toFixed(1)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      {(onApprove || onCorrect) && (
        <CardFooter className="border-t p-4 flex justify-between">
          {onCorrect && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCorrect(Math.max(1.0, conditionData.overallScore - 0.5))}
              >
                <ThumbsDown className="h-4 w-4 mr-1" /> Lower
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCorrect(Math.min(5.0, conditionData.overallScore + 0.5))}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> Raise
              </Button>
            </div>
          )}
          
          {onApprove && (
            <Button onClick={onApprove}>
              Accept Assessment
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default PropertyConditionDisplay;