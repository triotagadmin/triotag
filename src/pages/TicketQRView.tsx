import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { 
  Ticket,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  QrCode
} from "lucide-react";

interface TicketData {
  id: string;
  unique_code: string;
  status: 'valid' | 'used';
  customer_email: string | null;
  customer_name: string | null;
  scanned_at: string | null;
  venue_events: {
    title: string;
    event_date: string;
    event_time: string | null;
    venues: {
      name: string;
      location: string;
    };
  };
}

const TicketQRView = () => {
  const { uniqueCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (uniqueCode) {
      fetchTicket();
      generateQRCode();
    }
  }, [uniqueCode]);

  const fetchTicket = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("venue_tickets")
        .select(`
          *,
          venue_events (
            title,
            event_date,
            event_time,
            venues (
              name,
              location
            )
          )
        `)
        .eq("unique_code", uniqueCode)
        .single();

      if (fetchError) throw fetchError;
      setTicket(data);
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      setError("Ticket not found or invalid.");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    // Generate QR code using Google Charts API
    const validationUrl = `${window.location.origin}/validate/${uniqueCode}`;
    const encodedUrl = encodeURIComponent(validationUrl);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
    setQrCodeUrl(qrUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Ticket</h2>
              <p className="text-muted-foreground">{error || "This ticket does not exist."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isUsed = ticket.status === 'used';

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-md">
        <Card className={`overflow-hidden ${isUsed ? 'border-red-500/50' : 'border-green-500/50'}`}>
          {/* Header with status */}
          <div className={`p-4 ${isUsed ? 'bg-red-500' : 'bg-green-500'} text-white text-center`}>
            <div className="flex items-center justify-center gap-2">
              {isUsed ? (
                <>
                  <XCircle className="h-6 w-6" />
                  <span className="font-bold text-lg">TICKET USED</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-bold text-lg">VALID TICKET</span>
                </>
              )}
            </div>
            {isUsed && ticket.scanned_at && (
              <p className="text-sm opacity-90 mt-1">
                Scanned: {new Date(ticket.scanned_at).toLocaleString()}
              </p>
            )}
          </div>

          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{ticket.venue_events.title}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" />
              {ticket.venue_events.venues.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className={`p-4 bg-white rounded-lg shadow-lg ${isUsed ? 'opacity-50' : ''}`}>
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Ticket QR Code" 
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-muted">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {isUsed && (
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <p className="text-red-600 font-medium">This ticket has already been used</p>
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(ticket.venue_events.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {ticket.venue_events.event_time && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{ticket.venue_events.event_time}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{ticket.venue_events.venues.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Ticket className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Code</p>
                  <p className="font-mono text-sm">{ticket.unique_code}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {(ticket.customer_name || ticket.customer_email) && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Ticket Holder</p>
                {ticket.customer_name && <p className="font-medium">{ticket.customer_name}</p>}
                {ticket.customer_email && <p className="text-sm">{ticket.customer_email}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketQRView;
