import { useState, useEffect } from 'react';
import { ComparableSnapshot } from '@shared/types/comps';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ArrowRightLeft, Check, Table } from 'lucide-react';

interface FieldMappingDialogProps {
  snapshot: ComparableSnapshot;
  onClose: () => void;
  onPushToForm: (formId: string, fieldMappings: Record<string, string>) => void;
}

interface Form {
  id: string;
  name: string;
  fields: {
    id: string;
    name: string;
    type: string;
    required?: boolean;
  }[];
}

export default function FieldMappingDialog({
  snapshot,
  onClose,
  onPushToForm,
}: FieldMappingDialogProps) {
  // State for the selected form
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  
  // State for field mappings (form field ID -> snapshot field name)
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  
  // State for auto-map enabled
  const [autoMapEnabled, setAutoMapEnabled] = useState<boolean>(true);
  
  // Fetch available forms
  const { data: forms, isLoading } = useQuery({
    queryKey: ['/api/forms/templates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/forms/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch form templates');
        }
        return response.json() as Promise<Form[]>;
      } catch (error) {
        console.error('Error fetching form templates:', error);
        throw error;
      }
    }
  });
  
  // Get the currently selected form
  const selectedForm = forms?.find(form => form.id === selectedFormId);
  
  // Get snapshot field names
  const snapshotFields = Object.keys(snapshot.fields).sort();
  
  // Auto-map fields when form is selected and auto-map is enabled
  useEffect(() => {
    if (selectedForm && autoMapEnabled) {
      const newMappings = {...fieldMappings};
      
      // Try to map form fields to snapshot fields based on name similarity
      selectedForm.fields.forEach(formField => {
        const formFieldNameLower = formField.name.toLowerCase();
        
        // Try to find an exact match first
        let match = snapshotFields.find(
          field => field.toLowerCase() === formFieldNameLower
        );
        
        // If no exact match, try partial matches
        if (!match) {
          match = snapshotFields.find(
            field => field.toLowerCase().includes(formFieldNameLower) ||
                    formFieldNameLower.includes(field.toLowerCase())
          );
        }
        
        if (match) {
          newMappings[formField.id] = match;
        }
      });
      
      setFieldMappings(newMappings);
    }
  }, [selectedFormId, selectedForm, autoMapEnabled, snapshotFields]);
  
  // Handle form selection
  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    // Clear existing mappings when changing forms
    setFieldMappings({});
  };
  
  // Handle field mapping change
  const handleMappingChange = (formFieldId: string, snapshotField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [formFieldId]: snapshotField
    }));
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (!selectedFormId) {
      toast({
        title: 'Error',
        description: 'Please select a form first',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if required fields are mapped
    const requiredFieldsMissing = selectedForm?.fields
      .filter(field => field.required)
      .some(field => !fieldMappings[field.id]);
    
    if (requiredFieldsMissing) {
      toast({
        title: 'Warning',
        description: 'Some required fields are not mapped. Continue anyway?',
        variant: 'default',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              onPushToForm(selectedFormId, fieldMappings);
            }}
          >
            Continue
          </Button>
        )
      });
      return;
    }
    
    onPushToForm(selectedFormId, fieldMappings);
  };
  
  // Calculate mapping percentage
  const getMappingPercentage = () => {
    if (!selectedForm) return 0;
    const totalFields = selectedForm.fields.length;
    const mappedFields = Object.keys(fieldMappings).length;
    return Math.round((mappedFields / totalFields) * 100);
  };
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Push Snapshot Data to Form</DialogTitle>
          <DialogDescription>
            Map snapshot fields to form fields to push data from this snapshot to a form.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-select">Select Target Form</Label>
            <Select value={selectedFormId} onValueChange={handleFormSelect}>
              <SelectTrigger id="form-select">
                <SelectValue placeholder="Select a form..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading forms...</SelectItem>
                ) : !forms || forms.length === 0 ? (
                  <SelectItem value="none" disabled>No forms available</SelectItem>
                ) : (
                  forms.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedForm && (
            <>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-map"
                    checked={autoMapEnabled}
                    onCheckedChange={setAutoMapEnabled}
                  />
                  <Label htmlFor="auto-map">Auto-map fields</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {Object.keys(fieldMappings).length} of {selectedForm.fields.length} fields mapped ({getMappingPercentage()}%)
                </div>
              </div>
              
              <Tabs defaultValue="mapping" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="mapping">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Field Mapping
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Table className="mr-2 h-4 w-4" /> Data Preview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="mapping">
                  <Card className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                            Form Field
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                            Snapshot Field
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedForm.fields.map(formField => (
                          <tr key={formField.id} className={formField.required ? 'bg-amber-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="font-medium">{formField.name}</div>
                              <div className="text-xs text-gray-500">{formField.id}</div>
                              {formField.required && (
                                <div className="text-xs text-red-500">Required</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Select
                                value={fieldMappings[formField.id] || ''}
                                onValueChange={(value) => handleMappingChange(formField.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {snapshotFields.map(field => (
                                    <SelectItem key={field} value={field}>
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {fieldMappings[formField.id] ? (
                                <div className="text-gray-700">
                                  {typeof snapshot.fields[fieldMappings[formField.id]] === 'object'
                                    ? JSON.stringify(snapshot.fields[fieldMappings[formField.id]])
                                    : String(snapshot.fields[fieldMappings[formField.id]])}
                                </div>
                              ) : (
                                <div className="text-gray-400 italic">No mapping</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preview">
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">Data Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      This shows how data will appear in the form after pushing.
                    </p>
                    
                    <div className="space-y-4">
                      {selectedForm.fields.map(formField => (
                        <div key={formField.id} className="space-y-2">
                          <Label htmlFor={`preview-${formField.id}`}>
                            {formField.name}
                            {formField.required && ' *'}
                          </Label>
                          <Input
                            id={`preview-${formField.id}`}
                            value={fieldMappings[formField.id] 
                              ? String(snapshot.fields[fieldMappings[formField.id]] || '')
                              : ''}
                            readOnly
                            className={!fieldMappings[formField.id] ? 'bg-gray-100' : ''}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedFormId || Object.keys(fieldMappings).length === 0}
          >
            <Check className="mr-2 h-4 w-4" /> Push to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}