import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  Plus, 
  Trash2, 
  Calendar,
  ArrowLeft,
  Upload
} from "lucide-react";

interface TicketType {
  id: string;
  ticket_name: string;
  ticket_price: number;
  quantity_available: number;
  sale_start_date: string;
  sale_end_date: string;
}

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [advertiserProfile, setAdvertiserProfile] = useState<any>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  // Event details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [venueName, setVenueName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  // Ticket types
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      id: crypto.randomUUID(),
      ticket_name: "General Admission",
      ticket_price: 0,
      quantity_available: 100,
      sale_start_date: "",
      sale_end_date: ""
    }
  ]);

  useEffect(() => {
    fetchAdvertiserProfile();
  }, []);

  const fetchAdvertiserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("advertiser_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!profile) {
      toast({
        title: "Profile not found",
        description: "Please complete your advertiser profile first.",
        variant: "destructive"
      });
      navigate("/advertiser-dashboard");
      return;
    }

    setAdvertiserProfile(profile);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        id: crypto.randomUUID(),
        ticket_name: "",
        ticket_price: 0,
        quantity_available: 50,
        sale_start_date: "",
        sale_end_date: ""
      }
    ]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter(t => t.id !== id));
    }
  };

  const updateTicketType = (id: string, field: keyof TicketType, value: any) => {
    setTicketTypes(ticketTypes.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!title || !location || !eventDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (ticketTypes.some(t => !t.ticket_name)) {
      toast({
        title: "Invalid ticket",
        description: "All ticket types must have a name.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let bannerUrl = "";

      // Upload banner if provided
      if (bannerFile) {
        const fileExt = bannerFile.name.split(".").pop();
        const fileName = `${advertiserProfile.user_id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("event-assets")
          .upload(fileName, bannerFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("event-assets")
          .getPublicUrl(fileName);

        bannerUrl = publicUrl;
      }

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          advertiser_id: advertiserProfile.id,
          title,
          description,
          location,
          venue_name: venueName,
          event_date: eventDate,
          event_time: eventTime,
          banner_image_url: bannerUrl,
          organizer_name: advertiserProfile.company_name,
          status
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create ticket types
      const ticketsToInsert = ticketTypes.map(t => ({
        event_id: event.id,
        ticket_name: t.ticket_name,
        ticket_price: t.ticket_price,
        quantity_available: t.quantity_available,
        sale_start_date: t.sale_start_date || null,
        sale_end_date: t.sale_end_date || null
      }));

      const { error: ticketsError } = await supabase
        .from("event_tickets")
        .insert(ticketsToInsert);

      if (ticketsError) throw ticketsError;

      toast({
        title: "Event created!",
        description: status === "published" 
          ? "Your event is now live and accepting ticket sales."
          : "Your event has been saved as a draft."
      });

      navigate("/advertiser/events");
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
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/advertiser/events")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

        {/* Event Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Basic information about your event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Music Festival 2025"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Manila, Philippines"
                />
              </div>
              <div>
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., SM Mall of Asia Arena"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eventTime">Event Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Event Banner</Label>
              <div className="mt-2">
                {bannerPreview ? (
                  <div className="relative">
                    <img 
                      src={bannerPreview} 
                      alt="Banner preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview("");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ticket Configuration</CardTitle>
                <CardDescription>Set up your ticket types and pricing</CardDescription>
              </div>
              <Button variant="outline" onClick={addTicketType}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {ticketTypes.map((ticket, index) => (
              <div key={ticket.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ticket Type {index + 1}</h4>
                  {ticketTypes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTicketType(ticket.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ticket Name *</Label>
                    <Input
                      value={ticket.ticket_name}
                      onChange={(e) => updateTicketType(ticket.id, "ticket_name", e.target.value)}
                      placeholder="e.g., General Admission, VIP"
                    />
                  </div>
                  <div>
                    <Label>Price (PHP)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={ticket.ticket_price}
                      onChange={(e) => updateTicketType(ticket.id, "ticket_price", parseFloat(e.target.value) || 0)}
                      placeholder="0 for free"
                    />
                  </div>
                </div>

                <div>
                  <Label>Quantity Available</Label>
                  <Input
                    type="number"
                    min="1"
                    value={ticket.quantity_available}
                    onChange={(e) => updateTicketType(ticket.id, "quantity_available", parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Sale Start Date</Label>
                    <Input
                      type="date"
                      value={ticket.sale_start_date}
                      onChange={(e) => updateTicketType(ticket.id, "sale_start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Sale End Date</Label>
                    <Input
                      type="date"
                      value={ticket.sale_end_date}
                      onChange={(e) => updateTicketType(ticket.id, "sale_end_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit("published")}
            disabled={loading}
          >
            {loading ? "Creating..." : "Publish Event"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;