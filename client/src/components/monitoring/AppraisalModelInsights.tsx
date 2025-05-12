import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  BarChart3,
  Calendar,
  HelpCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Camera,
} from 'lucide-react';

// Sample data for the component
// In a real implementation, this would be fetched from an API
const sampleModelData = {
  performanceMetrics: {
    accuracyRate: 92.4,
    reliabilityScore: 87.6,
    dataQualityScore: 90.2,
    needsAttention: false,
  },
  valuationAccuracy: [
    { date: '2025-01', accuracy: 90.2, volume: 230 },
    { date: '2025-02', accuracy: 91.5, volume: 245 },
    { date: '2025-03', accuracy: 89.8, volume: 218 },
    { date: '2025-04', accuracy: 92.3, volume: 256 },
    { date: '2025-05', accuracy: 92.4, volume: 268 },
  ],
  recentActivity: [
    { 
      id: 1, 
      propertyAddress: '123 Oak Lane', 
      date: '2025-05-10', 
      difference: 0.3, 
      aiValue: 325000, 
      finalValue: 326000,
      confidenceLevel: 'high'
    },
    { 
      id: 2, 
      propertyAddress: '789 Maple Street', 
      date: '2025-05-09', 
      difference: -3.2, 
      aiValue: 468000, 
      finalValue: 453000,
      confidenceLevel: 'medium'
    },
    { 
      id: 3, 
      propertyAddress: '456 Elm Road', 
      date: '2025-05-08', 
      difference: 1.1, 
      aiValue: 275000, 
      finalValue: 278000,
      confidenceLevel: 'high'
    },
    { 
      id: 4, 
      propertyAddress: '2100 Pine Avenue', 
      date: '2025-05-07', 
      difference: -8.5, 
      aiValue: 520000, 
      finalValue: 476000,
      confidenceLevel: 'low'
    },
  ],
  frequentAdjustments: [
    { factor: 'Condition Rating', frequency: 78, averageAmount: 15200 },
    { factor: 'Location Quality', frequency: 65, averageAmount: 24500 },
    { factor: 'Lot Size', frequency: 52, averageAmount: 12800 },
    { factor: 'Year Built', frequency: 48, averageAmount: 8750 },
    { factor: 'Garage Size', frequency: 32, averageAmount: 6300 },
  ]
};

/**
 * AppraisalModelInsights Component
 * 
 * A simplified dashboard that translates technical model metrics into
 * practical insights for appraisers. Helps users understand the reliability
 * of AI valuations without requiring technical knowledge.
 */
export function AppraisalModelInsights() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30');
  
  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center">
                AI Valuation Insights
                <Button variant="ghost" size="icon" className="ml-2 h-6 w-6">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                How the AI valuation system is performing to support your appraisal work
              </CardDescription>
            </div>
            <div>
              <div className="space-x-2">
                <Button 
                  variant={timeRange === '7' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTimeRange('7')}
                >
                  7 Days
                </Button>
                <Button 
                  variant={timeRange === '30' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTimeRange('30')}
                >
                  30 Days
                </Button>
                <Button 
                  variant={timeRange === '90' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setTimeRange('90')}
                >
                  90 Days
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="accuracy">Accuracy Trends</TabsTrigger>
              <TabsTrigger value="adjustments">Common Adjustments</TabsTrigger>
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Reliability Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{sampleModelData.performanceMetrics.reliabilityScore}%</div>
                    <Progress value={sampleModelData.performanceMetrics.reliabilityScore} className="h-2 mt-2" />
                    <p className="text-sm mt-2">
                      How often AI valuations are within 5% of final appraised values
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Camera className="mr-2 h-5 w-5 text-blue-500" />
                      Condition Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{sampleModelData.performanceMetrics.accuracyRate}%</div>
                    <Progress value={sampleModelData.performanceMetrics.accuracyRate} className="h-2 mt-2" />
                    <p className="text-sm mt-2">
                      Accuracy of condition ratings from property photos
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-emerald-500" />
                      Value Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2 items-center">
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">+12.6%</span>
                      <span className="text-sm text-muted-foreground">faster valuation time</span>
                    </div>
                    <div className="flex space-x-2 items-center mt-2">
                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600">-8.2%</span>
                      <span className="text-sm text-muted-foreground">fewer revision requests</span>
                    </div>
                    <p className="text-sm mt-2">
                      Impact on your appraisal workflow efficiency
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">System Health Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      {sampleModelData.performanceMetrics.needsAttention ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          <span className="font-medium text-amber-600">Attention Needed</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="font-medium text-green-600">All Systems Normal</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm mt-2">
                      The AI valuation system is operating normally with no significant drift detected.
                      Models are within expected performance parameters.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium mb-1">Last Model Update</div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>May 8, 2025</span>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <div className="text-sm font-medium mb-1">Active Model Version</div>
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Version 2.0.4</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Accuracy Trends Tab */}
            <TabsContent value="accuracy">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valuation Accuracy Over Time</CardTitle>
                  <CardDescription>
                    Shows how AI valuations compare to final appraised values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center border rounded p-6">
                    <div className="text-center space-y-4">
                      <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div className="text-xl font-medium">Accuracy Trend Graph</div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        This chart would show the trend of valuation accuracy over time.
                        <br />
                        (For implementation, we would use Recharts or another React charting library)
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="border rounded-md p-3">
                      <div className="text-sm font-medium mb-1">Average Accuracy</div>
                      <div className="text-2xl font-bold">91.2%</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Percentage of valuations within 5% of final value
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-3">
                      <div className="text-sm font-medium mb-1">Trend</div>
                      <div className="flex items-center">
                        <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-green-600 font-medium">Improving</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Accuracy increased 1.2% over the past 30 days
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Adjustments Tab */}
            <TabsContent value="adjustments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Common Value Adjustments</CardTitle>
                  <CardDescription>
                    Factors that most frequently affect property valuations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center border rounded p-6">
                    <div className="text-center space-y-4">
                      <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div className="text-xl font-medium">Adjustments Chart</div>
                      <p className="text-sm text-muted-foreground max-w-md">
                        This chart would show the most common adjustments by frequency and amount.
                        <br />
                        (For implementation, we would use Recharts or another React charting library)
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">What This Means For Appraisers:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span>Pay special attention to <strong>Condition Rating</strong> and <strong>Location Quality</strong> as these factors most frequently require adjustments</span>
                      </li>
                      <li className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span>When <strong>Location Quality</strong> is a factor, it tends to have the largest dollar impact on valuation</span>
                      </li>
                      <li className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
                        <span>Properties with unusual features or characteristics may need more manual review</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Recent Activity Tab */}
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Valuation Activity</CardTitle>
                  <CardDescription>
                    Compare AI valuations with final appraised values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sampleModelData.recentActivity.map((activity) => (
                      <div key={activity.id} className="border rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{activity.propertyAddress}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.date}
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={
                              activity.confidenceLevel === 'high' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : activity.confidenceLevel === 'medium'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }
                          >
                            {activity.confidenceLevel.toUpperCase()} CONFIDENCE
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-sm text-muted-foreground">AI Valuation</div>
                            <div>{formatCurrency(activity.aiValue)}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-muted-foreground">Final Value</div>
                            <div>{formatCurrency(activity.finalValue)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center">
                          <div className="text-sm text-muted-foreground mr-2">Difference:</div>
                          <div className={
                            Math.abs(activity.difference) < 3 
                              ? 'text-green-600 font-medium' 
                              : Math.abs(activity.difference) < 8
                                ? 'text-amber-600 font-medium'
                                : 'text-red-600 font-medium'
                          }>
                            {activity.difference > 0 ? '+' : ''}{activity.difference.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AppraisalModelInsights;