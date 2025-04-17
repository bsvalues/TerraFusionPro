import { useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAppraisal } from '@/contexts/AppraisalContext';

export default function Home() {
  const [_, setLocation] = useLocation();
  const { currentUser, reports, properties, loadReport } = useAppraisal();

  // If we have active reports, load the first one
  useEffect(() => {
    if (reports.length > 0 && currentUser) {
      loadReport(reports[0].id).then(() => {
        setLocation('/form');
      });
    }
  }, [reports, currentUser, loadReport, setLocation]);

  // Create a demo report with sample data if none exists
  const createDemoReport = useCallback(async () => {
    try {
      if (!currentUser) return;
      
      // Create a property if none exists
      let property = properties[0];
      if (!property) {
        property = await createProperty();
      }
      
      // Create a report for the property
      const report = await createReport(property.id);
      
      // Load the report and navigate to the form page
      await loadReport(report.id);
      setLocation('/form');
    } catch (error) {
      console.error('Error creating demo report:', error);
    }
  }, [currentUser, properties, setLocation]);

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AppraisalCore - Real Estate Appraisal Platform</h1>
        
        {reports.length === 0 ? (
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
                  <Button onClick={createDemoReport}>
                    Load Demo Report
                  </Button>
                  <Button variant="outline">
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
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Your Recent Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(report => {
                const property = properties.find(p => p.id === report.propertyId);
                return (
                  <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => {
                      loadReport(report.id).then(() => {
                        setLocation('/form');
                      });
                    }}
                  >
                    <CardHeader>
                      <CardTitle>{property?.address || 'Untitled Property'}</CardTitle>
                      <CardDescription>
                        {property?.city}, {property?.state} {property?.zipCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span>Status: <span className="font-medium">{report.status}</span></span>
                        <span>Type: <span className="font-medium">{report.formType}</span></span>
                      </div>
                      {report.effectiveDate && (
                        <div className="text-sm mt-2">
                          Effective Date: {new Date(report.effectiveDate).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="ghost" size="sm">Open Report</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline">Create New Report</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to create a sample property
async function createProperty() {
  const { createProperty } = useAppraisal();
  return await createProperty({
    userId: 1,
    address: "123 Main Street",
    city: "Springfield",
    state: "IL",
    zipCode: "62701",
    county: "Sangamon",
    legalDescription: "LOT 7 BLOCK 2 ORIGINAL TOWN OF SPRINGFIELD",
    taxParcelId: "14-28-351-007",
    propertyType: "Single-Family Detached",
    yearBuilt: 1995,
    effectiveAge: 15,
    grossLivingArea: 2120,
    lotSize: 10800,
    bedrooms: 4,
    bathrooms: 2.5,
    basement: "Full",
    garage: "2-Car"
  });
}

// Helper function to create a sample report
async function createReport(propertyId: number) {
  const { createReport } = useAppraisal();
  return await createReport({
    userId: 1,
    propertyId,
    reportType: "Appraisal Report",
    formType: "FNMA 1004/FHLMC 70",
    status: "In Progress",
    purpose: "Purchase Mortgage",
    effectiveDate: new Date(),
    reportDate: new Date(),
    clientName: "ABC Mortgage",
    clientAddress: "456 Finance Ave, Chicago, IL 60601",
    lenderName: "ABC Mortgage",
    lenderAddress: "456 Finance Ave, Chicago, IL 60601",
    borrowerName: "John Smith",
    occupancy: "Owner-Occupied",
    salesPrice: 330000,
    marketValue: 330000
  });
}
