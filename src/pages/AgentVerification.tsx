import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUpload {
  type: string;
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
}

const AgentVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: "government_id",
      label: "Government-Issued ID",
      description: "Passport, driver's license, or national ID card",
      file: null,
      uploaded: false,
    },
    {
      type: "proof_of_address",
      label: "Proof of Address",
      description: "Utility bill or bank statement (within last 3 months)",
      file: null,
      uploaded: false,
    },
    {
      type: "certifications",
      label: "Professional Certifications",
      description: "Any relevant certifications or licenses for your role",
      file: null,
      uploaded: false,
    },
    {
      type: "portfolio_verification",
      label: "Portfolio Verification",
      description: "Recent work samples or client testimonials",
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
    if (!doc.file) return;

    const fileExt = doc.file.name.split('.').pop();
    const fileName = `${doc.type}-${Date.now()}.${fileExt}`;
    const filePath = `${publisherId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, doc.file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('verification_documents')
      .insert({
        publisher_id: publisherId,
        document_type: doc.type,
        file_url: publicUrl,
        file_name: doc.file.name,
      });

    if (dbError) throw dbError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publisherId) {
      toast({
        title: "Error",
        description: "Publisher ID not found",
        variant: "destructive",
      });
      return;
    }

    const hasFiles = documents.some(doc => doc.file !== null);
    if (!hasFiles) {
      toast({
        title: "Error",
        description: "Please select at least one document to upload",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      for (const doc of documents) {
        if (doc.file) {
          await uploadDocument(doc, publisherId);
          const index = documents.indexOf(doc);
          const newDocuments = [...documents];
          newDocuments[index].uploaded = true;
          setDocuments(newDocuments);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const { error: updateError } = await supabase
        .from('publisher_profiles')
        .update({ verification_status: 'pending' })
        .eq('user_id', session?.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Verification documents submitted successfully. We'll review them within 2-3 business days.",
      });

      setVerificationStatus('pending');
      
      setTimeout(() => {
        navigate("/agent-publishers");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/agent-publishers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Agent Credentials Verification</CardTitle>
            <CardDescription>
              Upload the required documents to verify your identity and credentials.
              All documents must be clear, legible, and comply with international standards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationStatus === 'approved' && (
              <Alert className="mb-6 border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your agent credentials are already verified!
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === 'pending' && (
              <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Your verification documents are under review. We'll notify you once the review is complete.
                </AlertDescription>
              </Alert>
            )}

            {verificationStatus === 'rejected' && (
              <Alert className="mb-6 border-red-500 bg-red-50">
                <AlertDescription className="text-red-800">
                  Your previous verification was rejected. Please submit updated documents.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {documents.map((doc, index) => (
                <div key={doc.type} className="space-y-2">
                  <Label htmlFor={doc.type}>
                    {doc.label}
                    {doc.uploaded && (
                      <CheckCircle className="inline w-4 h-4 ml-2 text-green-600" />
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                  <div className="flex gap-2">
                    <Input
                      id={doc.type}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                      disabled={loading || doc.uploaded}
                    />
                    {doc.file && !doc.uploaded && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileSelect(index, null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/agent-publishers")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || verificationStatus === 'approved'}
                  className="flex-1"
                >
                  {loading ? "Uploading..." : documents.every(d => d.uploaded) ? "Done" : "Submit Documents"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentVerification;
