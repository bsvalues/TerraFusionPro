import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ShapViewer } from '@/components/ShapViewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ShapViewerPage() {
  const [_, setLocation] = useLocation();
  
  console.log("SHAP Viewer Page rendering");

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SHAP Value Explorer</h1>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            Back to Home
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ShapViewer />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About SHAP Values</CardTitle>
                <CardDescription>
                  Understanding property condition scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  SHAP (SHapley Additive exPlanations) values help explain how each feature
                  contributes to the final property condition score.
                </p>
                <p className="mb-4">
                  Features with positive values (green) push the score higher, while
                  features with negative values (blue) push the score lower.
                </p>
                <p>
                  This transparency helps appraisers understand and validate
                  AI-generated condition assessments.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Select a property condition category</li>
                  <li>View the property image</li>
                  <li>See how each feature contributes to the score</li>
                  <li>Understand the reasoning behind the assessment</li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  <li>Roof Condition</li>
                  <li>Exterior Paint/Siding</li>
                  <li>Windows & Doors</li>
                  <li>Foundation</li>
                  <li>Landscaping</li>
                  <li>Overall Maintenance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}