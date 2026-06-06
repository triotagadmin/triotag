import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SubmissionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
}

export default function SubmissionDetailsDialog({
  open,
  onOpenChange,
  submission,
}: SubmissionDetailsDialogProps) {
  if (!submission) return null;

  const renderDetails = () => {
    const details = submission.details;

    if (submission.type === "publisher") {
      return (
        <div className="space-y-4">
          <DetailRow label="Business Name" value={details.business_name} />
          <DetailRow label="Publisher Type" value={details.publisher_type} />
          <DetailRow label="Contact Email" value={details.contact_email} />
          <DetailRow label="Contact Phone" value={details.contact_phone} />
          <DetailRow label="Location" value={details.location} />
          <DetailRow label="Description" value={details.description} />
          {details.agent_role && <DetailRow label="Agent Role" value={details.agent_role} />}
          {details.metrics && (
            <>
              <Separator />
              <h4 className="font-semibold">Metrics</h4>
              <pre className="text-sm bg-muted p-3 rounded">{JSON.stringify(details.metrics, null, 2)}</pre>
            </>
          )}
          {details.social_media && (
            <>
              <Separator />
              <h4 className="font-semibold">Social Media</h4>
              <pre className="text-sm bg-muted p-3 rounded">{JSON.stringify(details.social_media, null, 2)}</pre>
            </>
          )}
        </div>
      );
    }

    if (submission.type === "advertiser") {
      return (
        <div className="space-y-4">
          <DetailRow label="Company Name" value={details.company_name} />
          <DetailRow label="Contact Name" value={details.contact_name} />
          <DetailRow label="Contact Email" value={details.contact_email} />
          <DetailRow label="Contact Phone" value={details.contact_phone} />
          <DetailRow label="Website URL" value={details.website_url} />
          <DetailRow label="Company Description" value={details.company_description} />
        </div>
      );
    }

    if (submission.type === "campaign") {
      return (
        <div className="space-y-4">
          <DetailRow label="Campaign Name" value={details.campaign_name} />
          <DetailRow label="Description" value={details.campaign_description} />
          <DetailRow label="Budget" value={`${details.budget_amount} ${details.budget_currency}`} />
          <DetailRow label="Start Date" value={details.start_date} />
          <DetailRow label="End Date" value={details.end_date} />
          <DetailRow label="Target Audience" value={details.target_audience} />
          <DetailRow label="Payment Status" value={details.payment_status} />
          {details.creative_assets && (
            <>
              <Separator />
              <h4 className="font-semibold">Creative Assets</h4>
              <pre className="text-sm bg-muted p-3 rounded">{JSON.stringify(details.creative_assets, null, 2)}</pre>
            </>
          )}
        </div>
      );
    }

    if (submission.type === "ad_space") {
      return (
        <div className="space-y-4">
          <DetailRow label="Title" value={details.title} />
          <DetailRow label="Description" value={details.description} />
          <DetailRow label="Location" value={details.location} />
          <DetailRow label="Availability" value={details.availability_status} />
          {details.pricing && (
            <>
              <Separator />
              <h4 className="font-semibold">Pricing</h4>
              <pre className="text-sm bg-muted p-3 rounded">{JSON.stringify(details.pricing, null, 2)}</pre>
            </>
          )}
          {details.specifications && (
            <>
              <Separator />
              <h4 className="font-semibold">Specifications</h4>
              <pre className="text-sm bg-muted p-3 rounded">{JSON.stringify(details.specifications, null, 2)}</pre>
            </>
          )}
        </div>
      );
    }

    if (submission.type === "admin") {
      return (
        <div className="space-y-4">
          <DetailRow label="Full Name" value={details.full_name} />
          <DetailRow label="Phone Number" value={details.phone_number} />
          <DetailRow label="Status" value={details.status} />
        </div>
      );
    }

    if (submission.type === "verification_document") {
      return (
        <VerificationDocumentDetails details={details} />
      );
    }

    return <p>No additional details available.</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{submission.name}</span>
            <Badge variant="outline" className="capitalize">
              {submission.type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Submitted on {new Date(submission.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderDetails()}
          {submission.details.rejection_reason && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Rejection Reason</h4>
                <p className="text-sm text-muted-foreground">{submission.details.rejection_reason}</p>
              </div>
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="col-span-2">{value}</span>
    </div>
  );
}

function VerificationDocumentDetails({ details }: { details: any }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractStoragePath = (fileUrl: string): string => {
    // If it's already a plain path (e.g. "publisherId/filename.ext"), use as-is
    if (!fileUrl.startsWith("http")) return fileUrl;
    // Extract path from full public URL pattern: .../object/public/verification-documents/PATH
    const match = fileUrl.match(/verification-documents\/(.+)$/);
    return match ? match[1] : fileUrl;
  };

  const handleViewDocument = async () => {
    if (!details.file_url) return;
    setLoadingUrl(true);
    setError(null);
    try {
      const storagePath = extractStoragePath(details.file_url);
      const { data, error: signError } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(storagePath, 3600);
      if (signError) throw signError;
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      }
    } catch (err: any) {
      console.error("Failed to generate signed URL:", err);
      setError("Failed to load document. Please try again.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  return (
    <div className="space-y-4">
      <DetailRow label="Document Type" value={details.document_type?.replace("_", " ")} />
      <DetailRow label="File Name" value={details.file_name} />
      <DetailRow label="Retailer" value={details.publisher_profiles?.business_name} />
      <DetailRow label="Contact Email" value={details.publisher_profiles?.contact_email} />
      <DetailRow label="Verification Status" value={details.publisher_profiles?.verification_status} />
      <DetailRow label="Uploaded At" value={new Date(details.uploaded_at).toLocaleString()} />
      
      {details.file_url && !signedUrl && (
        <div className="pt-4">
          <Button onClick={handleViewDocument} disabled={loadingUrl} variant="outline" size="sm">
            {loadingUrl ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "View Document →"
            )}
          </Button>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
      )}

      {signedUrl && (
        <div className="pt-4 space-y-3">
          {isImage(details.file_name || details.file_url) ? (
            <div className="border rounded-lg overflow-hidden">
              <img src={signedUrl} alt={details.file_name} className="max-w-full max-h-[400px] object-contain mx-auto" />
            </div>
          ) : null}
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium text-sm inline-block"
          >
            Open in new tab →
          </a>
        </div>
      )}
    </div>
  );
}
