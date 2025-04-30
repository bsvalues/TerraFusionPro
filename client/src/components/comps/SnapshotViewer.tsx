import React, { useState } from 'react';
import { useSnapshotHistory } from '@/hooks/useSnapshotHistory';
import { SnapshotTile } from './SnapshotTile';
import { ComparableSnapshot } from '@/shared/types/comps';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Loader2, XCircle, History, Search, Layers, Shield } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FieldMappingDialog } from './FieldMappingDialog';

interface SnapshotViewerProps {
  addressId: string | null;
  formId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SnapshotViewer({ 
  addressId, 
  formId,
  open, 
  onOpenChange 
}: SnapshotViewerProps) {
  const { snapshots, isLoading, isError } = useSnapshotHistory(addressId);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ComparableSnapshot | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  
  // Group snapshots by source
  const groupedSnapshots = snapshots.reduce((acc, snap) => {
    (acc[snap.source] ||= []).push(snap);
    return acc;
  }, {} as Record<string, ComparableSnapshot[]>);

  const handlePushToForm = (snapshot: ComparableSnapshot) => {
    if (!formId) return;
    
    setSelectedSnapshot(snapshot);
    setShowMappingDialog(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] md:w-[640px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle>Property History</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <XCircle className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
          <SheetDescription>
            View and compare historical data snapshots from different sources
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col">
          <TabsList className="px-4 pt-2">
            <TabsTrigger value="history" className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Data History
            </TabsTrigger>
            <TabsTrigger value="diffs" className="flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Verification
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <LoadingSpinner size="lg" />
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">Loading history...</h3>
                      <p className="text-sm text-muted-foreground">Retrieving snapshots for this property</p>
                    </div>
                  </div>
                ) : isError ? (
                  <div className="flex items-center justify-center py-10 text-destructive">
                    <XCircle className="h-8 w-8 mr-2" />
                    <div>
                      <h3 className="text-lg font-medium">Error loading snapshots</h3>
                      <p className="text-sm">Unable to retrieve property history</p>
                    </div>
                  </div>
                ) : !snapshots.length ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Search className="h-16 w-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No snapshots available</h3>
                    <p className="text-sm text-center max-w-md mt-1">
                      This property doesn't have any historical data. Snapshots are created when data is imported or changed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedSnapshots).map(([source, snaps]) => (
                      <div key={source}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center">
                          {source} Snapshots
                          <span className="ml-2 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                            {snaps.length}
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {snaps.map(snap => (
                            <SnapshotTile 
                              key={snap.id} 
                              snapshot={snap} 
                              onPushToForm={formId ? handlePushToForm : undefined}
                              isSelected={selectedSnapshot?.id === snap.id}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="diffs" className="flex-1">
            <div className="p-4 flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Layers className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Compare Snapshots</h3>
              <p className="text-sm text-center max-w-md mt-1">
                Select snapshots from the history tab to compare changes between versions
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="verification" className="flex-1">
            <div className="p-4 flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Data Verification</h3>
              <p className="text-sm text-center max-w-md mt-1">
                Verify data accuracy and detect inconsistencies across sources
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
      
      {selectedSnapshot && formId && (
        <FieldMappingDialog
          open={showMappingDialog}
          onOpenChange={setShowMappingDialog}
          snapshot={selectedSnapshot}
          formId={formId}
        />
      )}
    </Sheet>
  );
}