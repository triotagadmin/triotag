import { useState, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Image, Calendar as CalendarIcon, Target, Users, FileText, Package } from "lucide-react";

interface Activation {
  id: string;
  ad_space_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  start_date: string | null;
  end_date: string | null;
  brand_category?: string | null;
  campaign_objective?: string | null;
  estimated_publisher_payout?: number | null;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

interface PublisherCalendarProps {
  activations: Activation[];
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  sticker: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  table_tent: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  poster: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  flyer: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  banner: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  other: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
};

export function PublisherCalendar({ activations }: PublisherCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedActivations, setSelectedActivations] = useState<Activation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show approved activations on calendar
  const approvedActivations = activations.filter(a => a.status === "approved");

  const bookedDates = useMemo(() => {
    const dates: Map<string, Activation[]> = new Map();
    
    approvedActivations.forEach(activation => {
      if (activation.start_date && activation.end_date) {
        const start = parseISO(activation.start_date);
        const end = parseISO(activation.end_date);
        let current = new Date(start);
        
        while (current <= end) {
          const key = format(current, "yyyy-MM-dd");
          const existing = dates.get(key) || [];
          existing.push(activation);
          dates.set(key, existing);
          current.setDate(current.getDate() + 1);
        }
      }
    });
    
    return dates;
  }, [approvedActivations]);

  const modifiers = useMemo(() => {
    const booked: Date[] = [];
    bookedDates.forEach((_, key) => {
      booked.push(parseISO(key));
    });
    return { booked };
  }, [bookedDates]);

  const modifiersClassNames = {
    booked: "bg-primary/20 text-primary font-semibold rounded-md cursor-pointer hover:bg-primary/30",
  };

  const handleDayClick = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const activationsForDay = bookedDates.get(key) || [];
    
    if (activationsForDay.length > 0) {
      setSelectedDate(day);
      setSelectedActivations(activationsForDay);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Booking Calendar</CardTitle>
            <CardDescription>
              View approved ad bookings. Click on highlighted dates to view campaign details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(day) => day && handleDayClick(day)}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="pointer-events-auto w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                table: "w-full border-collapse",
                head_row: "flex justify-between",
                head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2 justify-between",
                cell: "h-10 w-10 text-center text-sm p-0 relative flex-1 flex items-center justify-center",
                day: cn(
                  "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md transition-colors"
                ),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
            <CardDescription>Color codes for ad types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">By Ad Type</p>
              {Object.entries(typeColors).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded", colors.bg, colors.border, "border")} />
                  <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded bg-primary/20 border border-primary/30" />
                <span className="text-sm">Approved Booking</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Click on highlighted dates to view campaign details
              </p>
            </div>

            {approvedActivations.length === 0 && (
              <div className="pt-4 border-t text-center text-muted-foreground text-sm">
                No approved bookings yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Approved Bookings</CardTitle>
            <CardDescription>
              All approved ad campaign bookings for your venues
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvedActivations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No approved bookings yet. Bookings will appear here once you approve advertiser requests.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedActivations.map((activation) => {
                  const typeColor = typeColors[activation.activation_type || "other"] || typeColors.other;
                  
                  return (
                    <div
                      key={activation.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
                        typeColor.bg,
                        typeColor.border
                      )}
                      onClick={() => {
                        setSelectedActivations([activation]);
                        setSelectedDate(activation.start_date ? parseISO(activation.start_date) : undefined);
                        setDialogOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm">
                          {activation.ad_spaces?.title || "Ad Space"}
                        </p>
                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-600 border-green-500/30">
                          Approved
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activation.start_date && format(parseISO(activation.start_date), "MMM d")} -{" "}
                        {activation.end_date && format(parseISO(activation.end_date), "MMM d, yyyy")}
                      </p>
                      {activation.ad_spaces?.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activation.ad_spaces.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDate && format(selectedDate, "MMMM d, yyyy")} - Campaign Details
            </DialogTitle>
            <DialogDescription>
              {selectedActivations.length === 1 
                ? "Campaign details for this booking" 
                : `${selectedActivations.length} campaigns booked on this date`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedActivations.map((activation, index) => (
              <div key={activation.id} className={cn(
                "space-y-4",
                index > 0 && "pt-6 border-t"
              )}>
                {/* Ad Design Image */}
                {activation.ad_design_url && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Image className="h-4 w-4" />
                      Ad Design
                    </Label>
                    <div className="border rounded-lg overflow-hidden bg-muted">
                      <img
                        src={activation.ad_design_url}
                        alt="Ad Design"
                        className="max-h-48 w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Campaign Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Venue
                    </Label>
                    <p className="font-medium">{activation.ad_spaces?.title || "N/A"}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Campaign Objective
                    </Label>
                    <p className="font-medium">{activation.campaign_objective || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Brand Category</Label>
                    <p className="font-medium">{activation.brand_category || "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Target Audience
                    </Label>
                    <p className="font-medium">Not specified</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Ad Unit Type</Label>
                    <p className="font-medium capitalize">
                      {activation.activation_type?.replace("_", " ") || "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Booking Period</Label>
                    <p className="font-medium">
                      {activation.start_date && activation.end_date
                        ? `${format(parseISO(activation.start_date), "MMM d")} - ${format(parseISO(activation.end_date), "MMM d, yyyy")}`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Creative Notes
                    </Label>
                    <p className="font-medium text-muted-foreground italic">
                      No creative notes provided
                    </p>
                  </div>

                  {activation.estimated_publisher_payout && (
                    <div className="col-span-2 pt-2 border-t">
                      <Label className="text-muted-foreground">Booking Fee / Your Payout</Label>
                      <p className="font-bold text-primary text-lg">
                        ₱{activation.estimated_publisher_payout.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
