import { useState, useRef } from "react";
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
import { ImagePlus, X, Loader2 } from "lucide-react";

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

const MAX_PHOTOS = 30;

export const TicketSubmissionDialog = ({
  open,
  onOpenChange,
  ownerType,
  onSuccess,
  editTicket,
}: TicketSubmissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(editTicket?.image_urls || []);
  const [existingUrls, setExistingUrls] = useState<string[]>(editTicket?.image_urls || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = selectedImages.length + existingUrls.length + files.length;
    
    if (totalImages > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
      return;
    }

    // Create preview URLs for new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const isExisting = index < existingUrls.length;
    
    if (isExisting) {
      setExistingUrls(prev => prev.filter((_, i) => i !== index));
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingUrls.length;
      setSelectedImages(prev => prev.filter((_, i) => i !== newIndex));
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [...existingUrls];
    
    for (const file of selectedImages) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('ticket-images')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${file.name}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('ticket-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

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

      setIsUploading(true);
      let imageUrls: string[] = [];
      
      if (selectedImages.length > 0 || existingUrls.length > 0) {
        imageUrls = await uploadImages(user.id);
      }
      setIsUploading(false);

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
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
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
      resetForm();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const resetForm = () => {
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
    setSelectedImages([]);
    setPreviewUrls([]);
    setExistingUrls([]);
  };

  const totalImages = selectedImages.length + existingUrls.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
          {/* Photo Upload Section */}
          <div className="space-y-2">
            <Label>Event Photos ({totalImages}/{MAX_PHOTOS})</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {previewUrls.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {totalImages < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 flex flex-col items-center gap-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload photos (up to {MAX_PHOTOS})
                  </span>
                </button>
              )}
            </div>
          </div>

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
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : isSubmitting ? (
              "Submitting..."
            ) : editTicket ? (
              "Update Ticket"
            ) : (
              "Submit Ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
