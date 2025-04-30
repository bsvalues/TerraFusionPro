/**
 * SnapshotTile Component
 * 
 * Displays a snapshot card with key information and actions
 */
import React from 'react';
import { ComparableSnapshot } from '@shared/types/comps';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, ExternalLink, Eye, ArrowRightLeft } from 'lucide-react';

interface SnapshotTileProps {
  snapshot: ComparableSnapshot;
  isSelected?: boolean;
  onSelect?: (snapshot: ComparableSnapshot) => void;
  onCompare?: (snapshot: ComparableSnapshot) => void;
  onPush?: (snapshot: ComparableSnapshot) => void;
}

export function SnapshotTile({ 
  snapshot, 
  isSelected, 
  onSelect, 
  onCompare, 
  onPush
}: SnapshotTileProps) {
  const createdAtDate = new Date(snapshot.createdAt);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
  
  // Get count of fields in the snapshot
  const fieldCount = Object.keys(snapshot.fields).length;
  
  // Get a title for the snapshot from field data if available
  const getSnapshotTitle = () => {
    const { address, propertyAddress } = snapshot.fields;
    if (address) return address;
    if (propertyAddress) return propertyAddress;
    return `Snapshot ${snapshot.id.substring(0, 8)}`;
  };
  
  // Get key metrics to display
  const getKeyMetrics = () => {
    const metrics = [];
    
    if (snapshot.fields.salePrice) {
      metrics.push({
        label: 'Price',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(snapshot.fields.salePrice)
      });
    }
    
    if (snapshot.fields.gla || snapshot.fields.grossLivingArea) {
      metrics.push({
        label: 'GLA',
        value: `${snapshot.fields.gla || snapshot.fields.grossLivingArea} SF`
      });
    }
    
    if (snapshot.fields.bedrooms) {
      metrics.push({
        label: 'Beds',
        value: snapshot.fields.bedrooms
      });
    }
    
    if (snapshot.fields.bathrooms) {
      metrics.push({
        label: 'Baths',
        value: snapshot.fields.bathrooms
      });
    }
    
    return metrics;
  };
  
  return (
    <Card className={`w-full transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium truncate" title={getSnapshotTitle()}>
            {getSnapshotTitle()}
          </CardTitle>
          <Badge variant={isSelected ? "default" : "outline"}>
            {snapshot.source}
          </Badge>
        </div>
        <CardDescription className="flex items-center mt-1">
          <Clock className="h-3 w-3 mr-1" />
          {timeAgo}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-3 mt-1">
          {getKeyMetrics().map((metric, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <span className="font-medium">{metric.value}</span>
            </div>
          ))}
          
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Fields</span>
            <span className="font-medium flex items-center">
              <Database className="h-3 w-3 mr-1" />
              {fieldCount}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onSelect?.(snapshot)}
          className={isSelected ? 'bg-secondary/50' : ''}
        >
          <Eye className="h-4 w-4 mr-1" />
          {isSelected ? 'Selected' : 'View'}
        </Button>
        
        <div className="flex gap-1">
          {onCompare && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCompare(snapshot)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Compare
            </Button>
          )}
          
          {onPush && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onPush(snapshot)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Push to Form
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}