import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Shield, 
  Users, 
  FileCheck, 
  Upload, 
  Loader2,
  AlertTriangle,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ComplianceData {
  campaignObjective: string;
  brandCategory: string;
  competitiveConflictDeclaration: string;
  creativeComplianceConfirmed: boolean;
  restrictedContent: string[];
  legalPermissionsUrls: string[];
  sensitiveThemeFlag: string;
  campaignManagerName: string;
  campaignManagerEmail: string;
  campaignManagerPhone: string;
  onsiteInstallationContact: string;
  emergencyContact: string;
  requireInstallationPhotos: boolean;
  requireProofOfPlay: boolean;
  reportingFrequency: string;
}

interface AdvertiserComplianceFormProps {
  activationId: string;
  initialData?: Partial<ComplianceData>;
  onComplete: (data: ComplianceData) => void;
  onBack: () => void;
}

const CAMPAIGN_OBJECTIVES = [
  { value: "awareness", label: "Brand Awareness" },
  { value: "directional", label: "Directional" },
  { value: "retail_footfall", label: "Retail Footfall" },
  { value: "product_launch", label: "Product Launch" },
  { value: "political", label: "Political" },
  { value: "government_info", label: "Government Info" },
  { value: "other", label: "Other" },
];

const BRAND_CATEGORIES = [
  { value: "fmcg", label: "FMCG" },
  { value: "alcohol", label: "Alcohol" },
  { value: "finance", label: "Finance" },
  { value: "pharma", label: "Pharma" },
  { value: "government", label: "Government" },
  { value: "tech", label: "Tech" },
  { value: "automotive", label: "Automotive" },
  { value: "retail", label: "Retail" },
  { value: "other", label: "Other" },
];

const RESTRICTED_CONTENT_OPTIONS = [
  { value: "alcohol", label: "Alcohol" },
  { value: "gambling", label: "Gambling" },
  { value: "vape", label: "Vape" },
  { value: "political", label: "Political" },
  { value: "adult_themes", label: "Adult Themes" },
  { value: "none", label: "None" },
];

const SENSITIVE_THEMES = [
  { value: "none", label: "None" },
  { value: "religious", label: "Religious" },
  { value: "culturally_sensitive", label: "Culturally Sensitive" },
  { value: "socially_sensitive", label: "Socially Sensitive" },
  { value: "other", label: "Other" },
];

const REPORTING_FREQUENCIES = [
  { value: "end-of-campaign", label: "End of Campaign" },
  { value: "weekly", label: "Weekly" },
  { value: "both", label: "Both" },
];

export function AdvertiserComplianceForm({
  activationId,
  initialData,
  onComplete,
  onBack,
}: AdvertiserComplianceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ComplianceData>({
    campaignObjective: initialData?.campaignObjective || "",
    brandCategory: initialData?.brandCategory || "",
    competitiveConflictDeclaration: initialData?.competitiveConflictDeclaration || "",
    creativeComplianceConfirmed: initialData?.creativeComplianceConfirmed || false,
    restrictedContent: initialData?.restrictedContent || [],
    legalPermissionsUrls: initialData?.legalPermissionsUrls || [],
    sensitiveThemeFlag: initialData?.sensitiveThemeFlag || "none",
    campaignManagerName: initialData?.campaignManagerName || "",
    campaignManagerEmail: initialData?.campaignManagerEmail || "",
    campaignManagerPhone: initialData?.campaignManagerPhone || "",
    onsiteInstallationContact: initialData?.onsiteInstallationContact || "",
    emergencyContact: initialData?.emergencyContact || "",
    requireInstallationPhotos: initialData?.requireInstallationPhotos || false,
    requireProofOfPlay: initialData?.requireProofOfPlay || false,
    reportingFrequency: initialData?.reportingFrequency || "end-of-campaign",
  });

  const toggleRestrictedContent = (value: string) => {
    setFormData(prev => {
      let updated: string[];
      if (value === "none") {
        updated = prev.restrictedContent.includes("none") ? [] : ["none"];
      } else {
        updated = prev.restrictedContent.filter(v => v !== "none");
        if (updated.includes(value)) {
          updated = updated.filter(v => v !== value);
        } else {
          updated = [...updated, value];
        }
      }
      return { ...prev, restrictedContent: updated };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const uploadedUrls: string[] = [...formData.legalPermissionsUrls];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${activationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('verification-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData(prev => ({ ...prev, legalPermissionsUrls: uploadedUrls }));
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeUploadedFile = (url: string) => {
    setFormData(prev => ({
      ...prev,
      legalPermissionsUrls: prev.legalPermissionsUrls.filter(u => u !== url),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.campaignManagerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign Manager Name is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.campaignManagerEmail.trim() || !formData.campaignManagerEmail.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Valid Campaign Manager Email is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.campaignManagerPhone.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign Manager Phone is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.creativeComplianceConfirmed) {
      toast({
        title: "Validation Error",
        description: "Please confirm creative compliance declaration.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("activations")
        .update({
          campaign_objective: formData.campaignObjective,
          brand_category: formData.brandCategory,
          competitive_conflict_declaration: formData.competitiveConflictDeclaration,
          creative_compliance_confirmed: formData.creativeComplianceConfirmed,
          restricted_content: formData.restrictedContent,
          legal_permissions_urls: formData.legalPermissionsUrls,
          sensitive_theme_flag: formData.sensitiveThemeFlag,
          campaign_manager_name: formData.campaignManagerName,
          campaign_manager_email: formData.campaignManagerEmail,
          campaign_manager_phone: formData.campaignManagerPhone,
          onsite_installation_contact: formData.onsiteInstallationContact,
          emergency_contact: formData.emergencyContact,
          require_installation_photos: formData.requireInstallationPhotos,
          require_proof_of_play: formData.requireProofOfPlay,
          reporting_frequency: formData.reportingFrequency,
          compliance_completed: true,
        })
        .eq("id", activationId);

      if (error) throw error;

      toast({
        title: "Compliance Details Saved",
        description: "Your campaign details have been saved successfully.",
      });

      onComplete(formData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save compliance details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Campaign Intent & Targeting Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Campaign Intent & Targeting Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Campaign Objective</Label>
              <Select
                value={formData.campaignObjective}
                onValueChange={(v) => setFormData(prev => ({ ...prev, campaignObjective: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select objective" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_OBJECTIVES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Brand Category</Label>
              <Select
                value={formData.brandCategory}
                onValueChange={(v) => setFormData(prev => ({ ...prev, brandCategory: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_CATEGORIES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Competitive Conflict Declaration</Label>
            <Textarea
              placeholder="List any brands or categories that conflict with your campaign."
              value={formData.competitiveConflictDeclaration}
              onChange={(e) => setFormData(prev => ({ ...prev, competitiveConflictDeclaration: e.target.value }))}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              List any brands or categories that conflict with your campaign.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Content & Compliance Disclosures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Content & Compliance Disclosures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="compliance"
              checked={formData.creativeComplianceConfirmed}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, creativeComplianceConfirmed: checked === true }))
              }
            />
            <div className="space-y-1">
              <Label htmlFor="compliance" className="font-medium cursor-pointer">
                Creative Compliance Declaration *
              </Label>
              <p className="text-sm text-muted-foreground">
                I confirm this creative complies with relevant local advertising laws and regulations.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Restricted Content Declaration</Label>
            <div className="flex flex-wrap gap-2">
              {RESTRICTED_CONTENT_OPTIONS.map(opt => (
                <Badge
                  key={opt.value}
                  variant={formData.restrictedContent.includes(opt.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleRestrictedContent(opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sensitive Theme Flag</Label>
            <Select
              value={formData.sensitiveThemeFlag}
              onValueChange={(v) => setFormData(prev => ({ ...prev, sensitiveThemeFlag: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {SENSITIVE_THEMES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Proof of Legal Permissions</Label>
            <div className="p-4 border border-dashed rounded-lg bg-muted/20">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Upload government approvals, endorser/model releases, or trademark authorizations
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                  disabled={uploadingFiles}
                />
                {uploadingFiles && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              {formData.legalPermissionsUrls.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.legalPermissionsUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-sm truncate max-w-[200px]">
                        Document {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadedFile(url)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              If applicable, upload documentation supporting use of sensitive or regulated content.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Logistics & Coordination Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Logistics & Coordination Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Campaign Manager Name *</Label>
              <Input
                placeholder="Full name"
                value={formData.campaignManagerName}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignManagerName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Campaign Manager Email *</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.campaignManagerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignManagerEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Campaign Manager Phone *</Label>
              <Input
                type="tel"
                placeholder="+63 917 123 4567"
                value={formData.campaignManagerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignManagerPhone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>On-Site Installation Contact (Optional)</Label>
              <Input
                placeholder="Name & phone"
                value={formData.onsiteInstallationContact}
                onChange={(e) => setFormData(prev => ({ ...prev, onsiteInstallationContact: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Emergency Contact (Optional)</Label>
              <Input
                placeholder="Name & phone"
                value={formData.emergencyContact}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Proof & Reporting Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Proof & Reporting Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Require Installation Photos?</Label>
                <p className="text-sm text-muted-foreground">Request photos upon ad installation</p>
              </div>
              <Switch
                checked={formData.requireInstallationPhotos}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, requireInstallationPhotos: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Require Proof-of-Play Report?</Label>
                <p className="text-sm text-muted-foreground">Request confirmation of ad display</p>
              </div>
              <Switch
                checked={formData.requireProofOfPlay}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, requireProofOfPlay: checked }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reporting Frequency</Label>
            <Select
              value={formData.reportingFrequency}
              onValueChange={(v) => setFormData(prev => ({ ...prev, reportingFrequency: v }))}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {REPORTING_FREQUENCIES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Warning if required fields missing */}
      {(!formData.campaignManagerName || !formData.campaignManagerEmail || !formData.campaignManagerPhone || !formData.creativeComplianceConfirmed) && (
        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-600">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            Complete all required fields (*) to proceed with publisher approval.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Schedule
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Submit for Approval"
          )}
        </Button>
      </div>
    </div>
  );
}