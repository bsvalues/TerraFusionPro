import React from 'react';
import { ComparableSnapshot } from '@/shared/types/comps';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  PlusCircle, 
  MinusCircle, 
  Edit,
  CornerDownRight 
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

interface SnapshotDiffProps {
  before: ComparableSnapshot;
  after: ComparableSnapshot;
  onPushToForm?: (snapshot: ComparableSnapshot) => void;
}

export function SnapshotDiff({ before, after, onPushToForm }: SnapshotDiffProps) {
  // Format dates
  const beforeDate = format(new Date(before.createdAt), 'MMM d, yyyy HH:mm');
  const afterDate = format(new Date(after.createdAt), 'MMM d, yyyy HH:mm');
  
  // Find changed, added, and removed fields
  const changes: Record<string, {
    type: 'added' | 'removed' | 'changed';
    before?: any;
    after?: any;
  }> = {};
  
  // Check for changed or removed fields
  Object.entries(before.fields).forEach(([key, value]) => {
    if (key in after.fields) {
      const afterValue = after.fields[key as keyof typeof after.fields];
      if (value !== afterValue) {
        changes[key] = {
          type: 'changed',
          before: value,
          after: afterValue
        };
      }
    } else {
      changes[key] = {
        type: 'removed',
        before: value
      };
    }
  });
  
  // Check for added fields
  Object.entries(after.fields).forEach(([key, value]) => {
    if (!(key in before.fields)) {
      changes[key] = {
        type: 'added',
        after: value
      };
    }
  });
  
  // Format a value for display
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number') {
      // Handle currency formatting for price
      if (key === 'salePrice') return `$${value.toLocaleString()}`;
      return value.toString();
    }
    if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return format(new Date(value), 'MMM d, yyyy');
      }
      return value;
    }
    return JSON.stringify(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{before.source}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge>{after.source}</Badge>
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{beforeDate} → {afterDate}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 px-2 rounded-md">
              <span className="font-medium text-sm">
                {Object.keys(changes).length} changes detected
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              {Object.entries(changes).map(([key, change]) => (
                <div 
                  key={key} 
                  className={cn(
                    "grid grid-cols-[1fr,auto,1fr] gap-2 items-center px-2 py-1.5 rounded-md",
                    change.type === 'added' ? "bg-green-50" :
                    change.type === 'removed' ? "bg-red-50" :
                    "bg-amber-50"
                  )}
                >
                  <div>
                    {change.type !== 'added' && (
                      <div>
                        <div className="text-xs text-muted-foreground">Before:</div>
                        <div className="text-sm">{formatValue(change.before)}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-medium mb-1">{key}</div>
                    {change.type === 'added' ? (
                      <PlusCircle className="h-4 w-4 text-green-500" />
                    ) : change.type === 'removed' ? (
                      <MinusCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Edit className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  
                  <div>
                    {change.type !== 'removed' && (
                      <div>
                        <div className="text-xs text-muted-foreground">After:</div>
                        <div className="text-sm">{formatValue(change.after)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      {onPushToForm && (
        <CardFooter className="pt-2">
          <Button 
            variant="secondary" 
            size="sm"
            className="w-full"
            onClick={() => onPushToForm(after)}
          >
            <CornerDownRight className="h-4 w-4 mr-2" />
            Push Latest Version to Form
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}