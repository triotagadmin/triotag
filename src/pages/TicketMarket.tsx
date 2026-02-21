import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, MapPin, Ticket, Settings, Upload, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";

const TicketMarket = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [advertiserProfile, setAdvertiserProfile] = useState<any>(null);
  const [publisherProfile, setPublisherProfile] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [venueName, setVenueName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketCurrency, setTicketCurrency] = useState("PHP");
  const [organizerName, setOrganizerName] = useState("");

  // Settings state
  const [totalTicketLimit, setTotalTicketLimit] = useState("100");
  const [purchaseLimitPerUser, setPurchaseLimitPerUser] = useState("5");

  const currencies = [
    { value: "PHP", label: "Philippine Peso (₱)", symbol: "₱" },
    { value: "USD", label: "US Dollar ($)", symbol: "$" },
    { value: "EUR", label: "Euro (€)", symbol: "€" },
    { value: "GBP", label: "British Pound (£)", symbol: "£" },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Check for advertiser profile
      const { data: advProfile } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setAdvertiserProfile(advProfile);
      if (advProfile?.company_name) {
        setOrganizerName(advProfile.company_name);
      }

      // Check for publisher profile (venue accounts)
      const { data: pubProfile } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setPublisherProfile(pubProfile);
      if (pubProfile?.business_name && !advProfile) {
        setOrganizerName(pubProfile.business_name);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-assets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('event-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSaveEvent = async () => {
    if (!user) {
      toast.error("Please sign in to create events");
      navigate("/auth");
      return;
    }

    // Allow both advertiser and publisher (venue) accounts to submit
    if (!advertiserProfile && !publisherProfile) {
      toast.error("Please complete your profile first");
      navigate("/auth");
      return;
    }

    if (!eventName || !eventDate || !eventLocation || !ticketPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      let bannerImageUrl = null;
      if (imageFile) {
        bannerImageUrl = await uploadImage(imageFile);
      }

      // Determine owner_type based on profile
      const ownerType = advertiserProfile ? "advertiser" : "publisher";

      // All submissions go to tickets table for unified admin approval
      const { error: ticketError } = await supabase
        .from("tickets")
        .insert({
          owner_id: user.id,
          owner_type: ownerType,
          title: eventName,
          description: eventDescription,
          event_date: eventDate,
          event_time: eventTime,
          location: eventLocation,
          venue_name: venueName,
          image_url: bannerImageUrl,
          price: parseFloat(ticketPrice),
          currency: ticketCurrency,
          quantity_available: parseInt(totalTicketLimit),
          category: "event",
          status: "pending"
        });

      if (ticketError) throw ticketError;

      toast.success("Ticket submitted for admin approval!");
      
      // Reset form
      setEventName("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setVenueName("");
      setTicketPrice("");
      setTotalTicketLimit("100");
      setPurchaseLimitPerUser("5");
      setImagePreview(null);
      setImageFile(null);

    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPurchase = async () => {
    if (!ticketPrice || parseFloat(ticketPrice) <= 0) {
      toast.error("Please set a valid ticket price first");
      return;
    }

    toast.info("PayMongo checkout coming soon!");
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Date TBA";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Date TBA";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="text-primary neon-text-glow">Ticket</span> Market
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Create and sell event tickets with our powerful ticketing system
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Creator Form */}
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Ticket className="w-5 h-5 text-primary" />
                  Event Creator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      General Info
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-foreground">Event Banner</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                           onClick={() => document.getElementById('image-upload')?.click()}>
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="w-8 h-8" />
                            <span>Click to upload event banner</span>
                          </div>
                        )}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Event Name */}
                    <div className="space-y-2">
                      <Label htmlFor="eventName" className="text-foreground">Event Name *</Label>
                      <Input
                        id="eventName"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Enter event name"
                        className="bg-muted/50 border-border focus:border-primary"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Description</Label>
                      <Textarea
                        id="description"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Describe your event..."
                        className="bg-muted/50 border-border focus:border-primary min-h-[100px]"
                      />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-foreground">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time" className="text-foreground">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Location & Venue */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-foreground">Location *</Label>
                        <Input
                          id="location"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="City, Country"
                          className="bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue" className="text-foreground">Venue Name</Label>
                        <Input
                          id="venue"
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="Venue name"
                          className="bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Price & Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-foreground">Ticket Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={ticketPrice}
                          onChange={(e) => setTicketPrice(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="bg-muted/50 border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-foreground">Currency</Label>
                        <Select value={ticketCurrency} onValueChange={setTicketCurrency}>
                          <SelectTrigger className="bg-muted/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.symbol} {c.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Organizer */}
                    <div className="space-y-2">
                      <Label htmlFor="organizer" className="text-foreground">Organizer Name</Label>
                      <Input
                        id="organizer"
                        value={organizerName}
                        onChange={(e) => setOrganizerName(e.target.value)}
                        placeholder="Your organization name"
                        className="bg-muted/50 border-border focus:border-primary"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="totalLimit" className="text-foreground">Total Ticket Limit</Label>
                      <Input
                        id="totalLimit"
                        type="number"
                        value={totalTicketLimit}
                        onChange={(e) => setTotalTicketLimit(e.target.value)}
                        placeholder="100"
                        min="1"
                        className="bg-muted/50 border-border focus:border-primary"
                      />
                      <p className="text-sm text-muted-foreground">Maximum number of tickets available for sale</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchaseLimit" className="text-foreground">Purchase Limit per User</Label>
                      <Input
                        id="purchaseLimit"
                        type="number"
                        value={purchaseLimitPerUser}
                        onChange={(e) => setPurchaseLimitPerUser(e.target.value)}
                        placeholder="5"
                        min="1"
                        className="bg-muted/50 border-border focus:border-primary"
                      />
                      <p className="text-sm text-muted-foreground">Maximum tickets a single user can purchase</p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleSaveEvent}
                  disabled={loading}
                  className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 neon-glow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Ticket...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Side - Sticky Ticket Preview */}
            <div className="lg:sticky lg:top-24">
              <div className="relative">
                {/* Glassmorphism Ticket */}
                <div className="relative overflow-hidden rounded-2xl">
                  {/* Perforated edge effect - left side */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around z-10">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-background" />
                    ))}
                  </div>

                  {/* Main ticket body */}
                  <div 
                    className="ml-2 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(0, 0, 0, 0.8) 50%, rgba(34, 197, 94, 0.05) 100%)',
                      boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Header with image */}
                    <div className="relative h-48 overflow-hidden">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Event" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted/50 flex items-center justify-center">
                          <Ticket className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-4 left-6 right-6">
                        <h3 className="text-2xl font-bold text-foreground truncate">
                          {eventName || "Event Name"}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          by {organizerName || "Organizer"}
                        </p>
                      </div>
                    </div>

                    {/* Ticket details */}
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatDisplayDate(eventDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="text-sm font-medium text-foreground">
                              {eventTime || "TBA"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {venueName ? `${venueName}, ` : ""}{eventLocation || "TBA"}
                          </p>
                        </div>
                      </div>

                      {/* Divider with ticket holes */}
                      <div className="relative py-4">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background" />
                        <div className="border-t-2 border-dashed border-primary/30" />
                      </div>

                      {/* Price section */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Ticket Price</p>
                          <p className="text-3xl font-bold text-primary neon-text-glow">
                            ₱{ticketPrice || "0.00"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="text-lg font-semibold text-foreground">{totalTicketLimit} tickets</p>
                        </div>
                      </div>

                      {/* Purchase button */}
                      <Button
                        onClick={handlePreviewPurchase}
                        className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold py-6 neon-glow"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Preview Purchase
                      </Button>
                    </div>
                  </div>

                  {/* Perforated edge effect - right side */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col justify-around z-10">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full bg-background" />
                    ))}
                  </div>
                </div>

                {/* Glow effect behind ticket */}
                <div 
                  className="absolute inset-0 -z-10 blur-3xl opacity-30"
                  style={{
                    background: 'radial-gradient(ellipse at center, hsl(110 100% 55% / 0.3) 0%, transparent 70%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TicketMarket;
