import { useMemo } from 'react';
import { ComparableSnapshot } from '@shared/types/comps';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SnapshotDiffProps {
  baseSnapshot: ComparableSnapshot;
  compareSnapshot: ComparableSnapshot;
}

type DiffType = 'added' | 'removed' | 'changed' | 'unchanged';

interface FieldDiff {
  key: string;
  diffType: DiffType;
  baseValue: any;
  compareValue: any;
}

export default function SnapshotDiff({ baseSnapshot, compareSnapshot }: SnapshotDiffProps) {
  // Calculate the differences between snapshots
  const fieldDiffs = useMemo<FieldDiff[]>(() => {
    const diffs: FieldDiff[] = [];
    const allKeys = new Set<string>([
      ...Object.keys(baseSnapshot.fields),
      ...Object.keys(compareSnapshot.fields)
    ]);
    
    allKeys.forEach(key => {
      const baseHasKey = key in baseSnapshot.fields;
      const compareHasKey = key in compareSnapshot.fields;
      const baseValue = baseSnapshot.fields[key];
      const compareValue = compareSnapshot.fields[key];
      
      if (!baseHasKey) {
        // Field was added in the compare snapshot
        diffs.push({
          key,
          diffType: 'added',
          baseValue: undefined,
          compareValue
        });
      } else if (!compareHasKey) {
        // Field was removed in the compare snapshot
        diffs.push({
          key,
          diffType: 'removed',
          baseValue,
          compareValue: undefined
        });
      } else if (JSON.stringify(baseValue) !== JSON.stringify(compareValue)) {
        // Field value changed
        diffs.push({
          key,
          diffType: 'changed',
          baseValue,
          compareValue
        });
      } else {
        // Field value unchanged
        diffs.push({
          key,
          diffType: 'unchanged',
          baseValue,
          compareValue
        });
      }
    });
    
    // Sort diffs by type (changed/added/removed first, then unchanged)
    return diffs.sort((a, b) => {
      if (a.diffType !== 'unchanged' && b.diffType === 'unchanged') return -1;
      if (a.diffType === 'unchanged' && b.diffType !== 'unchanged') return 1;
      return a.key.localeCompare(b.key);
    });
  }, [baseSnapshot, compareSnapshot]);
  
  // Group diffs by type
  const { 
    changedFields, 
    addedFields, 
    removedFields, 
    unchangedFields 
  } = useMemo(() => {
    return {
      changedFields: fieldDiffs.filter(diff => diff.diffType === 'changed'),
      addedFields: fieldDiffs.filter(diff => diff.diffType === 'added'),
      removedFields: fieldDiffs.filter(diff => diff.diffType === 'removed'),
      unchangedFields: fieldDiffs.filter(diff => diff.diffType === 'unchanged')
    };
  }, [fieldDiffs]);
  
  // Calculate the version difference direction
  const versionDiff = compareSnapshot.version - baseSnapshot.version;
  
  // Format values for display
  const formatValue = (value: any): string => {
    if (value === undefined) return '—';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  
  // Helper to generate badge for diff types
  const getDiffBadge = (diffType: DiffType) => {
    switch (diffType) {
      case 'added':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Added</Badge>;
      case 'removed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Removed</Badge>;
      case 'changed':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Changed</Badge>;
      default:
        return null;
    }
  };
  
  // Helper to generate icon for diff types
  const getDiffIcon = (diffType: DiffType) => {
    switch (diffType) {
      case 'added':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changed':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <MinusCircle className="h-4 w-4 text-gray-300" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <h3 className="text-lg font-medium mb-1">Snapshot Diff Summary</h3>
          <p className="text-sm text-muted-foreground">
            Comparing version {baseSnapshot.version} ({new Date(baseSnapshot.createdAt).toLocaleDateString()})
            {versionDiff > 0 ? ' to ' : ' from '}
            version {compareSnapshot.version} ({new Date(compareSnapshot.createdAt).toLocaleDateString()})
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700">Changed: {changedFields.length}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-700">Added: {addedFields.length}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700">Removed: {removedFields.length}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-sm">
            <MinusCircle className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Unchanged: {unchangedFields.length}</span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="changes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="changes">
            Changes Only ({changedFields.length + addedFields.length + removedFields.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Fields ({fieldDiffs.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="changes">
          <div className="space-y-4">
            {changedFields.length === 0 && addedFields.length === 0 && removedFields.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No differences found between these snapshots.</p>
              </Card>
            ) : (
              <>
                {changedFields.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Changed Fields</h4>
                    <Card className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              Field
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              Base Value (v{baseSnapshot.version})
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                              Compare Value (v{compareSnapshot.version})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {changedFields.map((diff) => (
                            <tr key={diff.key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  {getDiffIcon(diff.diffType)}
                                  {diff.key}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 bg-red-50">
                                {formatValue(diff.baseValue)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 bg-green-50">
                                {formatValue(diff.compareValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}
                
                {addedFields.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Added Fields</h4>
                    <Card className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                              Field
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {addedFields.map((diff) => (
                            <tr key={diff.key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  {getDiffIcon(diff.diffType)}
                                  {diff.key}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 bg-green-50">
                                {formatValue(diff.compareValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}
                
                {removedFields.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Removed Fields</h4>
                    <Card className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                              Field
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                              Previous Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {removedFields.map((diff) => (
                            <tr key={diff.key} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  {getDiffIcon(diff.diffType)}
                                  {diff.key}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 bg-red-50">
                                {formatValue(diff.baseValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <Card className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Field
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Base Value (v{baseSnapshot.version})
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Compare Value (v{compareSnapshot.version})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fieldDiffs.map((diff) => (
                  <tr 
                    key={diff.key} 
                    className={`hover:bg-gray-50 ${
                      diff.diffType === 'unchanged' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {getDiffIcon(diff.diffType)}
                        {diff.key}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {diff.diffType !== 'unchanged' && getDiffBadge(diff.diffType)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-700 ${
                      diff.diffType === 'changed' || diff.diffType === 'removed' 
                        ? 'bg-red-50' 
                        : ''
                    }`}>
                      {formatValue(diff.baseValue)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-700 ${
                      diff.diffType === 'changed' || diff.diffType === 'added' 
                        ? 'bg-green-50' 
                        : ''
                    }`}>
                      {formatValue(diff.compareValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}