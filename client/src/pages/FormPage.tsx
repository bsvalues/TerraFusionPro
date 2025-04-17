import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Simple placeholder form page
export default function FormPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subject Property Form</h1>
        <Button>Save</Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Property Address</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Street Address</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="Springfield"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="IL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded" 
              placeholder="62701"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Property Characteristics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select className="w-full p-2 border rounded">
              <option>Single-Family Detached</option>
              <option>Condominium</option>
              <option>Townhouse</option>
              <option>Multi-Family</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year Built</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="1995"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Square Feet</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="2200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lot Size (sq ft)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded" 
              placeholder="10000"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sales Price</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                placeholder="350000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Appraised Value</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded" 
                placeholder="350000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
