import React, { useState } from 'react';
import { ComparableSnapshot } from '@/shared/types/comps';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, Clipboard, AlertCircle } from 'lucide-react';

// Default field mappings for common fields
const DEFAULT_MAPPINGS = {
  salePrice: 'salePrice',
  gla: 'gla',
  beds: 'beds',
  baths: 'baths',
  yearBuilt: 'yearBuilt',
  saleDate: 'saleDate',
} as const;

// Field options for the form
const FORM_FIELD_OPTIONS = [
  { value: 'salePrice', label: 'Sale Price' },
  { value: 'gla', label: 'Gross Living Area' },
  { value: 'beds', label: 'Bedrooms' },
  { value: 'baths', label: 'Bathrooms' },
  { value: 'yearBuilt', label: 'Year Built' },
  { value: 'saleDate', label: 'Sale Date' },
  { value: 'lotSize', label: 'Lot Size' },
  { value: 'address', label: 'Address' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'condition', label: 'Condition' },
  { value: 'custom', label: 'Custom Field...' },
];

interface FieldMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: ComparableSnapshot;
  formId: string;
}

export function FieldMappingDialog({
  open,
  onOpenChange,
  snapshot,
  formId
}: FieldMappingDialogProps) {
  const { toast } = useToast();
  const [fieldMappings, setFieldMappings] = useState(() => {
    // Initialize with default mappings
    return Object.entries(snapshot.fields).reduce((acc, [key]) => {
      acc[key] = DEFAULT_MAPPINGS[key as keyof typeof DEFAULT_MAPPINGS] || '';
      return acc;
    }, {} as Record<string, string>);
  });

  const pushToFormMutation = useMutation({
    mutationFn: async () => {
      // Filter out empty mappings
      const validMappings = Object.entries(fieldMappings).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      return await apiRequest('/api/forms/push', {
        method: 'POST',
        data: {
          formId,
          snapshotId: snapshot.id,
          fieldMappings: validMappings
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data successfully pushed to form",
        variant: "default",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error pushing data to form",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  });

  const handleFieldMappingChange = (snapshotField: string, formField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [snapshotField]: formField
    }));
  };

  const handlePushToForm = () => {
    pushToFormMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Map Fields to Form</DialogTitle>
          <DialogDescription>
            Choose which snapshot fields to push to your form and where they should go
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {Object.entries(snapshot.fields).map(([fieldName, fieldValue]) => {
            // Skip undefined or null values
            if (fieldValue === undefined || fieldValue === null) return null;
            
            return (
              <div key={fieldName} className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                <div>
                  <Label htmlFor={`field-${fieldName}`} className="mb-1 block text-sm">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {fieldName === 'salePrice' ? (
                      `$${fieldValue.toLocaleString()}`
                    ) : typeof fieldValue === 'string' && fieldValue.length > 20 ? (
                      `${fieldValue.substring(0, 20)}...`
                    ) : (
                      String(fieldValue)
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <Select
                  value={fieldMappings[fieldName] || ''}
                  onValueChange={(value) => handleFieldMappingChange(fieldName, value)}
                >
                  <SelectTrigger id={`field-${fieldName}`}>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Don't map</SelectItem>
                    {FORM_FIELD_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={handlePushToForm}
            className="sm:w-auto w-full"
            disabled={pushToFormMutation.isPending}
          >
            {pushToFormMutation.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Push to Form
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}