import React from 'react';
import { format } from 'date-fns';
import { ComparableSnapshot } from '@shared/types/comps';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusIcon, MinusIcon, ArrowRightIcon } from 'lucide-react';

interface SnapshotDiffProps {
  oldSnapshot: ComparableSnapshot;
  newSnapshot: ComparableSnapshot;
}

type Change = {
  key: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'changed';
};

export function SnapshotDiff({ oldSnapshot, newSnapshot }: SnapshotDiffProps) {
  // Generate the diff between the two snapshots
  const changes = getDiff(oldSnapshot.fields, newSnapshot.fields);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  // Helper to format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  // Helper to get cell style based on change type
  const getCellStyle = (changeType: string, isOld: boolean) => {
    if (changeType === 'added' && !isOld) return 'bg-green-100 dark:bg-green-900/20';
    if (changeType === 'removed' && isOld) return 'bg-red-100 dark:bg-red-900/20';
    if (changeType === 'changed') {
      return isOld 
        ? 'bg-amber-100 dark:bg-amber-900/20' 
        : 'bg-green-100 dark:bg-green-900/20';
    }
    return '';
  };
  
  // Helper to get change icon
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <PlusIcon className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <MinusIcon className="h-4 w-4 text-red-500" />;
      case 'changed':
        return <ArrowRightIcon className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          Comparing Snapshots
        </CardTitle>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 mt-2 text-sm">
          <div className="flex flex-col space-y-1">
            <span className="font-medium">From:</span>
            <Badge variant="outline" className="w-fit">
              {oldSnapshot.source} - {formatDate(oldSnapshot.createdAt)}
            </Badge>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-medium">To:</span>
            <Badge variant="outline" className="w-fit">
              {newSnapshot.source} - {formatDate(newSnapshot.createdAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Change</TableHead>
                <TableHead className="w-[200px]">Field</TableHead>
                <TableHead className="w-[250px]">Old Value</TableHead>
                <TableHead className="w-[250px]">New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No differences found between snapshots
                  </TableCell>
                </TableRow>
              ) : (
                changes.map((change, index) => (
                  <TableRow key={index}>
                    <TableCell>{getChangeIcon(change.changeType)}</TableCell>
                    <TableCell className="font-medium">{change.key}</TableCell>
                    <TableCell className={getCellStyle(change.changeType, true)}>
                      {formatValue(change.oldValue)}
                    </TableCell>
                    <TableCell className={getCellStyle(change.changeType, false)}>
                      {formatValue(change.newValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper to get differences between two objects
function getDiff(oldObj: Record<string, any>, newObj: Record<string, any>): Change[] {
  const changes: Change[] = [];
  
  // Check for fields present in both, or only in old object
  Object.keys(oldObj).forEach(key => {
    if (key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes.push({
          key,
          oldValue: oldObj[key],
          newValue: newObj[key],
          changeType: 'changed'
        });
      }
    } else {
      changes.push({
        key,
        oldValue: oldObj[key],
        newValue: null,
        changeType: 'removed'
      });
    }
  });
  
  // Check for fields only in the new object
  Object.keys(newObj).forEach(key => {
    if (!(key in oldObj)) {
      changes.push({
        key,
        oldValue: null,
        newValue: newObj[key],
        changeType: 'added'
      });
    }
  });
  
  // Sort changes by key for consistency
  return changes.sort((a, b) => a.key.localeCompare(b.key));
}