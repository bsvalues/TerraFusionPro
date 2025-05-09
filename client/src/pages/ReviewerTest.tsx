import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function ReviewerTest() {
  const { toast } = useToast();
  const [testMessage, setTestMessage] = useState("Test page is working");

  const handleTestClick = () => {
    toast({
      title: "Test Successful",
      description: "The reviewer test page is working correctly",
    });
    setTestMessage("Test successful! " + new Date().toISOString());
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Reviewer Test Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Navigation Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{testMessage}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleTestClick}>Test Toast</Button>
            <Link href="/">
              <Button variant="outline" className="mt-2">Go Home</Button>
            </Link>
            <Link href="/reviewer">
              <Button variant="outline" className="mt-2">Go to Reviewer Page</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}