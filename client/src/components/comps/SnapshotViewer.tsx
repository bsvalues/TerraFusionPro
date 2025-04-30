import React, { useState, useMemo } from 'react';
import { useSnapshotHistory } from '@/hooks/useSnapshotHistory';
import { SnapshotTile } from './SnapshotTile';
import { SnapshotDiff } from './SnapshotDiff';
import { FieldMappingDialog } from './FieldMappingDialog';
import { ComparableSnapshot } from '@shared/types/comps';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  CalendarIcon,
  FilterIcon,
  SendIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface SnapshotViewerProps {
  propertyId: string;
  onBack?: () => void;
}

export function SnapshotViewer({ propertyId, onBack }: SnapshotViewerProps) {
  const { snapshots, isLoading, error, pushToForm } = useSnapshotHistory(propertyId);
  
  // State to keep track of selected snapshots
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [compareSnapshotId, setCompareSnapshotId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('history');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSource, setFilterSource] = useState<string | null>(null);
  
  // Get selected snapshot objects
  const selectedSnapshot = useMemo(() => {
    return snapshots?.find(s => s.id === selectedSnapshotId) || null;
  }, [snapshots, selectedSnapshotId]);
  
  const compareSnapshot = useMemo(() => {
    return snapshots?.find(s => s.id === compareSnapshotId) || null;
  }, [snapshots, compareSnapshotId]);
  
  // Get unique sources for filtering
  const sources = useMemo(() => {
    if (!snapshots) return [];
    const uniqueSources = [...new Set(snapshots.map(s => s.source))];
    return uniqueSources.sort();
  }, [snapshots]);
  
  // Handle sorting and filtering of snapshots
  const processedSnapshots = useMemo(() => {
    if (!snapshots) return [];
    
    // Filter by source if needed
    let filtered = filterSource 
      ? snapshots.filter(s => s.source === filterSource)
      : snapshots;
    
    // Sort by date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [snapshots, sortOrder, filterSource]);
  
  // Clear selections when switching tabs
  React.useEffect(() => {
    if (activeTab === 'history') {
      setCompareSnapshotId(null);
    }
  }, [activeTab]);
  
  // Handle snapshot selection
  const handleSelectSnapshot = (snapshot: ComparableSnapshot) => {
    if (activeTab === 'history') {
      setSelectedSnapshotId(snapshot.id === selectedSnapshotId ? null : snapshot.id);
    } else if (activeTab === 'compare') {
      if (!selectedSnapshotId) {
        setSelectedSnapshotId(snapshot.id);
      } else if (snapshot.id !== selectedSnapshotId) {
        setCompareSnapshotId(snapshot.id);
      }
    }
  };
  
  // Handle snapshot comparison
  const handleCompareSnapshot = (snapshot: ComparableSnapshot) => {
    setActiveTab('compare');
    if (!selectedSnapshotId) {
      setSelectedSnapshotId(snapshot.id);
    } else {
      setCompareSnapshotId(snapshot.id);
    }
  };
  
  // Handle push to form
  const handlePushToForm = (snapshot: ComparableSnapshot) => {
    // This will be handled by the FieldMappingDialog component
    // We just need to pass the pushToForm function
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error loading snapshots</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load snapshot history. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render empty state
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="text-center py-20">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Snapshots Available</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-8">
          This property doesn't have any historical snapshots recorded.
        </p>
        {onBack && (
          <Button onClick={onBack} className="mt-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Comparables
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Back button */}
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Comparables
        </Button>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="history">Snapshot History</TabsTrigger>
            <TabsTrigger value="compare">Compare Snapshots</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-2">
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDownIcon className="h-4 w-4 mr-2" />
                <span>Sort by Date</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filterSource || ''}
              onValueChange={(v) => setFilterSource(v === '' ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <FilterIcon className="h-4 w-4 mr-2" />
                <span>Filter by Source</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="history" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedSnapshots.map(snapshot => (
              <SnapshotTile
                key={snapshot.id}
                snapshot={snapshot}
                onSelect={handleSelectSnapshot}
                onCompare={handleCompareSnapshot}
                onPushToForm={handlePushToForm}
                isSelected={snapshot.id === selectedSnapshotId}
              />
            ))}
          </div>
          
          {selectedSnapshot && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Snapshot Details</CardTitle>
                <CardDescription>
                  Created on {format(new Date(selectedSnapshot.createdAt), 'PPP p')} via {selectedSnapshot.source}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    {Object.entries(selectedSnapshot.fields).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-sm">{key}: </span>
                        <span className="text-sm">{
                          value === null || value === undefined 
                            ? 'N/A' 
                            : (typeof value === 'object' ? JSON.stringify(value) : String(value))
                        }</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="justify-end">
                <FieldMappingDialog 
                  snapshot={selectedSnapshot}
                  onPushToForm={(formId, fieldMappings) => 
                    pushToForm(selectedSnapshot, formId, fieldMappings)
                  }
                >
                  <Button>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Push to Form
                  </Button>
                </FieldMappingDialog>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compare" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedSnapshots.map(snapshot => (
              <SnapshotTile
                key={snapshot.id}
                snapshot={snapshot}
                onSelect={handleSelectSnapshot}
                onCompare={() => {}} // Disabled in compare mode
                onPushToForm={handlePushToForm}
                isSelected={
                  snapshot.id === selectedSnapshotId || 
                  snapshot.id === compareSnapshotId
                }
              />
            ))}
          </div>
          
          {selectedSnapshotId && compareSnapshotId && selectedSnapshot && compareSnapshot && (
            <div className="mt-6">
              <SnapshotDiff 
                oldSnapshot={selectedSnapshot.createdAt < compareSnapshot.createdAt ? selectedSnapshot : compareSnapshot}
                newSnapshot={selectedSnapshot.createdAt >= compareSnapshot.createdAt ? selectedSnapshot : compareSnapshot}
              />
            </div>
          )}
          
          {(selectedSnapshotId && !compareSnapshotId) && (
            <Alert className="mt-6">
              <AlertTitle>Select another snapshot</AlertTitle>
              <AlertDescription>
                Please select a second snapshot to compare with the currently selected one.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}