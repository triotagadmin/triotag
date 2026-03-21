import { format, differenceInDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, AlertTriangle, FileText } from "lucide-react";

interface ScheduleSummaryProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  estimatedPayout: number;
  showError?: boolean;
}

export function ScheduleSummary({
  startDate,
  endDate,
  estimatedPayout,
  showError = false,
}: ScheduleSummaryProps) {
  if (showError || !startDate || !endDate) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Campaign Details Missing
          </CardTitle>
          <CardDescription>
            Campaign schedule must be completed during the Design Ad process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please go back to the Design step and complete the booking schedule before submitting for publisher approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  const days = differenceInDays(endDate, startDate) + 1;
  const weeks = Math.ceil(days / 7);

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Print Partner Compliance & Campaign Details
        </CardTitle>
        <CardDescription>
          Complete the form below to submit your booking for publisher approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Start Date
            </div>
            <p className="text-lg font-semibold">
              {format(startDate, "PPP")}
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              End Date
            </div>
            <p className="text-lg font-semibold">
              {format(endDate, "PPP")}
            </p>
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Campaign Duration</span>
            <div className="flex gap-2">
              <Badge variant="secondary">{days} days</Badge>
              <Badge variant="secondary">{weeks} week{weeks !== 1 ? 's' : ''}</Badge>
            </div>
          </div>

          {estimatedPayout > 0 && (
            <div className="flex items-center justify-between pt-2 border-t mt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium">Estimated Publisher Payout</span>
              </div>
              <span className="text-xl font-bold text-primary">
                ₱{estimatedPayout.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
