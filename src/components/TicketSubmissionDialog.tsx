import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TicketSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerType: "advertiser" | "publisher";
  onSuccess?: () => void;
  editTicket?: any;
}

const categories = [
  "Music",
  "Conference",
  "Entertainment",
  "Sports",
  "Theater",
  "Festival",
  "Workshop",
  "Networking",
];

export const TicketSubmissionDialog = ({
  open,
  onOpenChange,
  ownerType,
  onSuccess,
  editTicket,
}: TicketSubmissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: editTicket?.title || "",
    description: editTicket?.description || "",
    event_date: editTicket?.event_date || "",
    event_time: editTicket?.event_time || "",
    location: editTicket?.location || "",
    venue_name: editTicket?.venue_name || "",
    category: editTicket?.category || "",
    price: editTicket?.price?.toString() || "",
    quantity_available: editTicket?.quantity_available?.toString() || "",
  });

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.event_date ||
      !formData.location ||
      !formData.category ||
      !formData.price ||
      !formData.quantity_available
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to submit tickets");
        return;
      }

      const ticketData = {
        owner_id: user.id,
        owner_type: ownerType,
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        location: formData.location,
        venue_name: formData.venue_name || null,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity_available: parseInt(formData.quantity_available),
      };

      if (editTicket) {
        const { error } = await supabase
          .from("tickets")
          .update(ticketData)
          .eq("id", editTicket.id);

        if (error) throw error;
        toast.success("Ticket updated successfully!");
      } else {
        const { error } = await supabase.from("tickets").insert(ticketData);

        if (error) throw error;
        toast.success("Ticket submitted for approval!");
      }

      onOpenChange(false);
      onSuccess?.();
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        venue_name: "",
        category: "",
        price: "",
        quantity_available: "",
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTicket ? "Edit Ticket" : "Submit Event Ticket"}
          </DialogTitle>
          <DialogDescription>
            {editTicket
              ? "Update your event ticket details"
              : "Add a new event ticket to the marketplace"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Summer Music Festival 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your event..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Event Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="City, State"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) =>
                setFormData({ ...formData, venue_name: e.target.value })
              }
              placeholder="Madison Square Garden"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price per Ticket ($) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="50.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Available *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity_available}
                onChange={(e) =>
                  setFormData({ ...formData, quantity_available: e.target.value })
                }
                placeholder="100"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Submitting..."
              : editTicket
              ? "Update Ticket"
              : "Submit Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
