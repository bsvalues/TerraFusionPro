/**
 * FieldMappingDialog Component
 * 
 * A dialog for mapping snapshot fields to form fields when pushing data
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { ComparableSnapshot } from '@shared/types/comps';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldMappingDialogProps {
  children: React.ReactNode;
  snapshot: ComparableSnapshot;
  onPushToForm: (formId: string, fieldMappings: Record<string, string>) => void;
}

// Simplified interface for form data
interface FormSummary {
  id: string;
  name: string;
  type: string; 
  createdAt: string;
}

// Simplified interface for form field definitions
interface FormField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

export function FieldMappingDialog({ 
  children, 
  snapshot, 
  onPushToForm 
}: FieldMappingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Query to fetch available forms
  const { 
    data: forms, 
    isLoading: isLoadingForms, 
    error: formsError 
  } = useQuery({
    queryKey: ['/api/forms/summary'],
    queryFn: getQueryFn<FormSummary[]>('/api/forms/summary'),
    enabled: open, // Only fetch when dialog is open
  });
  
  // Query to fetch form fields once a form is selected
  const { 
    data: formFields, 
    isLoading: isLoadingFields, 
    error: fieldsError 
  } = useQuery({
    queryKey: [`/api/forms/${selectedFormId}/fields`],
    queryFn: getQueryFn<FormField[]>(`/api/forms/${selectedFormId}/fields`),
    enabled: !!selectedFormId, // Only fetch when a form is selected
  });
  
  // Reset field mappings when selected form changes
  useEffect(() => {
    setFieldMappings({});
  }, [selectedFormId]);
  
  // Filter snapshot fields by search query
  const filteredSnapshotFields = Object.entries(snapshot.fields)
    .filter(([key]) => key.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));
  
  // Handler for mapping a field
  const handleFieldMapping = (formFieldId: string, snapshotField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [formFieldId]: snapshotField
    }));
  };
  
  // Handler for submitting the mappings
  const handleSubmit = () => {
    onPushToForm(selectedFormId, fieldMappings);
    setOpen(false);
  };
  
  // Helper to check if all required fields are mapped
  const areRequiredFieldsMapped = () => {
    if (!formFields) return false;
    
    return formFields
      .filter(field => field.required)
      .every(field => fieldMappings[field.id]);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Push Snapshot to Form</DialogTitle>
          <DialogDescription>
            Map property fields from this snapshot to a form. Select a target form first, then map
            the fields from the snapshot to the corresponding form fields.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          {/* Form selection */}
          <div>
            <Label htmlFor="form-select">Target Form</Label>
            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
              <SelectTrigger id="form-select" className="w-full">
                <SelectValue placeholder="Select a form to push data to" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingForms ? (
                  <SelectItem value="loading" disabled>Loading forms...</SelectItem>
                ) : formsError ? (
                  <SelectItem value="error" disabled>Error loading forms</SelectItem>
                ) : (forms?.length || 0) === 0 ? (
                  <SelectItem value="none" disabled>No forms available</SelectItem>
                ) : (
                  forms?.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name} ({form.type})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Field mapping section */}
          {selectedFormId && !isLoadingFields && !fieldsError && formFields && (
            <>
              <div>
                <Label htmlFor="field-search">Search Snapshot Fields</Label>
                <Input 
                  id="field-search"
                  placeholder="Type to search property fields..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-96 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Form Field</TableHead>
                      <TableHead className="w-1/3">Snapshot Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formFields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No form fields available
                        </TableCell>
                      </TableRow>
                    ) : (
                      formFields.map(formField => {
                        const mappedField = fieldMappings[formField.id];
                        const mappedValue = mappedField ? snapshot.fields[mappedField] : null;
                        
                        return (
                          <TableRow key={formField.id}>
                            <TableCell className="font-medium">
                              {formField.name}
                              {formField.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={mappedField || ''} 
                                onValueChange={value => handleFieldMapping(formField.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {filteredSnapshotFields.map(([key]) => (
                                    <SelectItem key={key} value={key}>
                                      {key}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="truncate max-w-[200px]">
                              {mappedValue !== null && mappedValue !== undefined 
                                ? String(mappedValue) 
                                : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {/* Warning if required fields are not mapped */}
              {!areRequiredFieldsMapped() && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Required fields</AlertTitle>
                  <AlertDescription>
                    All fields marked with an asterisk (*) must be mapped before pushing to the form.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedFormId || !areRequiredFieldsMapped()}
          >
            <Save className="mr-2 h-4 w-4" />
            Push to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}