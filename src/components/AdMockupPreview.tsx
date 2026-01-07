import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Ad unit types with their display names and Prodigi SKU mappings
const AD_UNIT_TYPES = [
  { value: "window-sticker", label: "Window Sticker", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "table-tent", label: "Table Tent", sku: "GLOBAL-STI-REC-3X4" },
  { value: "countertop-stand", label: "Countertop Stand", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "wall-sticker", label: "Wall Sticker", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "door-sticker", label: "Door Sticker", sku: "GLOBAL-STI-REC-3X4" },
  { value: "tabletop-qr-card", label: "Tabletop QR Card", sku: "GLOBAL-STI-SQU-2X2" },
  { value: "mural-painting", label: "Mural Painting", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "wheat-paste", label: "Wheat Paste", sku: "GLOBAL-STI-SQU-4X4" },
];

const BRAND_CATEGORIES = [
  "Food & Beverage",
  "Retail & Shopping",
  "Technology",
  "Health & Wellness",
  "Entertainment",
  "Finance & Banking",
  "Travel & Tourism",
  "Education",
  "Real Estate",
  "Automotive",
  "Fashion & Beauty",
  "Sports & Fitness",
  "Other",
];

const CAMPAIGN_OBJECTIVES = [
  "Brand Awareness",
  "Product Launch",
  "Store/Location Promotion",
  "Event Promotion",
  "Seasonal Campaign",
  "Customer Acquisition",
  "Loyalty/Retention",
  "Other",
];

interface CampaignDetails {
  campaignName: string;
  brandCategory: string;
  campaignObjective: string;
  targetAudience: string;
  creativeNotes: string;
}

interface AdMockupPreviewProps {
  onApprove: (data: { 
    artworkUrl: string; 
    adUnitType: string; 
    selectedSku: string;
    campaignDetails?: CampaignDetails;
  }) => void;
}

export const AdMockupPreview = ({ onApprove }: AdMockupPreviewProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [adUnitType, setAdUnitType] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Campaign details state
  const [campaignName, setCampaignName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [creativeNotes, setCreativeNotes] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check limit
    if (uploadedImages.length + files.length > 30) {
      toast({
        title: "Too many files",
        description: "Maximum 30 photos allowed.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not authenticated",
          description: "Please log in to upload files.",
          variant: "destructive",
        });
        return;
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
          throw new Error(`Invalid file type: ${file.name}. Please upload PNG or JPG images.`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Maximum 10MB per file.`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/activations/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ad-space-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ad-space-media')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
      setIsConfirmed(false);

      toast({
        title: "Upload successful",
        description: `${urls.length} image(s) uploaded.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url));
    setIsConfirmed(false);
  };

  const handleConfirmDesign = () => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Missing creative",
        description: "Please upload at least one design photo.",
        variant: "destructive",
      });
      return;
    }

    if (!adUnitType) {
      toast({
        title: "Missing ad unit",
        description: "Please select an ad unit type.",
        variant: "destructive",
      });
      return;
    }

    const selectedUnit = AD_UNIT_TYPES.find(u => u.value === adUnitType);
    
    setIsConfirmed(true);
    
    // Pass the first uploaded image as the main artwork along with campaign details
    onApprove({
      artworkUrl: uploadedImages[0],
      adUnitType,
      selectedSku: selectedUnit?.sku || "GLOBAL-STI-SQU-4X4",
      campaignDetails: {
        campaignName,
        brandCategory,
        campaignObjective,
        targetAudience,
        creativeNotes,
      },
    });
  };

  const selectedUnitInfo = AD_UNIT_TYPES.find(u => u.value === adUnitType);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Book Ad Space
        </CardTitle>
        <CardDescription>
          Upload your creative and provide campaign details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campaign Details Section */}
        <div className="space-y-4 pb-4 border-b">
          <h4 className="font-medium text-sm text-muted-foreground">Campaign Details</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g., Summer Sale 2026"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  setIsConfirmed(false);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Brand Category</Label>
              <Select value={brandCategory} onValueChange={(value) => {
                setBrandCategory(value);
                setIsConfirmed(false);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Objective</Label>
              <Select value={campaignObjective} onValueChange={(value) => {
                setCampaignObjective(value);
                setIsConfirmed(false);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select objective..." />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_OBJECTIVES.map((obj) => (
                    <SelectItem key={obj} value={obj}>
                      {obj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Target Audience (optional)</Label>
              <Input
                placeholder="e.g., Young professionals, 25-35"
                value={targetAudience}
                onChange={(e) => {
                  setTargetAudience(e.target.value);
                  setIsConfirmed(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Upload Your Creative *</Label>
          <p className="text-sm text-muted-foreground">
            {uploadedImages.length}/30 photos uploaded
          </p>
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading || uploadedImages.length >= 30}
            />
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploading ? "Uploading..." : "Click to upload PNG or JPG (max 10MB each, up to 30 photos)"}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`Design ${index + 1}`} 
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(url);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Creative Notes */}
        <div className="space-y-2">
          <Label>Creative Notes (optional)</Label>
          <Textarea
            placeholder="Any special instructions or notes about your creative..."
            value={creativeNotes}
            onChange={(e) => {
              setCreativeNotes(e.target.value);
              setIsConfirmed(false);
            }}
            rows={2}
          />
        </div>

        {/* Ad Unit Type Selection */}
        <div className="space-y-2">
          <Label>Ad Unit Type *</Label>
          <Select value={adUnitType} onValueChange={(value) => {
            setAdUnitType(value);
            setIsConfirmed(false);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select ad unit type..." />
            </SelectTrigger>
            <SelectContent>
              {AD_UNIT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUnitInfo && (
            <p className="text-sm text-muted-foreground">
              Maps to product: {selectedUnitInfo.sku}
            </p>
          )}
        </div>

        {/* Confirm Button - only show when not yet confirmed */}
        {!isConfirmed && (
          <Button
            onClick={handleConfirmDesign}
            disabled={uploadedImages.length === 0 || !adUnitType}
            className="w-full"
            size="lg"
          >
            Continue to Schedule
          </Button>
        )}
        
        {isConfirmed && (
          <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg text-primary">
            <span className="font-medium">✓ Details saved - Select dates below and submit</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
