/**
 * SnapshotDiff Component
 * 
 * Displays a visual comparison between two snapshots highlighting the differences
 */
import React, { useState, useMemo } from 'react';
import { ComparableSnapshot } from '../../../shared/types/comps';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  Plus, 
  Minus, 
  ArrowLeftRight, 
  User,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';

interface SnapshotDiffProps {
  before: ComparableSnapshot;
  after: ComparableSnapshot;
}

export function SnapshotDiff({ before, after }: SnapshotDiffProps) {
  const [diffView, setDiffView] = useState<'all' | 'added' | 'removed' | 'changed'>('all');
  
  // Compute differences between the two snapshots
  const diff = useMemo(() => {
    const beforeFields = before.fields;
    const afterFields = after.fields;
    
    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];
    const unchanged: string[] = [];
    
    // Check for added and changed fields
    Object.keys(afterFields).forEach(key => {
      if (!(key in beforeFields)) {
        added.push(key);
      } else if (beforeFields[key] !== afterFields[key]) {
        changed.push(key);
      } else {
        unchanged.push(key);
      }
    });
    
    // Check for removed fields
    Object.keys(beforeFields).forEach(key => {
      if (!(key in afterFields)) {
        removed.push(key);
      }
    });
    
    return { added, removed, changed, unchanged };
  }, [before, after]);
  
  // Get visible fields based on the current filter
  const getVisibleFields = () => {
    switch (diffView) {
      case 'added':
        return diff.added;
      case 'removed':
        return diff.removed;
      case 'changed':
        return diff.changed;
      case 'all':
      default:
        return [
          ...diff.added,
          ...diff.removed,
          ...diff.changed,
          ...diff.unchanged
        ];
    }
  };
  
  const visibleFields = getVisibleFields();
  
  // Sort fields by category for better display
  const sortedFields = visibleFields.sort((a, b) => {
    // Sort by status (added, removed, changed, unchanged)
    if (diff.added.includes(a) && !diff.added.includes(b)) return -1;
    if (!diff.added.includes(a) && diff.added.includes(b)) return 1;
    if (diff.removed.includes(a) && !diff.removed.includes(b)) return -1;
    if (!diff.removed.includes(a) && diff.removed.includes(b)) return 1;
    if (diff.changed.includes(a) && !diff.changed.includes(b)) return -1;
    if (!diff.changed.includes(a) && diff.changed.includes(b)) return 1;
    
    // Alphabetical sorting within same status
    return a.localeCompare(b);
  });
  
  // Helper to get the status badge for a field
  const getFieldStatus = (field: string) => {
    if (diff.added.includes(field)) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-xs">Added</Badge>;
    }
    if (diff.removed.includes(field)) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 text-xs">Removed</Badge>;
    }
    if (diff.changed.includes(field)) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-xs">Changed</Badge>;
    }
    return null;
  };
  
  // Helper to format field values for display
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">null</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Comparing Snapshots</h3>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {format(new Date(before.createdAt), 'MMM d, yyyy h:mm a')}
                {' '} ⟶ {' '}
                {format(new Date(after.createdAt), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{before.source} ⟶ {after.source}</span>
            </div>
            <div className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              <span>{before.id} ⟶ {after.id}</span>
            </div>
          </div>
        </div>
        
        <Tabs 
          value={diffView} 
          onValueChange={(v) => setDiffView(v as 'all' | 'added' | 'removed' | 'changed')}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all" className="text-xs">
              All ({sortedFields.length})
            </TabsTrigger>
            <TabsTrigger value="added" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Added ({diff.added.length})
            </TabsTrigger>
            <TabsTrigger value="removed" className="text-xs">
              <Minus className="h-3 w-3 mr-1" />
              Removed ({diff.removed.length})
            </TabsTrigger>
            <TabsTrigger value="changed" className="text-xs">
              <ArrowLeftRight className="h-3 w-3 mr-1" />
              Changed ({diff.changed.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Diff details */}
      <div className="border rounded-md">
        <div className="grid grid-cols-12 gap-2 p-3 border-b bg-muted/30 text-xs font-medium">
          <div className="col-span-3">Field</div>
          <div className="col-span-4">From</div>
          <div className="col-span-4">To</div>
          <div className="col-span-1">Status</div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {sortedFields.length > 0 ? (
            sortedFields.map((field) => (
              <div 
                key={field} 
                className={`
                  grid grid-cols-12 gap-2 p-3 border-b hover:bg-muted/10 transition-colors last:border-b-0 text-sm
                  ${diff.changed.includes(field) ? 'bg-blue-50' : ''}
                  ${diff.added.includes(field) ? 'bg-green-50' : ''}
                  ${diff.removed.includes(field) ? 'bg-red-50' : ''}
                `}
              >
                <div className="col-span-3 font-medium truncate">
                  {field}
                </div>
                
                <div className="col-span-4 break-words">
                  {diff.added.includes(field) ? (
                    <span className="text-muted-foreground italic">n/a</span>
                  ) : (
                    <span className={diff.changed.includes(field) ? 'text-red-600' : ''}>
                      {formatValue(before.fields[field])}
                    </span>
                  )}
                </div>
                
                <div className="col-span-4 break-words">
                  {diff.removed.includes(field) ? (
                    <span className="text-muted-foreground italic">n/a</span>
                  ) : (
                    <span className={diff.changed.includes(field) || diff.added.includes(field) ? 'text-green-600' : ''}>
                      {formatValue(after.fields[field])}
                    </span>
                  )}
                </div>
                
                <div className="col-span-1">
                  {getFieldStatus(field)}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No differences found in this category
            </div>
          )}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Summary:</span> {diff.added.length} fields added, {diff.removed.length} fields removed, {diff.changed.length} fields changed
      </div>
    </div>
  );
}