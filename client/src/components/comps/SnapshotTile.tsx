import React from 'react';
import { ComparableSnapshot } from '@/shared/types/comps';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clipboard, Calendar, Home, Bed, Bath, History } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SnapshotTileProps {
  snapshot: ComparableSnapshot;
  onPushToForm?: (snapshot: ComparableSnapshot) => void;
  onViewDiff?: (snapshot: ComparableSnapshot) => void;
  isSelected?: boolean;
}

export function SnapshotTile({ 
  snapshot, 
  onPushToForm, 
  onViewDiff,
  isSelected = false
}: SnapshotTileProps) {
  const { fields, createdAt, source } = snapshot;
  
  // Format the date properly
  const formattedCreatedAt = format(new Date(createdAt), 'MMM d, yyyy');
  const formattedSaleDate = fields.saleDate ? format(new Date(fields.saleDate), 'MMM d, yyyy') : 'N/A';

  // Source badge color
  const getBadgeVariant = () => {
    switch (source) {
      case 'MLS': return 'default';
      case 'PublicRecord': return 'secondary';
      case 'PriorReport': return 'outline';
      case 'Manual': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card className={cn(
      "w-[280px] transition-all duration-200", 
      isSelected ? "ring-2 ring-primary" : "",
      "hover:shadow-md"
    )}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <Badge variant={getBadgeVariant()}>{source}</Badge>
          <span className="text-xs text-muted-foreground flex items-center">
            <History className="h-3 w-3 mr-1" />
            {formattedCreatedAt}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sale Price</span>
            <span className="font-semibold">${fields.salePrice?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Sale Date</span>
            <span className="text-sm">{formattedSaleDate}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center">
            <Home className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-xs">GLA: {fields.gla} sf</span>
          </div>
          <div className="flex items-center">
            <Bed className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-xs">Beds: {fields.beds}</span>
          </div>
          <div className="flex items-center">
            <Bath className="h-3 w-3 mr-1 text-muted-foreground" />
            <span className="text-xs">Baths: {fields.baths}</span>
          </div>
          {fields.yearBuilt && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-xs">Built: {fields.yearBuilt}</span>
            </div>
          )}
        </div>
        
        {fields.remarks && (
          <div className="pt-1">
            <span className="text-xs text-muted-foreground">Remarks</span>
            <p className="text-xs line-clamp-2">{fields.remarks}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 flex gap-2">
        {onPushToForm && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => onPushToForm(snapshot)}
          >
            <Clipboard className="h-3 w-3 mr-1" />
            Push to Form
          </Button>
        )}
        {onViewDiff && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-1/3 text-xs"
            onClick={() => onViewDiff(snapshot)}
          >
            Diff
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}