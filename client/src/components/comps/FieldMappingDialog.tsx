/**
 * FieldMappingDialog Component
 * 
 * Dialog for mapping snapshot fields to form fields
 */
import React, { useState, useMemo } from 'react';
import { ComparableSnapshot, FieldMapping } from '../../../shared/types/comps';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ArrowRight, Save, FileOutput, DatabaseIcon, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FieldMappingDialogProps {
  snapshot: ComparableSnapshot;
  onPushToForm: (formId: string, fieldMappings: Record<string, string>) => void;
  formIds?: string[];
  savedMappings?: FieldMapping[];
  children?: React.ReactNode;
}

export function FieldMappingDialog({
  snapshot,
  onPushToForm,
  formIds = ['form-1', 'form-2', 'form-3'],
  savedMappings = [],
  children
}: FieldMappingDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // Common form field names that can be used for auto-mapping
  const commonFormFields = useMemo(() => ({
    'address': ['address', 'propertyAddress', 'location'],
    'city': ['city', 'propertyCity'],
    'state': ['state', 'propertyState'],
    'zipCode': ['zipCode', 'zip', 'postalCode'],
    'bedrooms': ['bedrooms', 'beds', 'bedroomCount'],
    'bathrooms': ['bathrooms', 'baths', 'bathroomCount'],
    'price': ['price', 'salePrice', 'value', 'salesPrice'],
    'squareFeet': ['squareFeet', 'gla', 'grossLivingArea', 'area'],
    'yearBuilt': ['yearBuilt', 'constructionYear', 'year']
  }), []);
  
  // Generate filtered snapshot fields
  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return Object.keys(snapshot.fields);
    
    return Object.keys(snapshot.fields).filter(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(snapshot.fields[field]).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [snapshot.fields, searchTerm]);
  
  // Handle checkbox toggling for a field
  const toggleField = (field: string) => {
    const newSelectedFields = new Set(selectedFields);
    
    if (newSelectedFields.has(field)) {
      newSelectedFields.delete(field);
      
      // Also remove from mappings
      const newMappings = { ...fieldMappings };
      delete newMappings[field];
      setFieldMappings(newMappings);
    } else {
      newSelectedFields.add(field);
      
      // Try to auto-map this field if possible
      const normalizedField = field.toLowerCase();
      for (const [formField, possibleFields] of Object.entries(commonFormFields)) {
        if (possibleFields.some(f => normalizedField === f || normalizedField.includes(f))) {
          setFieldMappings(prev => ({
            ...prev,
            [field]: formField
          }));
          break;
        }
      }
    }
    
    setSelectedFields(newSelectedFields);
  };
  
  // Toggle select all fields
  const toggleSelectAll = () => {
    if (selectedFields.size === filteredFields.length) {
      setSelectedFields(new Set());
      setFieldMappings({});
    } else {
      setSelectedFields(new Set(filteredFields));
      
      // Try to auto-map fields
      const newMappings = { ...fieldMappings };
      filteredFields.forEach(field => {
        const normalizedField = field.toLowerCase();
        for (const [formField, possibleFields] of Object.entries(commonFormFields)) {
          if (possibleFields.some(f => normalizedField === f || normalizedField.includes(f))) {
            newMappings[field] = formField;
            break;
          }
        }
      });
      
      setFieldMappings(newMappings);
    }
  };
  
  // Load a saved mapping
  const loadSavedMapping = (mapping: FieldMapping) => {
    if (mapping.snapshotId !== snapshot.id) return;
    
    setSelectedFormId(mapping.formId);
    
    const newSelectedFields = new Set<string>();
    Object.keys(mapping.fieldMappings).forEach(field => {
      if (snapshot.fields[field] !== undefined) {
        newSelectedFields.add(field);
      }
    });
    
    setSelectedFields(newSelectedFields);
    setFieldMappings(mapping.fieldMappings);
  };
  
  // Push data to form
  const handlePushToForm = () => {
    if (!selectedFormId) return;
    
    // Only include mappings for selected fields
    const effectiveMappings: Record<string, string> = {};
    for (const field of selectedFields) {
      if (fieldMappings[field]) {
        effectiveMappings[field] = fieldMappings[field];
      }
    }
    
    onPushToForm(selectedFormId, effectiveMappings);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>
            <FileOutput className="h-4 w-4 mr-2" />
            Push Data to Form
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Push Snapshot Data to Form</DialogTitle>
          <DialogDescription>
            Map data fields from this snapshot to a form of your choice.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-4 my-2">
          <div className="flex flex-col gap-2 md:w-1/3">
            <Label htmlFor="form-select">Select Target Form</Label>
            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
              <SelectTrigger id="form-select">
                <SelectValue placeholder="Choose a form..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Forms</SelectLabel>
                  {formIds.map(id => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <div className="mt-4">
              <Label>Saved Mappings</Label>
              <div className="flex flex-col gap-2 mt-2">
                {savedMappings
                  .filter(mapping => mapping.snapshotId === snapshot.id)
                  .map((mapping, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => loadSavedMapping(mapping)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Map to {mapping.formId}
                      <Badge className="ml-2" variant="secondary">
                        {Object.keys(mapping.fieldMappings).length} fields
                      </Badge>
                    </Button>
                  ))}
                
                {savedMappings.filter(mapping => mapping.snapshotId === snapshot.id).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center p-2">
                    No saved mappings for this snapshot
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:w-2/3">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedFields.size === filteredFields.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md">
              <Table>
                <TableCaption>
                  Snapshot contains {Object.keys(snapshot.fields).length} fields
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[200px]">Snapshot Field</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Form Field</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFields.map(field => (
                    <TableRow key={field}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFields.has(field)}
                          onCheckedChange={() => toggleField(field)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {field}
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {String(snapshot.fields[field])}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        {selectedFields.has(field) ? (
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Form field name..."
                              value={fieldMappings[field] || ''}
                              onChange={(e) => setFieldMappings({
                                ...fieldMappings,
                                [field]: e.target.value
                              })}
                              size={20}
                              className="flex-1"
                            />
                            
                            {fieldMappings[field] && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFieldMappings(prev => {
                                  const newMappings = { ...prev };
                                  delete newMappings[field];
                                  return newMappings;
                                })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Select to map</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredFields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No fields match your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <div className="flex items-center gap-2 mr-auto">
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {selectedFields.size} of {filteredFields.length} fields selected
            </span>
          </div>
          
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          
          <Button 
            onClick={handlePushToForm} 
            disabled={!selectedFormId || selectedFields.size === 0}
          >
            <FileOutput className="h-4 w-4 mr-2" />
            Push to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}