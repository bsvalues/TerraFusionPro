import { useState, useMemo } from 'react';
import { useSnapshotHistory } from '@/hooks/useSnapshotHistory';
import { ComparableSnapshot } from '@shared/types/comps';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  History,
  RefreshCw,
  Search,
  Filter,
  Clock,
  SortAsc,
  SortDesc,
  FileText,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import SnapshotDiff from './SnapshotDiff';
import FieldMappingDialog from './FieldMappingDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface SnapshotViewerProps {
  propertyId: string;
  onBack?: () => void;
}

export function SnapshotViewer({ propertyId, onBack }: SnapshotViewerProps) {
  const { snapshots, isLoading, error, pushToForm, refetch } = useSnapshotHistory(propertyId);

  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // State for selected snapshots (for viewing details or comparison)
  const [selectedSnapshot, setSelectedSnapshot] = useState<ComparableSnapshot | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<ComparableSnapshot | null>(null);
  
  // State for field mapping dialog
  const [isFieldMappingOpen, setIsFieldMappingOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('list');

  // Filter and sort snapshots
  const filteredSnapshots = useMemo(() => {
    if (!snapshots) return [];
    
    let filtered = [...snapshots];
    
    // Apply source filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(snapshot => snapshot.source === filterBy);
    }
    
    // Apply search filter (searches in fields and metadata)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(snapshot => {
        // Search in fields
        const fieldsMatch = Object.entries(snapshot.fields).some(([key, value]) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        });
        
        // Search in metadata if it exists
        const metadataMatch = snapshot.metadata ? 
          Object.entries(snapshot.metadata).some(([key, value]) => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(query);
            }
            return false;
          }) : false;
          
        // Search in source
        const sourceMatch = snapshot.source.toLowerCase().includes(query);
        
        return fieldsMatch || metadataMatch || sourceMatch;
      });
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'version-asc':
        filtered.sort((a, b) => a.version - b.version);
        break;
      case 'version-desc':
        filtered.sort((a, b) => b.version - a.version);
        break;
      case 'source':
        filtered.sort((a, b) => a.source.localeCompare(b.source));
        break;
    }
    
    return filtered;
  }, [snapshots, searchQuery, filterBy, sortBy]);

  // Unique sources for filter dropdown
  const sources = useMemo(() => {
    if (!snapshots) return [];
    const uniqueSources = [...new Set(snapshots.map(snapshot => snapshot.source))];
    return uniqueSources;
  }, [snapshots]);

  // Handle snapshot selection
  const handleSelectSnapshot = (snapshot: ComparableSnapshot) => {
    setSelectedSnapshot(snapshot);
    setCurrentTab('details');
  };
  
  // Handle snapshot comparison
  const handleCompareSnapshot = (snapshot: ComparableSnapshot) => {
    if (selectedSnapshot) {
      setCompareSnapshot(snapshot);
      setCurrentTab('compare');
    } else {
      setSelectedSnapshot(snapshot);
      setCurrentTab('details');
    }
  };
  
  // Handle pushing to form
  const handlePushToForm = (snapshot: ComparableSnapshot) => {
    setSelectedSnapshot(snapshot);
    setIsFieldMappingOpen(true);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Snapshot History</h2>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Snapshot History</h2>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Snapshots</h3>
          <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load snapshots'}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Snapshot History</h2>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        )}
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">
            <History className="mr-2 h-4 w-4" /> Snapshot List
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedSnapshot}>
            <FileText className="mr-2 h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="compare" disabled={!selectedSnapshot || !compareSnapshot}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Compare
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search snapshots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {sortBy.includes('date') ? (
                <Clock className="h-4 w-4 text-muted-foreground" />
              ) : sortBy.includes('version') ? (
                <History className="h-4 w-4 text-muted-foreground" />
              ) : (
                sortBy === 'source' && <Filter className="h-4 w-4 text-muted-foreground" />
              )}
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">
                    <div className="flex items-center">
                      <SortDesc className="mr-2 h-4 w-4" /> Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center">
                      <SortAsc className="mr-2 h-4 w-4" /> Oldest First
                    </div>
                  </SelectItem>
                  <SelectItem value="version-desc">Version (High to Low)</SelectItem>
                  <SelectItem value="version-asc">Version (Low to High)</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSnapshots.length === 0 ? (
              <Card className="p-6 col-span-full text-center">
                <p className="text-muted-foreground">No snapshots found. Try adjusting your filters.</p>
              </Card>
            ) : (
              filteredSnapshots.map(snapshot => (
                <Card key={snapshot.id} className="p-4 flex flex-col">
                  <div className="mb-2 flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        Version {snapshot.version}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(snapshot.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <Badge variant={
                      snapshot.source === 'mls import' ? 'default' :
                      snapshot.source === 'manual edit' ? 'outline' :
                      snapshot.source === 'api update' ? 'secondary' :
                      'default'
                    }>
                      {snapshot.source}
                    </Badge>
                  </div>
                  
                  <div className="text-sm space-y-1 mb-4 flex-1">
                    {snapshot.fields.address && (
                      <p><strong>Address:</strong> {snapshot.fields.address}</p>
                    )}
                    {snapshot.fields.price !== undefined && (
                      <p><strong>Price:</strong> ${snapshot.fields.price.toLocaleString()}</p>
                    )}
                    {snapshot.fields.status && (
                      <p><strong>Status:</strong> {snapshot.fields.status}</p>
                    )}
                    {snapshot.metadata?.tags && snapshot.metadata.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {snapshot.metadata.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectSnapshot(snapshot)}
                    >
                      View Details
                    </Button>
                    <div className="space-x-1">
                      <Button
                        variant="secondary"
                        size="sm" 
                        onClick={() => handleCompareSnapshot(snapshot)}
                        disabled={selectedSnapshot?.id === snapshot.id}
                      >
                        Compare
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePushToForm(snapshot)}
                      >
                        Push to Form
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          {selectedSnapshot && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Snapshot Details</h3>
                <Badge>Version {selectedSnapshot.version}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="space-y-2">
                    <p><strong>ID:</strong> {selectedSnapshot.id}</p>
                    <p><strong>Property ID:</strong> {selectedSnapshot.propertyId}</p>
                    <p><strong>Created:</strong> {format(new Date(selectedSnapshot.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    <p><strong>Source:</strong> {selectedSnapshot.source}</p>
                    {selectedSnapshot.metadata && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-1">Additional Metadata</h5>
                        {Object.entries(selectedSnapshot.metadata)
                          .filter(([key, value]) => value !== undefined && key !== 'tags')
                          .map(([key, value]) => (
                            <p key={key} className="text-sm">
                              <strong>{key}:</strong> {typeof value === 'string' ? value : JSON.stringify(value)}
                            </p>
                          ))
                        }
                        {selectedSnapshot.metadata.tags && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Tags:</p>
                            <div className="flex gap-1 flex-wrap">
                              {selectedSnapshot.metadata.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Property Data</h4>
                  <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                    {Object.entries(selectedSnapshot.fields).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSnapshot(null);
                    setCompareSnapshot(null);
                    setCurrentTab('list');
                  }}
                >
                  Back to List
                </Button>
                <Button onClick={() => handlePushToForm(selectedSnapshot)}>
                  Push to Form
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compare">
          {selectedSnapshot && compareSnapshot && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Snapshot Comparison</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">Base: v{selectedSnapshot.version}</Badge>
                  <Badge variant="outline">Compare: v{compareSnapshot.version}</Badge>
                </div>
              </div>
              
              <SnapshotDiff 
                baseSnapshot={selectedSnapshot} 
                compareSnapshot={compareSnapshot} 
              />
              
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompareSnapshot(null);
                    setCurrentTab('details');
                  }}
                >
                  Back to Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSnapshot(null);
                    setCompareSnapshot(null);
                    setCurrentTab('list');
                  }}
                >
                  Back to List
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {isFieldMappingOpen && selectedSnapshot && (
        <FieldMappingDialog
          snapshot={selectedSnapshot}
          onClose={() => setIsFieldMappingOpen(false)}
          onPushToForm={(formId, fieldMappings) => {
            pushToForm(selectedSnapshot, formId, fieldMappings);
            setIsFieldMappingOpen(false);
          }}
        />
      )}
    </div>
  );
}