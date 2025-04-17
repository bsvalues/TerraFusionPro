import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanels } from '@/components/ui/resizable-panels';
import ComparablesTable from '@/components/appraisal/ComparablesTable';
import { useAppraisal } from '@/contexts/AppraisalContext';
import { Comparable, InsertComparable } from '@shared/schema';

export default function CompsPage() {
  const { 
    currentReport, 
    currentProperty, 
    comparables, 
    adjustments, 
    createComparable, 
    updateComparable,
    createAdjustment,
    updateAdjustment
  } = useAppraisal();

  const [activeTab, setActiveTab] = useState('selected');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComp, setSelectedComp] = useState<Comparable | null>(null);
  const [newCompData, setNewCompData] = useState<Partial<InsertComparable>>({
    compType: 'sale',
    proximityToSubject: '0.5 miles'
  });

  // Handle adjustment changes
  const handleAdjustmentChange = useCallback((comparableId: number, type: string, value: number) => {
    if (!currentReport) return;
    
    // Find if an adjustment of this type already exists for this comparable
    const existingAdjustment = adjustments.find(
      adj => adj.comparableId === comparableId && adj.adjustmentType === type
    );
    
    if (existingAdjustment) {
      // Update existing adjustment
      updateAdjustment(existingAdjustment.id, { 
        amount: value 
      }).catch(error => console.error('Error updating adjustment:', error));
    } else {
      // Create new adjustment
      createAdjustment({
        reportId: currentReport.id,
        comparableId,
        adjustmentType: type,
        description: `Adjustment for ${type}`,
        amount: value
      }).catch(error => console.error('Error creating adjustment:', error));
    }
  }, [currentReport, adjustments, createAdjustment, updateAdjustment]);

  // Handle creating a new comparable
  const handleAddComparable = useCallback(async () => {
    if (!currentReport) return;
    
    try {
      const newComparable: InsertComparable = {
        reportId: currentReport.id,
        compType: newCompData.compType || 'sale',
        address: newCompData.address || '',
        city: currentProperty?.city || '',
        state: currentProperty?.state || '',
        zipCode: currentProperty?.zipCode || '',
        proximityToSubject: newCompData.proximityToSubject || '0.5 miles',
        salePrice: newCompData.salePrice || null,
        locationRating: 'Good',
        grossLivingArea: currentProperty?.grossLivingArea || null,
        bedrooms: currentProperty?.bedrooms || null,
        bathrooms: currentProperty?.bathrooms || null
      };
      
      await createComparable(newComparable);
      
      // Reset new comp data
      setNewCompData({
        compType: 'sale',
        proximityToSubject: '0.5 miles'
      });
    } catch (error) {
      console.error('Error adding comparable:', error);
    }
  }, [currentReport, newCompData, currentProperty, createComparable]);

  // Filter comparables by search query
  const filteredComparables = comparables.filter(comp => 
    comp.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.proximityToSubject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentReport || !currentProperty) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-medium p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Comparable Properties</h2>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            size="sm"
            className="px-3 py-1 text-sm"
          >
            Import from MLS
          </Button>
          <Button
            size="sm"
            className="px-3 py-1 text-sm"
          >
            Save Comparables
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          direction="horizontal"
          defaultSizes={[30, 70]}
          minSizes={[20, 50]}
          className="h-full"
        >
          {/* Left Panel - Comparables List */}
          <div className="h-full flex flex-col bg-white border-r border-neutral-medium">
            <div className="p-4 border-b border-neutral-medium">
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Search comparables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8"
                />
                <svg 
                  className="h-4 w-4 text-neutral-gray absolute left-2.5 top-2.5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <Tabs 
                defaultValue="selected" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="selected" className="flex-1">Selected</TabsTrigger>
                  <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
                  <TabsTrigger value="new" className="flex-1">New</TabsTrigger>
                </TabsList>
                
                <TabsContent value="selected" className="mt-4 h-[calc(100vh-220px)] overflow-y-auto">
                  {filteredComparables.length > 0 ? (
                    <div className="space-y-2">
                      {filteredComparables.map((comp, index) => (
                        <div 
                          key={comp.id}
                          className={`
                            p-3 rounded-md cursor-pointer border
                            ${selectedComp?.id === comp.id ? 'border-primary bg-primary/5' : 'border-neutral-medium hover:bg-neutral-light'}
                          `}
                          onClick={() => setSelectedComp(comp)}
                        >
                          <div className="font-medium">Comp {index + 1}</div>
                          <div className="text-sm">{comp.address}</div>
                          <div className="text-xs text-neutral-gray flex justify-between mt-1">
                            <span>{comp.proximityToSubject}</span>
                            <span>{comp.salePrice ? `$${Number(comp.salePrice).toLocaleString()}` : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 text-neutral-gray">
                      No comparables found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="search" className="mt-4">
                  <div className="p-4 text-center">
                    <p className="mb-4">Search for comparable properties in the MLS database.</p>
                    <Button>Search MLS Database</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="new" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="comp-address">Address</Label>
                      <Input 
                        id="comp-address"
                        value={newCompData.address || ''}
                        onChange={(e) => setNewCompData({...newCompData, address: e.target.value})}
                        placeholder="Enter address"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="comp-type">Comparable Type</Label>
                        <Select 
                          value={newCompData.compType || 'sale'}
                          onValueChange={(value) => setNewCompData({...newCompData, compType: value})}
                        >
                          <SelectTrigger id="comp-type">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="listing">Listing</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="comp-proximity">Proximity</Label>
                        <Input 
                          id="comp-proximity"
                          value={newCompData.proximityToSubject || ''}
                          onChange={(e) => setNewCompData({...newCompData, proximityToSubject: e.target.value})}
                          placeholder="e.g., 0.5 miles"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="comp-price">Sale Price</Label>
                      <Input 
                        id="comp-price"
                        type="number"
                        value={newCompData.salePrice?.toString() || ''}
                        onChange={(e) => setNewCompData({...newCompData, salePrice: parseFloat(e.target.value)})}
                        placeholder="Enter sale price"
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleAddComparable}
                      disabled={!newCompData.address}
                    >
                      Add Comparable
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right Panel - Comparables Grid */}
          <div className="h-full flex flex-col overflow-auto bg-neutral-lightest">
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Comparison Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparablesTable 
                    property={currentProperty}
                    comparables={comparables}
                    adjustments={adjustments}
                    onAdjustmentChange={handleAdjustmentChange}
                  />
                </CardContent>
              </Card>
              
              {selectedComp && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Comparable Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Address</Label>
                        <Input 
                          value={selectedComp.address || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { address: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label>Sale Price</Label>
                        <Input 
                          type="number"
                          value={selectedComp.salePrice?.toString() || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { salePrice: parseFloat(e.target.value) })}
                        />
                      </div>
                      
                      <div>
                        <Label>Proximity</Label>
                        <Input 
                          value={selectedComp.proximityToSubject || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { proximityToSubject: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label>GLA (sq ft)</Label>
                        <Input 
                          type="number"
                          value={selectedComp.grossLivingArea?.toString() || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { grossLivingArea: parseFloat(e.target.value) })}
                        />
                      </div>
                      
                      <div>
                        <Label>Bedrooms</Label>
                        <Input 
                          type="number"
                          value={selectedComp.bedrooms?.toString() || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { bedrooms: parseFloat(e.target.value) })}
                        />
                      </div>
                      
                      <div>
                        <Label>Bathrooms</Label>
                        <Input 
                          type="number"
                          step="0.5"
                          value={selectedComp.bathrooms?.toString() || ''}
                          onChange={(e) => updateComparable(selectedComp.id, { bathrooms: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </ResizablePanels>
      </div>
    </div>
  );
}
