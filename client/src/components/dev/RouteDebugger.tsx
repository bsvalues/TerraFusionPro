/**
 * RouteDebugger - A temporary component to debug Wouter routing issues
 */
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const RouteDebugger = () => {
  const [location, setLocation] = useLocation();
  
  const testRoutes = [
    '/legal-urar',
    '/ai-valuation',
    '/reports',
    '/market-analysis',
    '/help'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Route Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="font-semibold">Current Location:</p>
            <code className="text-lg">{location}</code>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Test Routes:</h3>
              <div className="space-y-2">
                {testRoutes.map(route => (
                  <Button 
                    key={route}
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setLocation(route)}
                  >
                    {route}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Navigation Info:</h3>
              <p className="text-sm">
                This utility helps debug routing by directly testing navigation
                to specific routes without going through the navigation menu.
              </p>
              <p className="text-sm mt-2">
                Click the route buttons to test if the related pages load correctly.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};