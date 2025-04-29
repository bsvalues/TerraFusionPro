import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompsSearchPage() {
  console.log("CompsSearchPage rendering");
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold">Comparable Property Search</h1>
      <p className="text-muted-foreground mb-6">
        Search and analyze comparable properties in your area
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Property Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Search Properties</Button>
        </CardContent>
      </Card>
    </div>
  );
}