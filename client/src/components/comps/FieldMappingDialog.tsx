/**
 * FieldMappingDialog Component
 * 
 * A dialog for mapping snapshot fields to form fields when pushing data
 */
import React, { useState } from 'react';
import { ComparableSnapshot } from '../../../shared/types/comps';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Check, X, ArrowRight, RefreshCw } from 'lucide-react';

// Sample form field definitions for demo - in a real app these would be fetched
const sampleFormFields = [
  { id: 'address', label: 'Property Address', section: 'Property Information' },
  { id: 'city', label: 'City', section: 'Property Information' },
  { id: 'state', label: 'State', section: 'Property Information' },
  { id: 'zipCode', label: 'Zip Code', section: 'Property Information' },
  { id: 'propertyType', label: 'Property Type', section: 'Property Information' },
  { id: 'yearBuilt', label: 'Year Built', section: 'Property Information' },
  { id: 'grossLivingArea', label: 'Gross Living Area (sq.ft)', section: 'Size Information' },
  { id: 'lotSize', label: 'Lot Size (sq.ft)', section: 'Size Information' },
  { id: 'bedrooms', label: 'Bedrooms', section: 'Features' },
  { id: 'bathrooms', label: 'Bathrooms', section: 'Features' },
  { id: 'basement', label: 'Basement Type', section: 'Features' },
  { id: 'garage', label: 'Garage', section: 'Features' },
  { id: 'salePrice', label: 'Sale Price', section: 'Transaction' },
  { id: 'saleDate', label: 'Sale Date', section: 'Transaction' },
  { id: 'mlsNumber', label: 'MLS Number', section: 'Transaction' },
  { id: 'latitude', label: 'Latitude', section: 'Geo' },
  { id: 'longitude', label: 'Longitude', section: 'Geo' },
];

// Sample forms to select from
const sampleForms = [
  { id: 'form1', name: 'Residential Appraisal Form' },
  { id: 'form2', name: 'Income Property Analysis' },
  { id: 'form3', name: 'Single-Family Comparable Grid' },
];

interface FieldMappingDialogProps {
  children: React.ReactNode;
  snapshot: ComparableSnapshot;
  onPushToForm: (formId: string, fieldMappings: Record<string, string>) => void;
}

export function FieldMappingDialog({ 
  children, 
  snapshot, 
  onPushToForm 
}: FieldMappingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | undefined>();
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter snapshot fields based on search term
  const filteredFields = Object.keys(snapshot.fields).filter((field) => {
    return field.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Group form fields by section for better organization
  const formFieldsBySection = sampleFormFields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = [];
    }
    acc[field.section].push(field);
    return acc;
  }, {} as Record<string, typeof sampleFormFields>);
  
  // Handle field selection toggle
  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };
  
  // Handle field mapping change
  const handleMappingChange = (snapshotField: string, formField: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [formField]: snapshotField,
    }));
  };
  
  // Auto-map fields based on name similarity
  const autoMapFields = () => {
    const newMappings: Record<string, string> = {};
    
    // For each form field, try to find a matching snapshot field
    sampleFormFields.forEach((formField) => {
      const formFieldName = formField.id.toLowerCase();
      
      // First try exact match
      let matchFound = Object.keys(snapshot.fields).find(
        (snapshotField) => snapshotField.toLowerCase() === formFieldName
      );
      
      // If no exact match, try contains match
      if (!matchFound) {
        matchFound = Object.keys(snapshot.fields).find(
          (snapshotField) => 
            snapshotField.toLowerCase().includes(formFieldName) ||
            formFieldName.includes(snapshotField.toLowerCase())
        );
      }
      
      if (matchFound) {
        newMappings[formField.id] = matchFound;
        if (!selectedFields.includes(matchFound)) {
          setSelectedFields((prev) => [...prev, matchFound]);
        }
      }
    });
    
    setFieldMappings(newMappings);
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!selectedForm) return;
    
    // Only include mappings for fields that are selected
    const activeMappings = Object.entries(fieldMappings)
      .filter(([, snapshotField]) => selectedFields.includes(snapshotField))
      .reduce((acc, [formField, snapshotField]) => {
        acc[formField] = snapshotField;
        return acc;
      }, {} as Record<string, string>);
    
    onPushToForm(selectedForm, activeMappings);
    setIsOpen(false);
    
    // Reset form state
    setFieldMappings({});
    setSelectedFields([]);
    setSelectedForm(undefined);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Push Snapshot to Form
          </DialogTitle>
          <DialogDescription>
            Select fields from the snapshot and map them to form fields
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left panel: Select the target form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="form-select">Select Target Form</Label>
              <Select
                value={selectedForm}
                onValueChange={setSelectedForm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a form..." />
                </SelectTrigger>
                <SelectContent>
                  {sampleForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="search-fields">Snapshot Fields</Label>
                <Button variant="ghost" size="sm" onClick={autoMapFields}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Auto-Map
                </Button>
              </div>
              <Input
                id="search-fields"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
              
              <Card className="overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <div className="p-1">
                    {filteredFields.length > 0 ? (
                      filteredFields.map((field) => (
                        <div 
                          key={field}
                          className={`
                            p-2 rounded-md flex items-center gap-2 text-sm
                            ${selectedFields.includes(field) ? 'bg-primary/10' : 'hover:bg-muted/50'}
                            cursor-pointer transition-colors
                          `}
                          onClick={() => handleFieldToggle(field)}
                        >
                          <Checkbox 
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => handleFieldToggle(field)}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">{field}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {String(snapshot.fields[field])}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No fields match your search
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
          
          {/* Right panel: Map fields */}
          <div className="col-span-1 md:col-span-2">
            <Label className="mb-2 block">Field Mapping</Label>
            <Card className="overflow-hidden">
              <ScrollArea className="h-[350px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead>Form Field</TableHead>
                      <TableHead>Snapshot Field</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(formFieldsBySection).map(([section, fields]) => (
                      <React.Fragment key={section}>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={3} className="font-medium py-2">
                            {section}
                          </TableCell>
                        </TableRow>
                        {fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.label}</TableCell>
                            <TableCell>
                              <Select
                                value={fieldMappings[field.id] || ''}
                                onValueChange={(value) => handleMappingChange(value, field.id)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select a field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">-- None --</SelectItem>
                                  {Object.keys(snapshot.fields).map((snapshotField) => (
                                    <SelectItem 
                                      key={snapshotField} 
                                      value={snapshotField}
                                      disabled={!selectedFields.includes(snapshotField)}
                                    >
                                      {snapshotField}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {fieldMappings[field.id] && selectedFields.includes(fieldMappings[field.id]) ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedForm || selectedFields.length === 0}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Push to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}