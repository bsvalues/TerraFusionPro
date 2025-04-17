import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// Simple placeholder sketches page
export default function SketchesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Property Sketches</h1>
        <Button>Create New Sketch</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Floor Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-md p-4 space-y-3">
              <div className="bg-gray-200 h-64 rounded-md flex items-center justify-center">
                <span className="text-gray-500">First Floor</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">First Floor Plan</h3>
                  <p className="text-sm text-gray-500">1,250 sq ft</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4 space-y-3">
              <div className="bg-gray-200 h-64 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Second Floor</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Second Floor Plan</h3>
                  <p className="text-sm text-gray-500">950 sq ft</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4 space-y-3">
              <div className="bg-gray-200 h-64 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Basement</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Basement Plan</h3>
                  <p className="text-sm text-gray-500">1,100 sq ft (unfinished)</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Delete</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Site Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md p-4 space-y-3">
            <div className="bg-gray-200 h-64 rounded-md flex items-center justify-center">
              <span className="text-gray-500">Site Layout</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Property Site Plan</h3>
                <p className="text-sm text-gray-500">Lot size: 10,800 sq ft</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">Delete</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}