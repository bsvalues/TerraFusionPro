import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FileText, Download, Trash2, Plus, Edit, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

// Import the config
const config = require("../../../shared/config.js");

type Comparable = {
  id: string;
  address: string;
  salePrice: string;
  saleDate: string;
  bedrooms: string;
  bathrooms: string;
  grossLivingArea: string;
  adjustments?: Adjustment[];
};

type Adjustment = {
  id: string;
  comparableId: string;
  adjustmentType: string;
  amount: string;
  description?: string;
};

type AdjustmentTemplate = {
  id: string;
  name: string;
  adjustments: {
    adjustmentType: string;
    description?: string;
  }[];
};

type BatchAdjustmentsProps = {
  comparables: Comparable[];
  onUpdate: (comparables: Comparable[]) => void;
  appraisalId?: string;
};

const BatchAdjustments: React.FC<BatchAdjustmentsProps> = ({
  comparables,
  onUpdate,
  appraisalId,
}) => {
  const { toast } = useToast();
  const [selectedComparables, setSelectedComparables] = useState<string[]>([]);
  const [isApplyingAdjustments, setIsApplyingAdjustments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [adjustmentTemplates, setAdjustmentTemplates] = useState<AdjustmentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [batchAdjustments, setBatchAdjustments] = useState<{
    [key: string]: {
      applyTo: "all" | "selected";
      adjustmentType: string;
      amount: string;
      description?: string;
    };
  }>({});
  const [activeTab, setActiveTab] = useState("quick");

  // Demo adjustment templates
  const demoTemplates: AdjustmentTemplate[] = [
    {
      id: "template1",
      name: "Standard Adjustments",
      adjustments: [
        { adjustmentType: "Location", description: "Location adjustment based on neighborhood" },
        { adjustmentType: "GLA", description: "Gross Living Area adjustment" },
        { adjustmentType: "Age", description: "Age/Condition adjustment" },
        { adjustmentType: "Bedrooms", description: "Room count adjustment" },
      ],
    },
    {
      id: "template2",
      name: "Luxury Property Adjustments",
      adjustments: [
        { adjustmentType: "View", description: "View quality adjustment" },
        { adjustmentType: "Amenities", description: "Premium amenities adjustment" },
        { adjustmentType: "Quality", description: "Construction quality adjustment" },
        { adjustmentType: "Pool/Spa", description: "Pool or spa amenity adjustment" },
      ],
    },
  ];

  // Load adjustment templates
  useEffect(() => {
    // In a real implementation, we would fetch templates from API
    // For demo purposes, use our demo templates
    if (config.demoMode) {
      setAdjustmentTemplates(demoTemplates);
    } else {
      // Real API call would go here
      const loadTemplates = async () => {
        try {
          const response = await apiRequest('/api/adjustment-templates', {
            method: 'GET',
          });
          
          if (response.ok) {
            const data = await response.json();
            setAdjustmentTemplates(data);
          }
        } catch (error) {
          toast({
            title: "Error loading adjustment templates",
            description: "Failed to load adjustment templates. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      loadTemplates();
    }
  }, [toast]);

  const handleSelectAllComparables = (checked: boolean) => {
    if (checked) {
      setSelectedComparables(comparables.map((comp) => comp.id));
    } else {
      setSelectedComparables([]);
    }
  };

  const handleSelectComparable = (comparableId: string, checked: boolean) => {
    if (checked) {
      setSelectedComparables([...selectedComparables, comparableId]);
    } else {
      setSelectedComparables(selectedComparables.filter((id) => id !== comparableId));
    }
  };

  const addBatchAdjustment = () => {
    const newId = Date.now().toString();
    setBatchAdjustments({
      ...batchAdjustments,
      [newId]: {
        applyTo: "selected",
        adjustmentType: "",
        amount: "",
        description: "",
      },
    });
  };

  const updateBatchAdjustment = (
    id: string,
    field: "applyTo" | "adjustmentType" | "amount" | "description",
    value: string
  ) => {
    setBatchAdjustments({
      ...batchAdjustments,
      [id]: {
        ...batchAdjustments[id],
        [field]: value,
      },
    });
  };

  const removeBatchAdjustment = (id: string) => {
    const newAdjustments = { ...batchAdjustments };
    delete newAdjustments[id];
    setBatchAdjustments(newAdjustments);
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    const template = adjustmentTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Create new batch adjustments from template
    const newBatchAdjustments = {};
    
    template.adjustments.forEach((adj, index) => {
      const newId = `template-${Date.now()}-${index}`;
      newBatchAdjustments[newId] = {
        applyTo: "selected",
        adjustmentType: adj.adjustmentType,
        amount: "",
        description: adj.description || "",
      };
    });

    setBatchAdjustments(newBatchAdjustments);
    setActiveTab("batch");
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please provide a name for your template.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);

    try {
      // Create template from current batch adjustments
      const templateAdjustments = Object.values(batchAdjustments).map((adj) => ({
        adjustmentType: adj.adjustmentType,
        description: adj.description,
      }));

      const newTemplate: AdjustmentTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplateName,
        adjustments: templateAdjustments,
      };

      // In a real implementation, we would save to API
      if (!config.demoMode) {
        // Real API call would go here
        const response = await apiRequest('/api/adjustment-templates', {
          method: 'POST',
          body: JSON.stringify(newTemplate),
        });
        
        if (!response.ok) {
          throw new Error("Failed to save template");
        }
      }

      // Update local state
      setAdjustmentTemplates([...adjustmentTemplates, newTemplate]);
      setNewTemplateName("");
      setTemplateDialogOpen(false);
      
      toast({
        title: "Template saved",
        description: "Adjustment template has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving template",
        description: "Failed to save adjustment template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const applyBatchAdjustments = async () => {
    setIsApplyingAdjustments(true);

    try {
      const updatedComparables = [...comparables];

      // Process each batch adjustment
      Object.values(batchAdjustments).forEach((adjustment) => {
        const targetComparables = adjustment.applyTo === "all"
          ? updatedComparables
          : updatedComparables.filter((comp) => selectedComparables.includes(comp.id));

        // Apply adjustment to each target comparable
        targetComparables.forEach((comparable) => {
          if (!comparable.adjustments) {
            comparable.adjustments = [];
          }

          // Add the new adjustment
          const newAdjustment: Adjustment = {
            id: `adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            comparableId: comparable.id,
            adjustmentType: adjustment.adjustmentType,
            amount: adjustment.amount,
            description: adjustment.description,
          };

          comparable.adjustments.push(newAdjustment);
        });
      });

      // In a real implementation, we would save to API
      if (!config.demoMode && appraisalId) {
        // Real API call would go here
        const response = await apiRequest(`/api/appraisals/${appraisalId}/comparables/batch-adjust`, {
          method: 'POST',
          body: JSON.stringify({ 
            comparables: updatedComparables,
            adjustments: Object.values(batchAdjustments)
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to apply batch adjustments");
        }
      }

      // Update state
      onUpdate(updatedComparables);
      setBatchAdjustments({});
      
      toast({
        title: "Adjustments applied",
        description: "Batch adjustments have been applied successfully.",
      });
    } catch (error) {
      toast({
        title: "Error applying adjustments",
        description: "Failed to apply batch adjustments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingAdjustments(false);
    }
  };

  const exportBatchPdf = async () => {
    setIsExporting(true);

    try {
      // Only export selected comparables
      const comparablesToExport = selectedComparables.length > 0
        ? comparables.filter((comp) => selectedComparables.includes(comp.id))
        : comparables;

      // In a real implementation, we would call the API
      if (!config.demoMode && appraisalId) {
        // Real API call would go here
        const response = await apiRequest(`/api/appraisals/${appraisalId}/export-pdf`, {
          method: 'POST',
          body: JSON.stringify({ 
            comparableIds: comparablesToExport.map(comp => comp.id),
            includeAdjustments: true
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to export PDF");
        }
        
        // Trigger download (in a real impl this would stream the PDF)
        // Here we just show a success message
      }

      toast({
        title: "PDF Export Initiated",
        description: `Exporting ${comparablesToExport.length} comparable(s) to PDF. Download will begin shortly.`,
      });
      
      // For demo, simulate a download delay
      if (config.demoMode) {
        setTimeout(() => {
          toast({
            title: "PDF Export Complete",
            description: "Your PDF has been generated and downloaded.",
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error exporting PDF",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportBatchZip = async () => {
    setIsExporting(true);

    try {
      // Only export selected comparables
      const comparablesToExport = selectedComparables.length > 0
        ? comparables.filter((comp) => selectedComparables.includes(comp.id))
        : comparables;

      // In a real implementation, we would call the API
      if (!config.demoMode && appraisalId) {
        // Real API call would go here
        const response = await apiRequest(`/api/appraisals/${appraisalId}/export-zip`, {
          method: 'POST',
          body: JSON.stringify({ 
            comparableIds: comparablesToExport.map(comp => comp.id),
            includeAdjustments: true,
            includeMetadata: config.zipExport.includeMetadata
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to export ZIP");
        }
        
        // Trigger download (in a real impl this would stream the ZIP)
        // Here we just show a success message
      }

      toast({
        title: "ZIP Export Initiated",
        description: `Exporting ${comparablesToExport.length} comparable(s) to ZIP archive. Download will begin shortly.`,
      });
      
      // For demo, simulate a download delay
      if (config.demoMode) {
        setTimeout(() => {
          toast({
            title: "ZIP Export Complete",
            description: "Your ZIP archive has been generated and downloaded.",
          });
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Error exporting ZIP",
        description: "Failed to export ZIP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Batch Adjustments & Export</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportBatchPdf}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportBatchZip}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Export ZIP
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedComparables.length === comparables.length}
                  onCheckedChange={handleSelectAllComparables}
                />
              </TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>GLA</TableHead>
              <TableHead>Bed/Bath</TableHead>
              <TableHead>Adjustments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparables.map((comparable) => (
              <TableRow key={comparable.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedComparables.includes(comparable.id)}
                    onCheckedChange={(checked) =>
                      handleSelectComparable(comparable.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>{comparable.address}</TableCell>
                <TableCell>${comparable.salePrice}</TableCell>
                <TableCell>{comparable.saleDate}</TableCell>
                <TableCell>{comparable.grossLivingArea}</TableCell>
                <TableCell>
                  {comparable.bedrooms}/{comparable.bathrooms}
                </TableCell>
                <TableCell>
                  {comparable.adjustments?.length
                    ? `${comparable.adjustments.length} adjustment(s)`
                    : "None"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick">Quick Templates</TabsTrigger>
          <TabsTrigger value="batch">Batch Adjustments</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="space-y-4 pt-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Label htmlFor="template">Adjustment Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={applyTemplate} disabled={!selectedTemplate}>
              Apply Template
            </Button>
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Adjustment Template</DialogTitle>
                  <DialogDescription>
                    Save your current batch adjustments as a reusable template.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Standard Adjustments"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={saveTemplate}
                    disabled={isSavingTemplate || !newTemplateName.trim()}
                  >
                    {isSavingTemplate ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {selectedTemplate && (
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-2">
                {adjustmentTemplates.find((t) => t.id === selectedTemplate)?.name}
              </h3>
              <ul className="space-y-2">
                {adjustmentTemplates
                  .find((t) => t.id === selectedTemplate)
                  ?.adjustments.map((adj, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{adj.adjustmentType}</p>
                        {adj.description && (
                          <p className="text-sm text-gray-500">
                            {adj.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </TabsContent>
        <TabsContent value="batch" className="space-y-4 pt-4">
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Custom Batch Adjustments</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addBatchAdjustment}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Adjustment
              </Button>
            </div>

            {Object.keys(batchAdjustments).length === 0 ? (
              <p className="text-sm text-gray-500">
                No batch adjustments defined. Click "Add Adjustment" to create one.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(batchAdjustments).map(([id, adjustment]) => (
                  <div key={id} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-2">
                      <Label>Apply To</Label>
                      <Select
                        value={adjustment.applyTo}
                        onValueChange={(value) =>
                          updateBatchAdjustment(id, "applyTo", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label>Type</Label>
                      <Input
                        value={adjustment.adjustmentType}
                        onChange={(e) =>
                          updateBatchAdjustment(
                            id,
                            "adjustmentType",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Location"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Description</Label>
                      <Input
                        value={adjustment.description}
                        onChange={(e) =>
                          updateBatchAdjustment(
                            id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Amount</Label>
                      <Input
                        value={adjustment.amount}
                        onChange={(e) =>
                          updateBatchAdjustment(id, "amount", e.target.value)
                        }
                        placeholder="$"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchAdjustment(id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={applyBatchAdjustments}
                    disabled={
                      isApplyingAdjustments ||
                      Object.keys(batchAdjustments).length === 0
                    }
                  >
                    {isApplyingAdjustments ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Apply Adjustments
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BatchAdjustments;