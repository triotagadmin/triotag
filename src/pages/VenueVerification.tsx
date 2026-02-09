import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUpload {
  type: string;
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
}

const VenueVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: "business_license",
      label: "Business/Venue License",
      description: "Official business registration or venue operating license",
      file: null,
      uploaded: false,
    },
    {
      type: "government_id",
      label: "Government-Issued ID",
      description: "Valid ID of business owner (passport, driver's license, national ID)",
      file: null,
      uploaded: false,
    },
    {
      type: "proof_of_address",
      label: "Proof of Address",
      description: "Utility bill, bank statement, or lease agreement (within 3 months)",
      file: null,
      uploaded: false,
    },
    {
      type: "safety_certificate",
      label: "Safety Certificates",
      description: "Fire safety, occupancy permit, or health certificate",
      file: null,
      uploaded: false,
    },
    {
      type: "tax_documents",
      label: "Tax/Registration Documents",
      description: "Tax registration certificate or similar business documentation",
      file: null,
      uploaded: false,
    },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id, verification_status")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setPublisherId(profile.id);
        setVerificationStatus(profile.verification_status);
      } else {
        navigate("/complete-profile");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleFileSelect = (index: number, file: File | null) => {
    const newDocuments = [...documents];
    newDocuments[index].file = file;
    setDocuments(newDocuments);
  };

  const uploadDocument = async (doc: DocumentUpload, publisherId: string) => {
    if (!doc.file) return null;

    const fileExt = doc.file.name.split('.').pop();
    const fileName = `${doc.type}_${Date.now()}.${fileExt}`;
    const filePath = `${publisherId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, doc.file);

    if (uploadError) throw uploadError;

    // Save document reference with storage path (not public URL since bucket is private)
    const { error: dbError } = await supabase
      .from('verification_documents')
      .insert({
        publisher_id: publisherId,
        document_type: doc.type,
        file_name: doc.file.name,
        file_url: filePath,
      });

    if (dbError) throw dbError;

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publisherId) return;

    const filledDocs = documents.filter(doc => doc.file !== null);
    
    if (filledDocs.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one verification document",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload all documents
      const uploadPromises = filledDocs.map(doc => uploadDocument(doc, publisherId));
      await Promise.all(uploadPromises);

      // Update publisher profile verification status
      const { error: updateError } = await supabase
        .from('publisher_profiles')
        .update({ 
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', publisherId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Verification documents submitted successfully. You'll be notified once reviewed.",
      });

      // Mark documents as uploaded
      setDocuments(documents.map(doc => ({
        ...doc,
        uploaded: doc.file !== null,
        file: null,
      })));

      setTimeout(() => navigate("/venue"), 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const allUploaded = documents.every(doc => doc.uploaded);
  const hasFilesSelected = documents.some(doc => doc.file !== null);

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/venue")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Venue Verification</CardTitle>
            <CardDescription>
              Upload the required documents to verify your venue. All documents will be securely stored and reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationStatus === 'approved' && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your venue is already verified!
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === 'pending' && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your verification is pending review. You can submit additional documents if needed.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Global Compliance:</strong> These requirements work for venues worldwide (USA, Philippines, and other countries). Upload equivalent documents based on your country's regulations.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                {documents.map((doc, index) => (
                  <Card key={doc.type} className={doc.uploaded ? "border-green-200 bg-green-50/50" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Label className="text-base font-semibold">
                              {doc.label}
                            </Label>
                            {doc.uploaded && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {doc.description}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted/50">
                              <Upload className="w-4 h-4" />
                              <span className="text-sm">
                                {doc.file ? doc.file.name : "Choose file"}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                                disabled={loading}
                              />
                            </label>
                            
                            {doc.file && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileSelect(index, null)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB per document.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || !hasFilesSelected}
                >
                  {loading ? "Submitting..." : "Verify Venue"}
                </Button>
                {allUploaded && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate("/venue")}
                  >
                    Done
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueVerification;
