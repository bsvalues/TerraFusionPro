/**
 * SnapshotTile Component
 * 
 * Displays a single snapshot as a card with summary information
 */
import React from 'react';
import { ComparableSnapshot } from '../../../shared/types/comps';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelative } from 'date-fns';
import { 
  ArrowLeftRight, 
  FileOutput, 
  Home, 
  CalendarClock,
  Users,
  Asterisk,
  MapPin,
  Hash,
  DollarSign
} from 'lucide-react';

export interface SnapshotTileProps {
  snapshot: ComparableSnapshot;
  isSelected: boolean;
  onSelect: () => void;
  onCompare?: () => void;
  onPush?: () => void;
}

export function SnapshotTile({ 
  snapshot, 
  isSelected, 
  onSelect, 
  onCompare, 
  onPush 
}: SnapshotTileProps) {
  // Format relative date
  const formattedDate = formatRelative(
    new Date(snapshot.createdAt),
    new Date()
  );
  
  // Get key stats from the snapshot to display
  const getDisplayFields = (snapshot: ComparableSnapshot) => {
    const fields = snapshot.fields;
    const results = [];
    
    // Check for address
    if (fields.address) {
      results.push({
        label: 'Address',
        value: fields.address,
        icon: <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
      });
    }
    
    // Check for source
    results.push({
      label: 'Source',
      value: snapshot.source,
      icon: <Users className="h-3.5 w-3.5 text-muted-foreground" />
    });
    
    // Check for price
    if (fields.price || fields.salePrice || fields.listPrice) {
      const price = fields.price || fields.salePrice || fields.listPrice;
      results.push({
        label: 'Price',
        value: typeof price === 'number' 
          ? `$${price.toLocaleString()}` 
          : `$${price}`,
        icon: <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
      });
    }
    
    // Check for ID 
    results.push({
      label: 'ID',
      value: snapshot.id,
      icon: <Hash className="h-3.5 w-3.5 text-muted-foreground" />
    });
    
    // Calculate total fields
    results.push({
      label: 'Fields',
      value: Object.keys(fields).length,
      icon: <Asterisk className="h-3.5 w-3.5 text-muted-foreground" />
    });
    
    return results;
  };
  
  const displayFields = getDisplayFields(snapshot);
  
  return (
    <Card 
      className={`
        overflow-hidden transition-all
        ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}
        cursor-pointer
      `}
      onClick={onSelect}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={isSelected ? "default" : "outline"} className="h-5 text-xs">
            {snapshot.version ? `v${snapshot.version}` : "Snapshot"}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3 mr-1" />
            {formattedDate}
          </div>
        </div>
        
        <div className="space-y-2">
          {displayFields.map((field, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              {field.icon}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="font-medium truncate">{field.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <CardFooter className="flex justify-between p-2 border-t bg-muted/30">
        {onCompare && (
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            onCompare();
          }}>
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Compare</span>
          </Button>
        )}
        
        {onPush && (
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            onPush();
          }}>
            <FileOutput className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Push</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}