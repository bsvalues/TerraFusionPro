import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

// Simple placeholder comps page
export default function CompsPage() {
  const demoComps = [
    { 
      id: 1, 
      address: '456 Oak Street, Springfield, IL', 
      salePrice: 315000, 
      grossLivingArea: 2050, 
      bedrooms: 4, 
      bathrooms: 2, 
      saleDate: '2024-03-12', 
      distanceFromSubject: 0.5 
    },
    { 
      id: 2, 
      address: '789 Maple Ave, Springfield, IL', 
      salePrice: 335000, 
      grossLivingArea: 2150, 
      bedrooms: 4, 
      bathrooms: 2.5, 
      saleDate: '2024-02-18', 
      distanceFromSubject: 0.8 
    },
    { 
      id: 3, 
      address: '321 Pine Lane, Springfield, IL', 
      salePrice: 300000, 
      grossLivingArea: 1950, 
      bedrooms: 3, 
      bathrooms: 2, 
      saleDate: '2024-03-05', 
      distanceFromSubject: 1.2 
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Comparable Properties</h1>
        <Button>Add Comparable</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparable Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Size (sqft)</TableHead>
                <TableHead>Beds/Baths</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoComps.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell className="font-medium">{comp.address}</TableCell>
                  <TableCell>${comp.salePrice.toLocaleString()}</TableCell>
                  <TableCell>{comp.grossLivingArea.toLocaleString()}</TableCell>
                  <TableCell>{comp.bedrooms}/{comp.bathrooms}</TableCell>
                  <TableCell>{new Date(comp.saleDate).toLocaleDateString()}</TableCell>
                  <TableCell>{comp.distanceFromSubject} mi</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}