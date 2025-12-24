import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { shouldDisableDate, getMinimumBookingDate } from "@/lib/businessDays";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleApprovalStepProps {
  activationId: string;
  status: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  rejectionReason?: string;
  onDatesSelected: (startDate: Date, endDate: Date) => void;
  onSubmitForApproval: () => void;
  isSubmitting: boolean;
}

export function ScheduleApprovalStep({
  activationId,
  status,
  startDate,
  endDate,
  rejectionReason,
  onDatesSelected,
  onSubmitForApproval,
  isSubmitting,
}: ScheduleApprovalStepProps) {
  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(endDate);
  const minDate = getMinimumBookingDate();

  // Real-time subscription for approval status changes
  useEffect(() => {
    if (!activationId) return;

    const channel = supabase
      .channel(`activation-${activationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activations',
          filter: `id=eq.${activationId}`,
        },
        (payload) => {
          // Refresh the page when status changes
          if (payload.new.status !== status) {
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activationId, status]);

  const handleStartDateSelect = (date: Date | undefined) => {
    setLocalStartDate(date);
    if (date && localEndDate) {
      onDatesSelected(date, localEndDate);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setLocalEndDate(date);
    if (localStartDate && date) {
      onDatesSelected(localStartDate, date);
    }
  };

  const canSubmit = localStartDate && localEndDate && !isSubmitting;

  if (status === "pending_approval") {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-500">
            <Clock className="h-5 w-5 animate-pulse" />
            Waiting for Publisher Approval
          </CardTitle>
          <CardDescription>
            Your booking request has been sent to the venue publisher. You'll be notified once they respond.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Requested Dates:</p>
              <p className="text-lg">
                {startDate && format(startDate, "PPP")} - {endDate && format(endDate, "PPP")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking for publisher response...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Booking Request Rejected
          </CardTitle>
          <CardDescription>
            The publisher has declined your booking request. You can modify your dates and resubmit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rejectionReason && (
            <div className="p-4 bg-destructive/10 rounded-lg mb-4">
              <p className="text-sm font-medium text-destructive">Reason:</p>
              <p className="text-sm">{rejectionReason}</p>
            </div>
          )}
          {/* Show date selection again */}
          <DateSelectionForm
            localStartDate={localStartDate}
            localEndDate={localEndDate}
            minDate={minDate}
            onStartDateSelect={handleStartDateSelect}
            onEndDateSelect={handleEndDateSelect}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            onSubmit={onSubmitForApproval}
          />
        </CardContent>
      </Card>
    );
  }

  if (status === "approved") {
    return (
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            Booking Approved!
          </CardTitle>
          <CardDescription>
            The publisher has approved your booking. Proceed to place your print order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium">Confirmed Dates:</p>
            <p className="text-lg font-semibold">
              {startDate && format(startDate, "PPP")} - {endDate && format(endDate, "PPP")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: design phase - show date selection
  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Your Booking</CardTitle>
        <CardDescription>
          Select your campaign dates. Note: A 5 business day leeway is required for ad printing and delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DateSelectionForm
          localStartDate={localStartDate}
          localEndDate={localEndDate}
          minDate={minDate}
          onStartDateSelect={handleStartDateSelect}
          onEndDateSelect={handleEndDateSelect}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={onSubmitForApproval}
        />
      </CardContent>
    </Card>
  );
}

interface DateSelectionFormProps {
  localStartDate: Date | undefined;
  localEndDate: Date | undefined;
  minDate: Date;
  onStartDateSelect: (date: Date | undefined) => void;
  onEndDateSelect: (date: Date | undefined) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

function DateSelectionForm({
  localStartDate,
  localEndDate,
  minDate,
  onStartDateSelect,
  onEndDateSelect,
  canSubmit,
  isSubmitting,
  onSubmit,
}: DateSelectionFormProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Earliest available date: <span className="font-medium text-foreground">{format(minDate, "PPP")}</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !localStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localStartDate ? format(localStartDate, "PPP") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localStartDate}
                onSelect={onStartDateSelect}
                disabled={shouldDisableDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !localEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localEndDate ? format(localEndDate, "PPP") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localEndDate}
                onSelect={onEndDateSelect}
                disabled={(date) => shouldDisableDate(date) || (localStartDate ? date < localStartDate : false)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit for Publisher Approval"
        )}
      </Button>
    </div>
  );
}
