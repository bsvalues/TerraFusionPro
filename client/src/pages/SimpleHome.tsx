import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleHome() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">TerraFusion Property Analysis</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>406 Stardust Ct Property</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View details for 406 Stardust Ct, Grandview, WA 98930</p>
            <Button asChild className="w-full">
              <Link href="/stardust-property">View Property</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About This Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This demonstration shows an AI-powered analysis of 406 Stardust Ct with valuation details and property information.</p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}