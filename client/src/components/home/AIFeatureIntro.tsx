import React from 'react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BrainCircuit,
  Camera,
  BarChart,
  ArrowRight,
  Lightbulb,
  Zap,
} from 'lucide-react';

/**
 * AIFeatureIntro Component
 * 
 * A component for the home page that introduces the AI features of the
 * TerraFusion platform in a way that's accessible to appraisers without
 * technical backgrounds.
 */
export function AIFeatureIntro() {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
              AI-Powered Appraisal Tools
            </CardTitle>
            <CardDescription>
              Enhance your appraisal workflow with intelligent assistance
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation('/onboarding')}
            className="whitespace-nowrap"
          >
            <Lightbulb className="mr-2 h-4 w-4" /> 
            Interactive Guide
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Camera className="mr-2 h-4 w-4 text-blue-500" />
                Property Condition Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Automatically assess property condition from photos with detailed component breakdowns
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-0 h-auto" 
                onClick={() => setLocation('/photos')}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <BarChart className="mr-2 h-4 w-4 text-green-500" />
                AI Valuation Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Get intelligent valuation suggestions with detailed adjustment explanations
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-0 h-auto" 
                onClick={() => setLocation('/ai-valuation')}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center">
                <Zap className="mr-2 h-4 w-4 text-amber-500" />
                Productivity Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Workflow automations that help you complete appraisals faster with less effort
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="p-0 h-auto" 
                onClick={() => setLocation('/workflow')}
              >
                Try it <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Pro Tip:</span> Start with the Guided Tour to learn how these tools fit into your workflow
          </div>
          <Button onClick={() => setLocation('/onboarding')}>
            Start Guided Tour <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default AIFeatureIntro;