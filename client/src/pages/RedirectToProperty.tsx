import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function RedirectToProperty() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect immediately to our new property analysis page
    setLocation('/property-analysis');
  }, [setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-lg font-medium">Redirecting to property analysis...</p>
      </div>
    </div>
  );
}