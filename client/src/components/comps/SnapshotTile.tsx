import React from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Send, 
  Calendar, 
  Code, 
  ArrowLeftRight,
  ChevronDown
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ComparableSnapshot } from '@shared/types/comps';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

interface SnapshotTileProps {
  snapshot: ComparableSnapshot;
  onSelect: (snapshot: ComparableSnapshot) => void;
  onPushToForm: (snapshot: ComparableSnapshot) => void;
  onCompare: (snapshot: ComparableSnapshot) => void;
  isSelected: boolean;
}

export function SnapshotTile({ 
  snapshot, 
  onSelect, 
  onPushToForm, 
  onCompare,
  isSelected 
}: SnapshotTileProps) {
  // Extract key fields for display
  const keyFieldsToShow = 3;
  const keyFields = Object.entries(snapshot.fields).slice(0, keyFieldsToShow);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };
  
  const getBadgeVariant = (source: string) => {
    switch (source.toLowerCase()) {
      case 'mls import':
        return 'default';
      case 'form push':
        return 'secondary';
      case 'manual edit':
        return 'outline';
      case 'api update':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`w-full transition-all ${isSelected ? 'border-primary bg-primary/5' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">
              Snapshot {snapshot.version || 'v1'}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>{formatDate(snapshot.createdAt)}</span>
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant(snapshot.source)}>
            {snapshot.source}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <Collapsible>
          <div className="grid grid-cols-2 gap-2">
            {keyFields.map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="font-medium text-muted-foreground">{key}: </span>
                <span className="text-foreground truncate">{String(value)}</span>
              </div>
            ))}
          </div>
          
          <CollapsibleContent>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
              {Object.entries(snapshot.fields).slice(keyFieldsToShow).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium text-muted-foreground">{key}: </span>
                  <span className="text-foreground truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
              <ChevronDown className="h-3 w-3 mr-1" />
              Show All Fields
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSelect(snapshot)}
                className={isSelected ? 'bg-primary text-primary-foreground' : ''}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View snapshot details</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onCompare(snapshot)}
              >
                <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
                Compare
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compare with another snapshot</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPushToForm(snapshot)}
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                Push
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Push data to a form</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}