import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
