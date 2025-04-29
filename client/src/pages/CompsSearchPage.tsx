import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CompsMap, ComparableRecord } from "@/components/comps/CompsMap";
import { CompsGrid } from "@/components/comps/CompsGrid";
import { Slider } from "@/components/ui/slider";
import { Loader2, Search, Map, Grid, Filter } from "lucide-react";
import { queryClient } from "@/lib/queryClient"; 

// Define type for search filters
interface SearchFilters {
  squareFeetRange?: [number, number];
  saleDateMaxDays?: number;
  bedsMin?: number;
  bathsMin?: number;
  yearBuiltRange?: [number, number];
  propertyType?: string;
  priceRange?: [number, number];
  acreageRange?: [number, number];
  county?: string;
}

export default function CompsSearchPage() {
  const [searchView, setSearchView] = useState<"map" | "grid">("map");
  const [filters, setFilters] = useState<SearchFilters>({
    squareFeetRange: [500, 5000],
    saleDateMaxDays: 365,
    bedsMin: 2,
    bathsMin: 1,
    yearBuiltRange: [1950, new Date().getFullYear()],
    priceRange: [100000, 1000000],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedComparable, setSelectedComparable] = useState<ComparableRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Function to search for comparables
  const searchComparables = async (filters: SearchFilters) => {
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/comps/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters, limit: 50 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search for comparable properties');
      }
      
      const data = await response.json();
      return data.records as ComparableRecord[];
    } catch (error) {
      console.error('Error searching for comparables:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  };
  
  // Query for comparables
  const {
    data: comparables,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/comps/search', filters],
    queryFn: () => searchComparables(filters),
    enabled: false, // Don't run query automatically
  });
  
  // Handle search button click
  const handleSearch = () => {
    refetch();
  };
  
  // Handle comparable selection
  const handleComparableClick = (comparable: ComparableRecord) => {
    setSelectedComparable(comparable);
  };
  
  // Handle comparable selection
  const handleComparableSelect = (comparable: ComparableRecord, selected: boolean) => {
    if (selected) {
      setSelectedIds(prev => [...prev, comparable.id]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== comparable.id));
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comparable Property Search</h1>
            <p className="text-muted-foreground">
              Search and analyze comparable properties in your area
            </p>
          </div>
          
          <div className="flex gap-2">
            <Tabs
              value={searchView}
              onValueChange={(value: string) => setSearchView(value as "map" | "grid")}
              className="w-[300px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map" className="flex items-center gap-1">
                  <Map className="h-4 w-4" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <Grid className="h-4 w-4" />
                  Grid View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filter sidebar */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search Filters
              </CardTitle>
              <CardDescription>
                Narrow down comparable properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible defaultValue="price">
                <AccordionItem value="price">
                  <AccordionTrigger>Price Range</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minPrice">Min</Label>
                          <Input
                            id="minPrice"
                            type="number"
                            value={filters.priceRange?.[0] || 0}
                            onChange={(e) => 
                              handleFilterChange('priceRange', [
                                parseInt(e.target.value),
                                filters.priceRange?.[1] || 1000000,
                              ])
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxPrice">Max</Label>
                          <Input
                            id="maxPrice"
                            type="number"
                            value={filters.priceRange?.[1] || 1000000}
                            onChange={(e) => 
                              handleFilterChange('priceRange', [
                                filters.priceRange?.[0] || 0,
                                parseInt(e.target.value),
                              ])
                            }
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <Slider
                          value={[
                            filters.priceRange?.[0] || 0,
                            filters.priceRange?.[1] || 1000000,
                          ]}
                          min={0}
                          max={2000000}
                          step={10000}
                          onValueChange={(value) => 
                            handleFilterChange('priceRange', [value[0], value[1]])
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>$0</span>
                          <span>$2M</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="size">
                  <AccordionTrigger>Size</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minSize">Min sqft</Label>
                          <Input
                            id="minSize"
                            type="number"
                            value={filters.squareFeetRange?.[0] || 0}
                            onChange={(e) => 
                              handleFilterChange('squareFeetRange', [
                                parseInt(e.target.value),
                                filters.squareFeetRange?.[1] || 5000,
                              ])
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxSize">Max sqft</Label>
                          <Input
                            id="maxSize"
                            type="number"
                            value={filters.squareFeetRange?.[1] || 5000}
                            onChange={(e) => 
                              handleFilterChange('squareFeetRange', [
                                filters.squareFeetRange?.[0] || 0,
                                parseInt(e.target.value),
                              ])
                            }
                          />
                        </div>
                      </div>
                      <div className="pt-4">
                        <Slider
                          value={[
                            filters.squareFeetRange?.[0] || 500,
                            filters.squareFeetRange?.[1] || 5000,
                          ]}
                          min={0}
                          max={10000}
                          step={100}
                          onValueChange={(value) => 
                            handleFilterChange('squareFeetRange', [value[0], value[1]])
                          }
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>0 sqft</span>
                          <span>10,000 sqft</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="beds-baths">
                  <AccordionTrigger>Beds & Baths</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="minBeds">Minimum Bedrooms</Label>
                        <Select
                          value={filters.bedsMin?.toString() || "0"}
                          onValueChange={(value) => 
                            handleFilterChange('bedsMin', parseInt(value))
                          }
                        >
                          <SelectTrigger id="minBeds">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                            <SelectItem value="5">5+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minBaths">Minimum Bathrooms</Label>
                        <Select
                          value={filters.bathsMin?.toString() || "0"}
                          onValueChange={(value) => 
                            handleFilterChange('bathsMin', parseInt(value))
                          }
                        >
                          <SelectTrigger id="minBaths">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Any</SelectItem>
                            <SelectItem value="1">1+</SelectItem>
                            <SelectItem value="1.5">1.5+</SelectItem>
                            <SelectItem value="2">2+</SelectItem>
                            <SelectItem value="2.5">2.5+</SelectItem>
                            <SelectItem value="3">3+</SelectItem>
                            <SelectItem value="4">4+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="property-type">
                  <AccordionTrigger>Property Type</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Type</Label>
                      <Select
                        value={filters.propertyType || ""}
                        onValueChange={(value) => 
                          handleFilterChange('propertyType', value)
                        }
                      >
                        <SelectTrigger id="propertyType">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="agricultural">Agricultural</SelectItem>
                          <SelectItem value="vacant">Vacant Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="year-built">
                  <AccordionTrigger>Year Built</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minYear">From</Label>
                          <Input
                            id="minYear"
                            type="number"
                            value={filters.yearBuiltRange?.[0] || 1950}
                            onChange={(e) => 
                              handleFilterChange('yearBuiltRange', [
                                parseInt(e.target.value),
                                filters.yearBuiltRange?.[1] || new Date().getFullYear(),
                              ])
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxYear">To</Label>
                          <Input
                            id="maxYear"
                            type="number"
                            value={filters.yearBuiltRange?.[1] || new Date().getFullYear()}
                            onChange={(e) => 
                              handleFilterChange('yearBuiltRange', [
                                filters.yearBuiltRange?.[0] || 1950,
                                parseInt(e.target.value),
                              ])
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="sale-date">
                  <AccordionTrigger>Sale Date</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label htmlFor="saleDateMaxDays">Max Days Since Sale</Label>
                      <Select
                        value={filters.saleDateMaxDays?.toString() || "365"}
                        onValueChange={(value) => 
                          handleFilterChange('saleDateMaxDays', parseInt(value))
                        }
                      >
                        <SelectTrigger id="saleDateMaxDays">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 3 months</SelectItem>
                          <SelectItem value="180">Last 6 months</SelectItem>
                          <SelectItem value="365">Last year</SelectItem>
                          <SelectItem value="730">Last 2 years</SelectItem>
                          <SelectItem value="1095">Last 3 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="county">
                  <AccordionTrigger>County</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        value={filters.county || ""}
                        onChange={(e) => 
                          handleFilterChange('county', e.target.value)
                        }
                        placeholder="Enter county name"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleSearch}
                disabled={isLoading || isSearching}
              >
                {(isLoading || isSearching) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Main content area */}
          <div className="lg:col-span-9">
            {searchView === "map" ? (
              <CompsMap
                records={comparables}
                isLoading={isLoading || isSearching}
                error={error ? String(error) : undefined}
                onComparableClick={handleComparableClick}
                height="600px"
              />
            ) : (
              <CompsGrid
                records={comparables}
                isLoading={isLoading || isSearching}
                error={error ? String(error) : undefined}
                onComparableClick={handleComparableClick}
                onComparableSelect={handleComparableSelect}
                selectedIds={selectedIds}
                showSelectionColumn={true}
              />
            )}
          </div>
        </div>
        
        {/* Selected comparable details */}
        {selectedComparable && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Comparable</CardTitle>
              <CardDescription>
                {selectedComparable.address}, {selectedComparable.city}, {selectedComparable.state} {selectedComparable.zipCode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Sale Information</h3>
                  <p className="text-2xl font-bold">${selectedComparable.saleAmount.toLocaleString()}</p>
                  <p className="text-sm">
                    Sold on {new Date(selectedComparable.saleDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Property Details</h3>
                  <div className="flex gap-x-4">
                    {selectedComparable.squareFeet && (
                      <p className="text-sm">{selectedComparable.squareFeet.toLocaleString()} sqft</p>
                    )}
                    {selectedComparable.bedrooms && (
                      <p className="text-sm">{selectedComparable.bedrooms} beds</p>
                    )}
                    {selectedComparable.bathrooms && (
                      <p className="text-sm">{selectedComparable.bathrooms} baths</p>
                    )}
                  </div>
                  <p className="text-sm">Built in {selectedComparable.yearBuilt || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">Location</h3>
                  <p className="text-sm">{selectedComparable.address}</p>
                  <p className="text-sm">{selectedComparable.city}, {selectedComparable.state} {selectedComparable.zipCode}</p>
                  <p className="text-sm">{selectedComparable.county} County</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedComparable(null)}
              >
                Close
              </Button>
              <Button>
                Add to Report
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}