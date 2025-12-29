import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, X, Image as ImageIcon } from "lucide-react";
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

interface AdMockupPreviewProps {
  onApprove: (data: { 
    artworkUrl: string; 
    adUnitType: string; 
    selectedSku: string;
  }) => void;
}

export const AdMockupPreview = ({ onApprove }: AdMockupPreviewProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [adUnitType, setAdUnitType] = useState("");
  const [isApproved, setIsApproved] = useState(false);

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
      setIsApproved(false);

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
    setIsApproved(false);
  };

  const handleApprove = () => {
    if (uploadedImages.length === 0 || !adUnitType) {
      toast({
        title: "Missing information",
        description: "Please upload at least one design photo and select an ad unit type.",
        variant: "destructive",
      });
      return;
    }

    const selectedUnit = AD_UNIT_TYPES.find(u => u.value === adUnitType);
    
    setIsApproved(true);
    
    // Pass the first uploaded image as the main artwork
    onApprove({
      artworkUrl: uploadedImages[0],
      adUnitType,
      selectedSku: selectedUnit?.sku || "GLOBAL-STI-SQU-4X4",
    });

    toast({
      title: "Design approved!",
      description: "Proceed to complete your print order below.",
    });
  };

  const selectedUnitInfo = AD_UNIT_TYPES.find(u => u.value === adUnitType);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Design Photos
        </CardTitle>
        <CardDescription>
          Upload your design photos (max 30) and select the ad unit type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>Upload Your Design Photos *</Label>
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

        {/* Ad Unit Type Selection */}
        <div className="space-y-2">
          <Label>Ad Unit Type *</Label>
          <Select value={adUnitType} onValueChange={(value) => {
            setAdUnitType(value);
            setIsApproved(false);
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

        {/* Approve Button */}
        {!isApproved ? (
          <Button
            onClick={handleApprove}
            disabled={uploadedImages.length === 0 || !adUnitType}
            className="w-full"
            size="lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Design
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Design Approved - Complete your order below</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};