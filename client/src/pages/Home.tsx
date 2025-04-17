import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";

// Simplified version - removed AppraisalContext dependency
export default function Home() {
  const [_, setLocation] = useLocation();

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AppraisalCore - Real Estate Appraisal Platform</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to AppraisalCore</CardTitle>
              <CardDescription>
                The comprehensive real estate appraisal platform for desktop and mobile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You don't have any active appraisal reports. Create a new one to get started or load a demo report.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => setLocation('/form')}>
                  Load Demo Report
                </Button>
                <Button variant="outline" onClick={() => setLocation('/form')}>
                  Create New Report
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Form-Filler</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Complete appraisal forms with embedded spreadsheet-style worksheets that auto-calculate adjustments and market values.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mobile Inspection</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Capture property details, photos, and measurements with our mobile app - even without internet connection.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reports & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Generate professional PDF reports and MISMO XML exports while ensuring compliance with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
