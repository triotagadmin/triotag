import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Activation {
  id: string;
  ad_space_id: string;
  status: string;
  activation_type: string | null;
  start_date: string | null;
  end_date: string | null;
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

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending_approval: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  approved: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  printing: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  payment_pending: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  completed: { bg: "bg-primary/20", text: "text-primary", border: "border-primary/30" },
};

export function PublisherCalendar({ activations }: PublisherCalendarProps) {
  // Show approved, printing, payment_pending, and completed activations on calendar to prevent double bookings
  const approvedActivations = activations.filter(a => 
    a.status === "approved" || 
    a.status === "printing" || 
    a.status === "payment_pending" || 
    a.status === "completed"
  );

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
    booked: "bg-primary/20 text-primary font-semibold rounded-md",
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Booking Calendar</CardTitle>
          <CardDescription>
            View all approved bookings for your ad spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
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

          <div className="space-y-2 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase">By Status</p>
            {Object.entries(statusColors).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded", colors.bg, colors.border, "border")} />
                <span className="text-sm capitalize">{status.replace("_", " ")}</span>
              </div>
            ))}
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
            All approved bookings for your venues (shown on calendar to prevent double bookings)
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
                const statusColor = statusColors[activation.status] || statusColors.approved;
                
                return (
                  <div
                    key={activation.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      typeColor.bg,
                      typeColor.border
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">
                        {activation.ad_spaces?.title || "Ad Space"}
                      </p>
                      <Badge variant="outline" className={cn("text-xs", statusColor.text)}>
                        {activation.status.replace("_", " ")}
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
  );
}
