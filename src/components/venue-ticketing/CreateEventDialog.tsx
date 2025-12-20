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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2 } from "lucide-react";

interface Venue {
  id: string;
  name: string;
  location: string;
}

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: Venue | null;
  onSuccess: () => void;
}

export const CreateEventDialog = ({ open, onOpenChange, venue, onSuccess }: CreateEventDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    ticket_price: "",
    total_tickets: "100",
    status: "draft"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venue) {
      toast({
        title: "Error",
        description: "No venue selected.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim() || !formData.event_date) {
      toast({
        title: "Validation Error",
        description: "Title and event date are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("venue_events")
        .insert({
          venue_id: venue.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          event_date: formData.event_date,
          event_time: formData.event_time || null,
          ticket_price: parseFloat(formData.ticket_price) || 0,
          total_tickets: parseInt(formData.total_tickets) || 100,
          status: formData.status
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event created successfully."
      });

      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        ticket_price: "",
        total_tickets: "100",
        status: "draft"
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Event
          </DialogTitle>
          <DialogDescription>
            {venue ? `Create an event at ${venue.name}` : "Select a venue first"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Music Festival"
                maxLength={150}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event..."
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event_time">Event Time</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ticket_price">Ticket Price ($)</Label>
                <Input
                  id="ticket_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.ticket_price}
                  onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_tickets">Total Tickets</Label>
                <Input
                  id="total_tickets"
                  type="number"
                  min="1"
                  value={formData.total_tickets}
                  onChange={(e) => setFormData({ ...formData, total_tickets: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
