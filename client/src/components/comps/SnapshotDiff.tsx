/**
 * SnapshotDiff Component
 * 
 * Displays the differences between two snapshots
 */
import React, { useMemo } from 'react';
import {
  ComparableSnapshot,
  SnapshotDifference,
  FieldChange,
  FieldValueChange
} from '../../../shared/types/comps';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, RefreshCw, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SnapshotDiffProps {
  before: ComparableSnapshot;
  after: ComparableSnapshot;
  differences: SnapshotDifference;
}

export function SnapshotDiff({ before, after, differences }: SnapshotDiffProps) {
  const { added, removed, changed } = differences;
  
  const beforeDate = useMemo(() => new Date(before.createdAt), [before]);
  const afterDate = useMemo(() => new Date(after.createdAt), [after]);
  
  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object') {
      return <pre className="text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    return String(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Snapshot Comparison
          <Badge variant="outline" className="ml-2">
            {format(beforeDate, 'MMM d, yyyy')} - {format(afterDate, 'MMM d, yyyy')}
          </Badge>
        </CardTitle>
        <CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Before:</span>
              <span className="font-medium">{before.source}</span>
              <span className="text-xs flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDistanceToNow(beforeDate, { addSuffix: true })}
              </span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">After:</span>
              <span className="font-medium">{after.source}</span>
              <span className="text-xs flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDistanceToNow(afterDate, { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="changed">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="changed" className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Changed ({changed.length})
            </TabsTrigger>
            <TabsTrigger value="added" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Added ({added.length})
            </TabsTrigger>
            <TabsTrigger value="removed" className="flex items-center">
              <Minus className="h-4 w-4 mr-2" />
              Removed ({removed.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="changed">
            {changed.length > 0 ? (
              <Table>
                <TableCaption>Changed fields between snapshots</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Field</TableHead>
                    <TableHead className="w-[37.5%]">Before</TableHead>
                    <TableHead className="w-[37.5%]">After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changed.map((item: FieldValueChange) => (
                    <TableRow key={item.field}>
                      <TableCell className="font-medium">{item.field}</TableCell>
                      <TableCell className="bg-rose-50/30 dark:bg-rose-950/30">
                        {renderFieldValue(item.fromValue)}
                      </TableCell>
                      <TableCell className="bg-emerald-50/30 dark:bg-emerald-950/30">
                        {renderFieldValue(item.toValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No changed fields between these snapshots
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="added">
            {added.length > 0 ? (
              <Table>
                <TableCaption>Fields added in newer snapshot</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Field</TableHead>
                    <TableHead className="w-2/3">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {added.map((item: FieldChange) => (
                    <TableRow key={item.field}>
                      <TableCell className="font-medium">{item.field}</TableCell>
                      <TableCell className="bg-emerald-50/30 dark:bg-emerald-950/30">
                        {renderFieldValue(item.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No fields were added in the newer snapshot
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="removed">
            {removed.length > 0 ? (
              <Table>
                <TableCaption>Fields removed in newer snapshot</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Field</TableHead>
                    <TableHead className="w-2/3">Previous Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {removed.map((item: FieldChange) => (
                    <TableRow key={item.field}>
                      <TableCell className="font-medium">{item.field}</TableCell>
                      <TableCell className="bg-rose-50/30 dark:bg-rose-950/30">
                        {renderFieldValue(item.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                No fields were removed in the newer snapshot
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}