import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';

// Simple placeholder reports page
export default function ReportsPage() {
  const demoReports = [
    {
      id: 1,
      address: '123 Main Street, Springfield, IL 62701',
      type: 'FNMA 1004/FHLMC 70',
      status: 'Completed',
      date: '2024-04-10',
      client: 'ABC Mortgage',
      value: 325000
    },
    {
      id: 2,
      address: '456 Oak Street, Springfield, IL 62701',
      type: 'FNMA 1073/FHLMC 465',
      status: 'In Progress',
      date: '2024-04-15',
      client: 'XYZ Bank',
      value: 275000
    },
    {
      id: 3,
      address: '789 Maple Ave, Springfield, IL 62701',
      type: 'FNMA 1004/FHLMC 70',
      status: 'Draft',
      date: '2024-04-17',
      client: 'First National Bank',
      value: 350000
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appraisal Reports</h1>
        <Button>New Report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
          <CardDescription>Manage your appraisal reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Address</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.address}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        report.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : report.status === 'In Progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>{report.client}</TableCell>
                  <TableCell>${report.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Open</Button>
                      <Button variant="ghost" size="sm">Export</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Create a finalized PDF report for submission</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Generate PDF</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export XML</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Export MISMO 2.6 XML for electronic submission</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Export XML</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validate Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Check report for UAD and GSE compliance issues</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Run Validation</Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}