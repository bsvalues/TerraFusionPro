import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Lightbulb, ArrowRight, TrendingUp, MapPin, Home, RefreshCw, FileBarChart2, Brain } from 'lucide-react';

// Mock data for demonstration
const marketTrendData = [
  { month: 'Jan', medianPrice: 285000, inventory: 214, daysOnMarket: 32 },
  { month: 'Feb', medianPrice: 290000, inventory: 195, daysOnMarket: 35 },
  { month: 'Mar', medianPrice: 298000, inventory: 223, daysOnMarket: 30 },
  { month: 'Apr', medianPrice: 310000, inventory: 245, daysOnMarket: 26 },
  { month: 'May', medianPrice: 315000, inventory: 267, daysOnMarket: 22 },
  { month: 'Jun', medianPrice: 325000, inventory: 274, daysOnMarket: 20 },
  { month: 'Jul', medianPrice: 328000, inventory: 242, daysOnMarket: 24 },
  { month: 'Aug', medianPrice: 322000, inventory: 201, daysOnMarket: 28 },
  { month: 'Sep', medianPrice: 318000, inventory: 187, daysOnMarket: 31 },
  { month: 'Oct', medianPrice: 310000, inventory: 195, daysOnMarket: 36 },
  { month: 'Nov', medianPrice: 320000, inventory: 178, daysOnMarket: 38 },
  { month: 'Dec', medianPrice: 335000, inventory: 165, daysOnMarket: 42 },
];

const neighborhoodData = [
  { name: 'Downtown', medianPrice: 420000, pricePerSqft: 375, inventory: 45 },
  { name: 'North Hills', medianPrice: 350000, pricePerSqft: 285, inventory: 78 },
  { name: 'Westside', medianPrice: 380000, pricePerSqft: 310, inventory: 56 },
  { name: 'Southpark', medianPrice: 295000, pricePerSqft: 225, inventory: 95 },
  { name: 'Eastview', medianPrice: 275000, pricePerSqft: 195, inventory: 124 },
];

// Market Analysis insights from AI
const marketInsights = [
  {
    title: 'Market Trend Analysis',
    content: 'The local market has shown a 5.2% appreciation over the last 12 months, with stronger growth in the downtown and northwestern suburbs. Inventory has decreased by 12% compared to the same period last year, putting upward pressure on prices.',
  },
  {
    title: 'Supply & Demand Balance',
    content: "Current inventory levels represent 2.4 months of supply, indicating a seller's market. New construction permits are up 8%, which may help ease inventory constraints in the next 6-12 months.",
  },
  {
    title: 'Interest Rate Impact',
    content: 'Recent interest rate increases have slightly cooled buyer demand, particularly in the entry-level price points. Higher-end properties have been less affected due to a higher percentage of cash buyers in that segment.',
  },
];

export default function MarketAnalysisPage() {
  const [, setLocation] = useLocation();
  const [selectedMarket, setSelectedMarket] = useState('local');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [dateRange, setDateRange] = useState('12');
  const [propertyType, setPropertyType] = useState('All Types');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleGenerateAnalysis = () => {
    setIsGeneratingAnalysis(true);
    // Simulate API call
    setTimeout(() => {
      setIsGeneratingAnalysis(false);
    }, 2000);
  };

  return (
    <PageLayout
      title="Market Analysis"
      description="AI-powered real estate market insights and trends"
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/ai-valuation')}
          >
            <Brain className="mr-2 h-4 w-4" />
            AI Valuation
          </Button>
          <Button onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingAnalysis ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Market selection and filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Market Analysis Parameters</CardTitle>
            <CardDescription>
              Customize parameters to generate targeted market analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Market Scope</label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select market scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Market</SelectItem>
                    <SelectItem value="regional">Regional</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Areas">All Areas</SelectItem>
                    <SelectItem value="Downtown">Downtown</SelectItem>
                    <SelectItem value="North Hills">North Hills</SelectItem>
                    <SelectItem value="Westside">Westside</SelectItem>
                    <SelectItem value="Southpark">Southpark</SelectItem>
                    <SelectItem value="Eastview">Eastview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period (months)</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Property Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Types">All Types</SelectItem>
                    <SelectItem value="Single Family">Single Family</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Market Analysis Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="trends">Price Trends</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
            <TabsTrigger value="neighborhoods">Neighborhood Comparison</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Market Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">+5.2%</div>
                  <p className="text-sm text-muted-foreground">Year-over-year appreciation</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Home className="h-5 w-5 mr-2 text-primary" />
                    Median Sale Price
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">$312,500</div>
                  <p className="text-sm text-muted-foreground">Up from $297,000 last year</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileBarChart2 className="h-5 w-5 mr-2 text-primary" />
                    Average DOM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">28 days</div>
                  <p className="text-sm text-muted-foreground">Down from 35 days last year</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Market Insights</CardTitle>
                <CardDescription>
                  Generated using historical sales data, economic indicators, and market trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <h4 className="font-medium mb-1 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                        {insight.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{insight.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Custom Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Price Trends Tab */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Price Trends Over Time</CardTitle>
                <CardDescription>
                  Median sale prices for {selectedLocation} over the past {dateRange} months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value} days`}
                    />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'medianPrice') return [`$${value.toLocaleString()}`, 'Median Price'];
                      if (name === 'daysOnMarket') return [`${value} days`, 'Days on Market'];
                      return [value, name];
                    }} />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="medianPrice" 
                      name="Median Price" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="daysOnMarket" 
                      name="Days on Market" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Levels</CardTitle>
                <CardDescription>
                  Total active listings by month
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inventory" name="Active Listings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter>
                <div className="text-sm">
                  <p className="font-medium">Current Market Status: <span className="text-orange-500">Seller's Market</span></p>
                  <p className="text-muted-foreground mt-1">2.4 months of inventory (balanced market is 5-6 months)</p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Neighborhoods Tab */}
          <TabsContent value="neighborhoods">
            <Card>
              <CardHeader>
                <CardTitle>Neighborhood Comparison</CardTitle>
                <CardDescription>
                  Market metrics across different neighborhoods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Neighborhood</th>
                        <th className="text-right p-2">Median Price</th>
                        <th className="text-right p-2">Price/Sq.Ft</th>
                        <th className="text-right p-2">Active Listings</th>
                        <th className="text-right p-2">YoY Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {neighborhoodData.map((hood, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="p-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {hood.name}
                          </td>
                          <td className="text-right p-2">${hood.medianPrice.toLocaleString()}</td>
                          <td className="text-right p-2">${hood.pricePerSqft}</td>
                          <td className="text-right p-2">{hood.inventory}</td>
                          <td className="text-right p-2">
                            <span className={i % 2 === 0 ? "text-green-500" : "text-red-500"}>
                              {i % 2 === 0 ? "+" : "-"}{Math.floor(Math.random() * 10) + 1}.{Math.floor(Math.random() * 9)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full">
                  <FileBarChart2 className="mr-2 h-4 w-4" />
                  Export Neighborhood Analysis
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}