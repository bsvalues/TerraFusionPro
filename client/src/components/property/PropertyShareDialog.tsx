import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  CalendarIcon, 
  ClipboardCopy, 
  Share2, 
  Link, 
  Check, 
  Loader2,
  X 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

interface PropertyShareDialogProps {
  propertyId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyShareDialog({ 
  propertyId, 
  isOpen, 
  onClose 
}: PropertyShareDialogProps) {
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [viewLimit, setViewLimit] = useState<number | "">("");
  const [includeSettings, setIncludeSettings] = useState({
    reports: false,
    photos: true,
    comparables: true,
    valuations: true
  });

  // Fetch existing share links for this property
  const { data: shareLinks, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['/api/properties', propertyId, 'share-links'],
    queryFn: async () => {
      return await apiRequest(`/api/properties/${propertyId}/share-links`);
    },
    enabled: isOpen && !!propertyId
  });

  // Create a new share link
  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      const data = {
        expiresAt: expiryDate?.toISOString(),
        viewsLimit: viewLimit === "" ? undefined : Number(viewLimit),
        allowReports: includeSettings.reports,
        includePhotos: includeSettings.photos,
        includeComparables: includeSettings.comparables,
        includeValuation: includeSettings.valuations
      };

      return await apiRequest(`/api/properties/${propertyId}/share`, {
        method: 'POST',
        data
      });
    },
    onSuccess: (data) => {
      setShareLink(data.shareUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'share-links'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create share link",
        description: "There was an error creating a share link. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete a share link
  const deleteShareLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await apiRequest(`/api/property-shares/${linkId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId, 'share-links'] });
      toast({
        title: "Share link deleted",
        description: "The share link has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete share link",
        description: "There was an error deleting the share link. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerateLink = () => {
    createShareLinkMutation.mutate();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share it with others.",
      });
    });
  };

  const handleDeleteLink = (linkId: number) => {
    deleteShareLinkMutation.mutate(linkId);
  };

  const formatExpiryInfo = (link: any) => {
    if (!link.expiresAt) return "Never expires";
    
    const expiryDate = new Date(link.expiresAt);
    return `Expires on ${format(expiryDate, "MMM d, yyyy")}`;
  };

  const formatViewLimit = (link: any) => {
    if (!link.viewsLimit) return "Unlimited views";
    return `${link.viewCount || 0}/${link.viewsLimit} views`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share Property</DialogTitle>
          <DialogDescription>
            Create a shareable link to allow others to view this property without needing an account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {shareLink ? (
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Your share link is ready:</h3>
              <div className="flex items-center space-x-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  onClick={handleCopyToClipboard} 
                  variant="outline"
                  size="icon"
                >
                  {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This link can be used by anyone to view this property information according to the sharing options you've set.
              </p>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setShareLink("")}
              >
                Create Another Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Link Expiration</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="expiry"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "MMM d, yyyy") : "Never expires"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                      <div className="p-3 border-t border-border">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => setExpiryDate(undefined)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          No expiration
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="viewLimit">View Limit</Label>
                  <Input
                    id="viewLimit"
                    type="number"
                    placeholder="Unlimited"
                    min="1"
                    value={viewLimit}
                    onChange={(e) => setViewLimit(e.target.value === "" ? "" : parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-medium text-sm">Share Options</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowReports">Include Reports</Label>
                    <p className="text-sm text-muted-foreground">Allow viewing of appraisal reports</p>
                  </div>
                  <Switch
                    id="allowReports"
                    checked={includeSettings.reports}
                    onCheckedChange={(checked) => setIncludeSettings({...includeSettings, reports: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="includePhotos">Include Photos</Label>
                    <p className="text-sm text-muted-foreground">Share property photos</p>
                  </div>
                  <Switch
                    id="includePhotos"
                    checked={includeSettings.photos}
                    onCheckedChange={(checked) => setIncludeSettings({...includeSettings, photos: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="includeComparables">Include Comparables</Label>
                    <p className="text-sm text-muted-foreground">Include comparable property data</p>
                  </div>
                  <Switch
                    id="includeComparables"
                    checked={includeSettings.comparables}
                    onCheckedChange={(checked) => setIncludeSettings({...includeSettings, comparables: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="includeValuation">Include Valuation</Label>
                    <p className="text-sm text-muted-foreground">Share property valuation data</p>
                  </div>
                  <Switch
                    id="includeValuation"
                    checked={includeSettings.valuations}
                    onCheckedChange={(checked) => setIncludeSettings({...includeSettings, valuations: checked})}
                  />
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleGenerateLink} 
                disabled={createShareLinkMutation.isPending}
              >
                {createShareLinkMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Existing Share Links */}
          {isLoadingLinks ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shareLinks && shareLinks.length > 0 ? (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Existing Share Links</h3>
              <div className="space-y-3">
                {shareLinks.map((link: any) => (
                  <div 
                    key={link.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1 truncate">
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{link.shareUrl}</span>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatExpiryInfo(link)}</span>
                        <span className="mx-1">•</span>
                        <span>{formatViewLimit(link)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(link.shareUrl);
                          toast({ title: "Link copied to clipboard" });
                        }}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteShareLinkMutation.isPending}
                      >
                        {deleteShareLinkMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}