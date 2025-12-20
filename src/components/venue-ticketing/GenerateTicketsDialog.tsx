import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VenueEvent {
  id: string;
  title: string;
  total_tickets: number;
  tickets_sold: number;
}

interface GenerateTicketsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: VenueEvent | null;
  onSuccess: () => void;
}

export const GenerateTicketsDialog = ({ open, onOpenChange, event, onSuccess }: GenerateTicketsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState("10");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) {
      toast({
        title: "Error",
        description: "No event selected.",
        variant: "destructive"
      });
      return;
    }

    const ticketCount = parseInt(quantity);
    if (isNaN(ticketCount) || ticketCount < 1 || ticketCount > 100) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity (1-100).",
        variant: "destructive"
      });
      return;
    }

    const remainingTickets = event.total_tickets - event.tickets_sold;
    if (ticketCount > remainingTickets) {
      toast({
        title: "Not Enough Tickets",
        description: `Only ${remainingTickets} tickets remaining.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Generate tickets
      const tickets = Array.from({ length: ticketCount }, () => ({
        event_id: event.id,
        customer_email: customerEmail.trim() || null,
        customer_name: customerName.trim() || null,
        status: 'valid' as const
      }));

      const { error: insertError } = await supabase
        .from("venue_tickets")
        .insert(tickets);

      if (insertError) throw insertError;

      // Update tickets_sold count
      const { error: updateError } = await supabase
        .from("venue_events")
        .update({ tickets_sold: event.tickets_sold + ticketCount })
        .eq("id", event.id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: `Generated ${ticketCount} tickets successfully.`
      });

      setQuantity("10");
      setCustomerEmail("");
      setCustomerName("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error generating tickets:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate tickets.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const remainingTickets = event ? event.total_tickets - event.tickets_sold : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Generate Tickets
          </DialogTitle>
          <DialogDescription>
            {event ? `Generate tickets for ${event.title}` : "Select an event first"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {event && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {remainingTickets} tickets remaining out of {event.total_tickets} total
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="quantity">Number of Tickets *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 100 tickets per batch
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name (Optional)</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                maxLength={255}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || remainingTickets === 0}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Tickets
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
