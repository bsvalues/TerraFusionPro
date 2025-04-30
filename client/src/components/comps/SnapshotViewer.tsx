/**
 * SnapshotViewer Component
 * 
 * Main container for viewing and comparing property snapshots
 */
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparableSnapshot } from '../../../shared/types/comps';
import { useSnapshotHistory } from '../../hooks/useSnapshotHistory';
import { SnapshotTile } from './SnapshotTile';
import { SnapshotDiff } from './SnapshotDiff';
import { FieldMappingDialog } from './FieldMappingDialog';
import { 
  Clock, 
  FileHistory, 
  AlertCircle, 
  ArrowLeftRight,
  Filter,
  Share
} from 'lucide-react';

interface SnapshotViewerProps {
  propertyId: string;
  className?: string;
}

export function SnapshotViewer({ propertyId, className }: SnapshotViewerProps) {
  const { snapshots, isLoading, error } = useSnapshotHistory(propertyId);
  const [selectedTab, setSelectedTab] = useState<'history' | 'compare'>('history');
  const [selectedSnapshot, setSelectedSnapshot] = useState<ComparableSnapshot | null>(null);
  const [snapshotToCompare, setSnapshotToCompare] = useState<ComparableSnapshot | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [showFieldMappingDialog, setShowFieldMappingDialog] = useState(false);
  
  // Get unique sources for filtering
  const sources = Array.from(new Set(snapshots.map(s => s.source)));
  
  // Filter snapshots based on selected source
  const filteredSnapshots = sourceFilter 
    ? snapshots.filter(s => s.source === sourceFilter)
    : snapshots;
  
  // Sort snapshots by createdAt (newest first)
  const sortedSnapshots = [...filteredSnapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Handle snapshot selection
  const handleSelectSnapshot = (snapshot: ComparableSnapshot) => {
    if (selectedTab === 'history') {
      setSelectedSnapshot(snapshot);
    } else {
      // In compare mode, we either set the first or second snapshot
      if (!selectedSnapshot) {
        setSelectedSnapshot(snapshot);
      } else if (selectedSnapshot.id === snapshot.id) {
        // Deselect if clicking the same one
        setSelectedSnapshot(null);
      } else {
        setSnapshotToCompare(snapshot);
      }
    }
  };
  
  // Handle pushing a snapshot to a form
  const handlePushToForm = (snapshot: ComparableSnapshot) => {
    setSelectedSnapshot(snapshot);
    setShowFieldMappingDialog(true);
  };
  
  // Reset selections when changing tabs
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as 'history' | 'compare');
    setSelectedSnapshot(null);
    setSnapshotToCompare(null);
  };
  
  // Render content based on loading and error states
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Property Snapshots</CardTitle>
          <CardDescription>Loading snapshot history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Property Snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load snapshot history: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (snapshots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Property Snapshots</CardTitle>
          <CardDescription>Historical record of property data changes</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Snapshots</AlertTitle>
            <AlertDescription>
              There are no snapshots available for this property.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Property Snapshots</CardTitle>
            <CardDescription>Historical record of property data changes</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-[160px]">
              <Select 
                value={sourceFilter || ''} 
                onValueChange={(value) => setSourceFilter(value || null)}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-1" />
                    <SelectValue placeholder="All Sources" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sources</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="compare">
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              Compare
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="space-y-4">
            {selectedSnapshot ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {sortedSnapshots.map(snapshot => (
                        <SnapshotTile
                          key={snapshot.id}
                          snapshot={snapshot}
                          selected={selectedSnapshot?.id === snapshot.id}
                          onSelect={() => handleSelectSnapshot(snapshot)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          Snapshot Details
                        </CardTitle>
                        <Button variant="outline" onClick={() => handlePushToForm(selectedSnapshot)}>
                          <Share className="h-4 w-4 mr-1" />
                          Push to Form
                        </Button>
                      </div>
                      <CardDescription>
                        {selectedSnapshot.source} • {new Date(selectedSnapshot.createdAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Property Information</h3>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {Object.entries(selectedSnapshot.fields).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Label>
                                <div className="text-sm">
                                  {typeof value === 'string' && value.includes('T')
                                    ? new Date(value).toLocaleDateString()
                                    : String(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSnapshots.map(snapshot => (
                  <SnapshotTile
                    key={snapshot.id}
                    snapshot={snapshot}
                    onSelect={() => handleSelectSnapshot(snapshot)}
                    onPushToForm={() => handlePushToForm(snapshot)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="compare">
            <div className="space-y-4">
              {selectedSnapshot && snapshotToCompare ? (
                <SnapshotDiff
                  before={selectedSnapshot}
                  after={snapshotToCompare}
                  onPushToForm={handlePushToForm}
                />
              ) : (
                <>
                  <Alert>
                    <FileHistory className="h-4 w-4" />
                    <AlertTitle>Compare Snapshots</AlertTitle>
                    <AlertDescription>
                      Select two snapshots to see how the property data has changed over time.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedSnapshots.map(snapshot => (
                      <SnapshotTile
                        key={snapshot.id}
                        snapshot={snapshot}
                        selected={
                          selectedSnapshot?.id === snapshot.id || 
                          snapshotToCompare?.id === snapshot.id
                        }
                        onSelect={() => handleSelectSnapshot(snapshot)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Field Mapping Dialog */}
      {selectedSnapshot && (
        <FieldMappingDialog
          open={showFieldMappingDialog}
          onOpenChange={setShowFieldMappingDialog}
          snapshot={selectedSnapshot}
        />
      )}
    </Card>
  );
}