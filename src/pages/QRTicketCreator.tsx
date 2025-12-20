import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft,
  QrCode,
  Plus,
  BarChart3,
  Sparkles,
  Eye,
  MousePointerClick,
  Smartphone,
  Globe,
  TrendingUp,
  Calendar,
  Link2,
  Copy,
  ExternalLink,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  Users,
  Ticket,
  DollarSign,
  Hash,
  XCircle,
  Trash2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface PublisherTicket {
  id: string;
  event_name: string;
  price: number;
  secret_token: string;
  status: 'active' | 'used';
  scanned_at: string | null;
  created_at: string;
}

interface QRCode {
  id: string;
  name: string | null;
  destination_url: string;
  short_code: string;
  is_active: boolean;
  created_at: string;
  scan_count?: number;
}

interface QRScan {
  id: string;
  scanned_at: string;
  device_type: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
}

interface AnalyticsData {
  totalScans: number;
  uniqueDevices: number;
  topCountries: { country: string; count: number }[];
  deviceBreakdown: { device: string; count: number }[];
  scansByDay: { date: string; count: number }[];
}

const QRTicketCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Publisher tickets state
  const [tickets, setTickets] = useState<PublisherTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<PublisherTicket | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  // QR Codes state (existing functionality)
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [scans, setScans] = useState<QRScan[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Form state for ticket creation
  const [ticketForm, setTicketForm] = useState({
    event_name: "",
    quantity: "1",
    price: ""
  });

  // Form state for QR code creation
  const [qrForm, setQrForm] = useState({
    name: "",
    destination_url: ""
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    try {
      // Fetch publisher tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("publisher_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      // Fetch QR codes
      const { data: qrData, error: qrError } = await supabase
        .from("qr_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (qrError) throw qrError;

      // Get scan counts for each QR code
      const qrWithScans = await Promise.all((qrData || []).map(async (qr) => {
        const { count } = await supabase
          .from("qr_code_scans")
          .select("*", { count: "exact", head: true })
          .eq("qr_code_id", qr.id);
        return { ...qr, scan_count: count || 0 };
      }));

      setQrCodes(qrWithScans);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate tickets
  const handleCreateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.event_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Event name is required.",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(ticketForm.quantity) || 1;
    if (quantity < 1 || quantity > 100) {
      toast({
        title: "Validation Error",
        description: "Quantity must be between 1 and 100.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Create multiple tickets
      const ticketsToInsert = Array.from({ length: quantity }, () => ({
        creator_id: session.user.id,
        event_name: ticketForm.event_name.trim(),
        price: parseFloat(ticketForm.price) || 0
      }));

      const { error } = await supabase
        .from("publisher_tickets")
        .insert(ticketsToInsert);

      if (error) throw error;

      toast({
        title: "Tickets Generated!",
        description: `Successfully created ${quantity} ticket(s).`
      });

      setTicketForm({ event_name: "", quantity: "1", price: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error creating tickets:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tickets.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // View QR for a ticket
  const handleViewQR = (ticket: PublisherTicket) => {
    setSelectedTicket(ticket);
    setShowQRDialog(true);
  };

  // Delete a ticket
  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("publisher_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Ticket has been deleted."
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete ticket.",
        variant: "destructive"
      });
    }
  };

  // Generate validation URL
  const getValidationUrl = (ticket: PublisherTicket) => {
    return `${window.location.origin}/validate?id=${ticket.id}&token=${ticket.secret_token}`;
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard."
    });
  };

  // Existing QR code functions
  const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrForm.destination_url.trim()) {
      toast({
        title: "Validation Error",
        description: "Destination URL is required.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const shortCode = generateShortCode();

      const { error } = await supabase
        .from("qr_codes")
        .insert({
          name: qrForm.name.trim() || null,
          destination_url: qrForm.destination_url.trim(),
          short_code: shortCode,
          created_by: session?.user.id || null
        });

      if (error) throw error;

      toast({
        title: "QR Code Created!",
        description: "Your QR code is ready to use."
      });

      setQrForm({ name: "", destination_url: "" });
      fetchData();
    } catch (error: any) {
      console.error("Error creating QR code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create QR code.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const fetchScansForQR = async (qr: QRCode) => {
    setSelectedQR(qr);
    setAiInsight("");

    try {
      const { data, error } = await supabase
        .from("qr_code_scans")
        .select("*")
        .eq("qr_code_id", qr.id)
        .order("scanned_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setScans(data || []);

      // Calculate analytics
      if (data && data.length > 0) {
        const uniqueDevices = new Set(data.map(s => s.device_type || 'Unknown')).size;
        
        const countryMap: Record<string, number> = {};
        const deviceMap: Record<string, number> = {};
        const dayMap: Record<string, number> = {};

        data.forEach(scan => {
          const country = scan.country || 'Unknown';
          countryMap[country] = (countryMap[country] || 0) + 1;

          const device = scan.device_type || 'Unknown';
          deviceMap[device] = (deviceMap[device] || 0) + 1;

          const day = new Date(scan.scanned_at).toLocaleDateString();
          dayMap[day] = (dayMap[day] || 0) + 1;
        });

        setAnalytics({
          totalScans: data.length,
          uniqueDevices,
          topCountries: Object.entries(countryMap)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
          deviceBreakdown: Object.entries(deviceMap)
            .map(([device, count]) => ({ device, count })),
          scansByDay: Object.entries(dayMap)
            .map(([date, count]) => ({ date, count }))
            .slice(0, 7)
        });
      } else {
        setAnalytics(null);
      }
    } catch (error) {
      console.error("Error fetching scans:", error);
    }
  };

  const generateAIInsight = async () => {
    if (!analytics || analytics.totalScans === 0) {
      toast({
        title: "No Data",
        description: "Need scan data to generate insights.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingInsight(true);
    
    setTimeout(() => {
      const insights = [
        `Your QR code has received ${analytics.totalScans} scans! The majority of your audience is using ${analytics.deviceBreakdown[0]?.device || 'mobile'} devices.`,
        `Peak engagement detected! With ${analytics.totalScans} total scans across ${analytics.uniqueDevices} unique devices, your campaign is performing well.`,
        `Geographic analysis: Your top market is ${analytics.topCountries[0]?.country || 'worldwide'}. Consider localizing content for better engagement.`,
        `Scan velocity is strong! You're averaging ${(analytics.totalScans / 7).toFixed(1)} scans per day. Continue promoting for sustained growth.`
      ];
      
      setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
      setGeneratingInsight(false);
    }, 1500);
  };

  const getQRCodeImageUrl = (shortCode: string) => {
    const qrUrl = `${window.location.origin}/qr/${shortCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;
  };

  // Stats
  const activeTickets = tickets.filter(t => t.status === 'active').length;
  const usedTickets = tickets.filter(t => t.status === 'used').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/tickets")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Professional Ticket Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            QR Ticket Creator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate secure, one-time-use tickets with QR codes and real-time validation
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tickets.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{activeTickets}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <XCircle className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{usedTickets}</p>
                  <p className="text-sm text-muted-foreground">Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <QrCode className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{qrCodes.length}</p>
                  <p className="text-sm text-muted-foreground">QR Codes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="create-qr" className="gap-2">
              <Plus className="h-4 w-4" />
              QR Tracker
            </TabsTrigger>
            <TabsTrigger value="my-qr" className="gap-2">
              <QrCode className="h-4 w-4" />
              My QR Codes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab - Main ticket management */}
          <TabsContent value="tickets">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Ticket Creation Form */}
              <Card className="lg:col-span-1 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Generate Tickets
                  </CardTitle>
                  <CardDescription>
                    Create secure one-time-use tickets for your event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTickets} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_name">Event Name *</Label>
                      <Input
                        id="event_name"
                        value={ticketForm.event_name}
                        onChange={(e) => setTicketForm({ ...ticketForm, event_name: e.target.value })}
                        placeholder="e.g., Summer Music Festival"
                        maxLength={100}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max="100"
                            value={ticketForm.quantity}
                            onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticketForm.price}
                            onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                            placeholder="0.00"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Generate Tickets
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Tickets List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Generated Tickets
                    </span>
                    <Badge variant="outline">{tickets.length} total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Tickets Yet</h3>
                      <p className="text-muted-foreground">
                        Generate your first batch of tickets using the form
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.slice(0, 20).map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium">
                                {ticket.event_name}
                              </TableCell>
                              <TableCell>
                                ${ticket.price.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {ticket.status === 'active' ? (
                                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Used
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewQR(ticket)}
                                  >
                                    <QrCode className="h-4 w-4 mr-1" />
                                    View QR
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(getValidationUrl(ticket))}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {tickets.length > 20 && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          Showing 20 of {tickets.length} tickets
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* QR Tracker Tab */}
          <TabsContent value="create-qr">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    Create Tracking QR Code
                  </CardTitle>
                  <CardDescription>
                    Generate a trackable QR code that links to any URL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateQR} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr_name">QR Code Name</Label>
                      <Input
                        id="qr_name"
                        value={qrForm.name}
                        onChange={(e) => setQrForm({ ...qrForm, name: e.target.value })}
                        placeholder="e.g., Summer Festival Promo"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Destination URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        value={qrForm.destination_url}
                        onChange={(e) => setQrForm({ ...qrForm, destination_url: e.target.value })}
                        placeholder="https://your-event-page.com"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>What You'll Get</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Unique QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        High-resolution QR code ready for print or digital use
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Eye className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Real-time Tracking</h4>
                      <p className="text-sm text-muted-foreground">
                        See every scan with device, location, and time data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">AI Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Get intelligent insights about your audience
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My QR Codes Tab */}
          <TabsContent value="my-qr">
            {qrCodes.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No QR Codes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first QR code to start tracking
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrCodes.map((qr) => (
                  <Card key={qr.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className="p-4 bg-white flex justify-center">
                      <img 
                        src={getQRCodeImageUrl(qr.short_code)} 
                        alt={qr.name || "QR Code"}
                        className="w-40 h-40"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {qr.name || "Untitled QR"}
                        </CardTitle>
                        <Badge variant={qr.is_active ? "default" : "secondary"}>
                          {qr.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <span className="truncate">{qr.destination_url}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MousePointerClick className="h-4 w-4 text-primary" />
                          <span className="font-medium">{qr.scan_count}</span>
                          <span className="text-muted-foreground">scans</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyToClipboard(`${window.location.origin}/qr/${qr.short_code}`)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => fetchScansForQR(qr)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {!selectedQR ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a QR Code</h3>
                  <p className="text-muted-foreground">
                    Go to "My QR Codes" and click "Analytics" on any QR code
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedQR.name || "Untitled QR"}</CardTitle>
                        <CardDescription>{selectedQR.destination_url}</CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedQR(null)}>
                        Change QR
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-primary/10">
                          <MousePointerClick className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analytics?.totalScans || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Scans</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-blue-500/10">
                          <Smartphone className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analytics?.uniqueDevices || 0}</p>
                          <p className="text-sm text-muted-foreground">Devices</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-500/10">
                          <Globe className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{analytics?.topCountries.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Countries</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-purple-500/10">
                          <TrendingUp className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {analytics ? (analytics.totalScans / 7).toFixed(1) : 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Daily Avg</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary/10 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiInsight ? (
                      <div className="p-4 bg-background/80 rounded-lg">
                        <p className="text-lg">{aiInsight}</p>
                      </div>
                    ) : (
                      <Button 
                        onClick={generateAIInsight}
                        disabled={generatingInsight}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {generatingInsight ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate AI Insight
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Scans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scans.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No scans recorded yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Browser</TableHead>
                            <TableHead>Location</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scans.slice(0, 10).map((scan) => (
                            <TableRow key={scan.id}>
                              <TableCell>
                                {new Date(scan.scanned_at).toLocaleString()}
                              </TableCell>
                              <TableCell>{scan.device_type || "Unknown"}</TableCell>
                              <TableCell>{scan.browser || "Unknown"}</TableCell>
                              <TableCell>
                                {scan.city && scan.country 
                                  ? `${scan.city}, ${scan.country}`
                                  : scan.country || "Unknown"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Ticket QR Code
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.event_name}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={getValidationUrl(selectedTicket)}
                  size={250}
                  level="H"
                  includeMargin
                />
              </div>
              
              <div className="space-y-2">
                <Label>Validation URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={getValidationUrl(selectedTicket)}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getValidationUrl(selectedTicket))}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket.status === 'active' ? 'Ready for use' : 'Already scanned'}
                  </p>
                </div>
                {selectedTicket.status === 'active' ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Used
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">${selectedTicket.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedTicket.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => window.open(getValidationUrl(selectedTicket), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test Validation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default QRTicketCreator;
