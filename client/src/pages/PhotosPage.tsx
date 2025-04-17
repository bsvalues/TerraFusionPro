import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

// Simple placeholder photos page
export default function PhotosPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Property Photos</h1>
        <Button>Upload Photos</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exterior Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Front Exterior</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Front Exterior</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Rear Exterior</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rear Exterior</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Street View</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Street View</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interior Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Living Room</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Living Room</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Kitchen</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Kitchen</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
            <div className="border rounded-md p-2 space-y-2">
              <div className="bg-gray-200 h-48 rounded-md flex items-center justify-center">
                <span className="text-gray-500">Master Bedroom</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Master Bedroom</span>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}