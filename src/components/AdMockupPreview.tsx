import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";

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

export interface CampaignDetails {
  campaignName: string;
  brandCategory: string;
  campaignObjective: string;
  targetAudience: string;
  creativeNotes: string;
}

interface AdMockupPreviewProps {
  onApprove: (data: { 
    artworkUrl: string; 
    campaignDetails?: CampaignDetails;
  }) => void;
}

// Cached NSFW model reference
let nsfwModel: nsfwjs.NSFWJS | null = null;

const loadNsfwModel = async (): Promise<nsfwjs.NSFWJS> => {
  if (nsfwModel) return nsfwModel;
  tf.enableProdMode();
  nsfwModel = await nsfwjs.load();
  return nsfwModel;
};

const moderateImage = async (file: File): Promise<{ safe: boolean; reason?: string }> => {
  const model = await loadNsfwModel();
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  
  return new Promise((resolve) => {
    img.onload = async () => {
      try {
        const predictions = await model.classify(img);
        URL.revokeObjectURL(url);
        
        const porn = predictions.find(p => p.className === "Porn")?.probability || 0;
        const hentai = predictions.find(p => p.className === "Hentai")?.probability || 0;
        
        if (porn > 0.7 || hentai > 0.7) {
          resolve({ safe: false, reason: "This image violates our advertising content policy and cannot be uploaded." });
        } else {
          resolve({ safe: true });
        }
      } catch {
        URL.revokeObjectURL(url);
        resolve({ safe: true }); // Allow on model error
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ safe: true });
    };
    img.src = url;
  });
};

export const AdMockupPreview = ({ onApprove }: AdMockupPreviewProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  // Preload NSFW model on mount
  useEffect(() => {
    loadNsfwModel().then(() => setModelLoading(false)).catch(() => setModelLoading(false));
  }, []);

  // Campaign details state
  const [campaignName, setCampaignName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [customBrandCategory, setCustomBrandCategory] = useState("");
  const [customCampaignObjective, setCustomCampaignObjective] = useState("");
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

        // NSFW moderation check
        const moderation = await moderateImage(file);
        if (!moderation.safe) {
          throw new Error(moderation.reason || "This image violates our advertising content policy and cannot be uploaded.");
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
    
    setIsConfirmed(true);
    
    // Pass the first uploaded image as the main artwork along with campaign details
    onApprove({
      artworkUrl: uploadedImages[0],
      campaignDetails: {
        campaignName,
        brandCategory: brandCategory === "Other" ? customBrandCategory : brandCategory,
        campaignObjective: campaignObjective === "Other" ? customCampaignObjective : campaignObjective,
        targetAudience,
        creativeNotes,
      },
    });
  };

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
              {brandCategory === "Other" && (
                <Input
                  placeholder="Please specify your category..."
                  value={customBrandCategory}
                  onChange={(e) => {
                    setCustomBrandCategory(e.target.value);
                    setIsConfirmed(false);
                  }}
                />
              )}
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
              {campaignObjective === "Other" && (
                <Input
                  placeholder="Please specify your objective..."
                  value={customCampaignObjective}
                  onChange={(e) => {
                    setCustomCampaignObjective(e.target.value);
                    setIsConfirmed(false);
                  }}
                />
              )}
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
            {uploadedImages.length}/30 photos uploaded (minimum 1 required)
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

        {/* Confirm Button - only show when not yet confirmed */}
        {!isConfirmed && (
          <Button
            onClick={handleConfirmDesign}
            disabled={uploadedImages.length === 0}
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
