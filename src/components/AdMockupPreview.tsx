import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Eye, CheckCircle, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Ad unit types with their display names and Prodigi SKU mappings
const AD_UNIT_TYPES = [
  { value: "window-sticker", label: "Window Sticker", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "table-tent", label: "Table Tent", sku: "GLOBAL-STI-REC-3X4" },
  { value: "countertop-stand", label: "Countertop Stand", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "wall-sticker", label: "Wall Sticker", sku: "GLOBAL-STI-SQU-4X4" },
  { value: "door-sticker", label: "Door Sticker", sku: "GLOBAL-STI-REC-3X4" },
  { value: "tabletop-qr-card", label: "Tabletop QR Card", sku: "GLOBAL-STI-SQU-2X2" },
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
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [adUnitType, setAdUnitType] = useState("");
  const [generating, setGenerating] = useState(false);
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG or JPG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setMockupImage(null);
    setIsApproved(false);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePreview = async () => {
    if (!selectedFile || !adUnitType) {
      toast({
        title: "Missing information",
        description: "Please upload a design and select an ad unit type.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setMockupImage(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate-mockup", {
        body: {
          adUnitType,
          imageBase64: base64,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to generate mockup");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMockupImage(data.mockupImage);
      
      toast({
        title: "Preview generated!",
        description: "Review your ad mockup below.",
      });
    } catch (error: any) {
      console.error("Error generating mockup:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate mockup preview.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = () => {
    if (!filePreview || !adUnitType) return;

    const selectedUnit = AD_UNIT_TYPES.find(u => u.value === adUnitType);
    
    setIsApproved(true);
    
    // Pass the original artwork (not the mockup) to the order flow
    onApprove({
      artworkUrl: filePreview,
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
          <Eye className="h-5 w-5" />
          AI Mockup Preview
        </CardTitle>
        <CardDescription>
          Upload your design and see a photorealistic preview before ordering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label>Upload Your Design</Label>
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
            {filePreview ? (
              <div className="space-y-3">
                <img 
                  src={filePreview} 
                  alt="Uploaded design" 
                  className="max-h-32 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">
                  {selectedFile?.name}
                </p>
                <Button variant="outline" size="sm" type="button">
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload PNG or JPG (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ad Unit Type Selection */}
        <div className="space-y-2">
          <Label>Ad Unit Type</Label>
          <Select value={adUnitType} onValueChange={(value) => {
            setAdUnitType(value);
            setMockupImage(null);
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

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePreview}
          disabled={generating || !selectedFile || !adUnitType}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Preview...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Generate Preview
            </>
          )}
        </Button>

        {/* Mockup Preview */}
        {mockupImage && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-lg font-semibold">AI-Generated Mockup</Label>
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img 
                src={mockupImage} 
                alt="AI Generated Mockup" 
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              This is a preview only. Your original design will be used for printing.
            </p>
            
            {!isApproved ? (
              <Button
                onClick={handleApprove}
                className="w-full"
                size="lg"
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve for Print
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Design Approved - Complete your order below</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
