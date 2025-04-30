/**
 * SnapshotViewer Component
 * 
 * Displays a list of snapshots for a property and allows comparing them or pushing to forms
 */
import React, { useState } from 'react';
import { SnapshotTile } from './SnapshotTile';
import { SnapshotDiff } from './SnapshotDiff';
import { FieldMappingDialog } from './FieldMappingDialog';
import { ComparableSnapshot } from '../../../shared/types/comps';
import { useSnapshotHistory } from '../../hooks/useSnapshotHistory';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { 
  ArrowLeftRight, 
  Clock, 
  History,
  AlertTriangle, 
  Info,
  FileOutput
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SnapshotViewerProps {
  propertyId: string;
  onBack?: () => void;
}

export function SnapshotViewer({ propertyId, onBack }: SnapshotViewerProps) {
  const [selectedSnapshots, setSelectedSnapshots] = useState<ComparableSnapshot[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'compare'>('list');
  const { toast } = useToast();
  
  // Fetch snapshots using our hook
  const { 
    snapshots, 
    isLoading, 
    error, 
    pushToForm
  } = useSnapshotHistory(propertyId);
  
  // Update selected snapshot
  const handleSnapshotSelect = (snapshot: ComparableSnapshot) => {
    // If already selected, remove it
    if (selectedSnapshots.some(s => s.id === snapshot.id)) {
      setSelectedSnapshots(prev => prev.filter(s => s.id !== snapshot.id));
      return;
    }
    
    // If we have 2 selected already and we're in compare mode, replace the oldest one
    if (selectedSnapshots.length >= 2 && activeView === 'compare') {
      setSelectedSnapshots(prev => [prev[1], snapshot]);
      return;
    }
    
    // Otherwise add it to the selected snapshots
    setSelectedSnapshots(prev => [...prev, snapshot]);
    
    // If we now have 2 snapshots selected, switch to compare view
    if (selectedSnapshots.length === 1) {
      setActiveView('compare');
    }
  };
  
  // Handle pushing snapshot to form
  const handlePushToForm = (snapshot: ComparableSnapshot) => {
    // Use the Field Mapping Dialog to show mapping UI
    setSelectedSnapshots([snapshot]);
  };
  
  // Apply the field mappings and push to form
  const applyFieldMappings = (formId: string, fieldMappings: Record<string, string>) => {
    if (selectedSnapshots.length === 0) return;
    
    const snapshot = selectedSnapshots[0];
    
    // Temporary: Just show a toast here. In a real implementation, 
    // this would call the pushToForm function from the hook
    toast({
      title: 'Fields pushed to form',
      description: `${Object.keys(fieldMappings).length} fields pushed to form ${formId}`,
    });
    
    // Call the actual push function from our hook
    pushToForm(snapshot, formId, fieldMappings);
  };
  
  // Reset selection and view
  const resetSelection = () => {
    setSelectedSnapshots([]);
    setActiveView('list');
  };
  
  // Start comparing two snapshots
  const startCompare = (snapshot: ComparableSnapshot) => {
    setSelectedSnapshots([snapshot]);
    setActiveView('compare');
  };
  
  // Check if we can compare (need exactly 2 snapshots)
  const canCompare = selectedSnapshots.length === 2;
  
  // Check if a snapshot is selected
  const isSelected = (snapshot: ComparableSnapshot) => {
    return selectedSnapshots.some(s => s.id === snapshot.id);
  };
  
  // Sort snapshots by date (newest first)
  const sortedSnapshots = [...(snapshots || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading snapshots...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <p className="mt-2 font-medium">Failed to load snapshots</p>
            <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="mt-4">
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No snapshots state
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8">
            <Info className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 font-medium">No Snapshot History</p>
            <p className="mt-1 text-sm text-muted-foreground text-center">
              There are no snapshots available for this property.
              <br />
              Snapshots are created when comps are edited, compared, or pushed to forms.
            </p>
            {onBack && (
              <Button variant="outline" onClick={onBack} className="mt-4">
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'compare')}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Snapshot History ({snapshots.length})
            </CardTitle>
            
            <TabsList className="grid grid-cols-2 w-[260px]">
              <TabsTrigger value="list" disabled={selectedSnapshots.length === 2}>
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="compare" disabled={!canCompare}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Compare ({selectedSnapshots.length}/2)
              </TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>
            {activeView === 'list' 
              ? 'Select two snapshots to compare or push a snapshot to form' 
              : 'Comparing snapshots from different points in time'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-3">
          <TabsContent value="list" className="m-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedSnapshots.map((snapshot) => (
                <SnapshotTile
                  key={snapshot.id}
                  snapshot={snapshot}
                  isSelected={isSelected(snapshot)}
                  onSelect={() => handleSnapshotSelect(snapshot)}
                  onCompare={() => startCompare(snapshot)}
                  onPush={() => handlePushToForm(snapshot)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="compare" className="m-0">
            {canCompare ? (
              <SnapshotDiff 
                before={selectedSnapshots[0]} 
                after={selectedSnapshots[1]} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {selectedSnapshots.length === 0 
                    ? 'Select two snapshots to compare' 
                    : 'Select one more snapshot to compare'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveView('list')}
                >
                  Back to Timeline
                </Button>
              </div>
            )}
          </TabsContent>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          
          <div className="flex gap-2">
            {selectedSnapshots.length > 0 && (
              <Button variant="outline" onClick={resetSelection}>
                Reset Selection
              </Button>
            )}
            
            {selectedSnapshots.length === 1 && (
              <FieldMappingDialog
                snapshot={selectedSnapshots[0]}
                onPushToForm={applyFieldMappings}
              >
                <Button>
                  <FileOutput className="h-4 w-4 mr-2" />
                  Push to Form
                </Button>
              </FieldMappingDialog>
            )}
          </div>
        </CardFooter>
      </Card>
    </Tabs>
  );
}