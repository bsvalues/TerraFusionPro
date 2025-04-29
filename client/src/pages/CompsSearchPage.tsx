import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Grid as GridIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompsSearchPage() {
  const [searchView, setSearchView] = useState<"map" | "grid">("map");
  console.log("CompsSearchPage rendering");
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparable Property Search</h1>
          <p className="text-muted-foreground">
            Search and analyze comparable properties in your market area
          </p>
        </div>
        
        <div className="flex gap-2">
          <Tabs 
            value={searchView} 
            onValueChange={(value) => setSearchView(value as "map" | "grid")}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Map
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-1">
                <GridIcon className="h-4 w-4" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Search filters */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Filters
            </CardTitle>
            <CardDescription>
              Narrow down comparable properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                placeholder="City, County, or ZIP Code" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  id="minPrice" 
                  placeholder="Min" 
                  type="number"
                />
                <Input 
                  id="maxPrice" 
                  placeholder="Max" 
                  type="number"
                />
              </div>
            </div>
            
            <Button className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search Comparables
            </Button>
          </CardContent>
        </Card>
        
        {/* Results display area */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Property Results</CardTitle>
            <CardDescription>
              {searchView === "map" ? "Map view of comparable properties" : "Grid view of comparable properties"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Use the search filters to find comparable properties in your area.
              </p>
              <Button variant="outline" className="mt-4">
                Search Example Area
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}