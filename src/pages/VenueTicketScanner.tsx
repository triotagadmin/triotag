import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  ArrowLeft,
  Camera,
  CheckCircle,
  XCircle,
  QrCode,
  Search,
  Loader2
} from "lucide-react";

interface VenueEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  venues: {
    id: string;
    name: string;
    owner_id: string;
  };
}

interface ValidationResult {
  success: boolean;
  message: string;
  data?: {
    customer_name: string | null;
    customer_email: string | null;
    scanned_at: string;
  };
}

const VenueTicketScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<VenueEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkAuthAndFetch();
    return () => {
      stopScanning();
    };
  }, [eventId]);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch event with venue info
      const { data: eventData, error: eventError } = await supabase
        .from("venue_events")
        .select(`
          *,
          venues (
            id,
            name,
            owner_id
          )
        `)
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;

      // Check if user is the venue owner
      if (eventData.venues.owner_id !== session.user.id) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to scan tickets for this event.",
          variant: "destructive"
        });
        navigate("/venue-ticketing");
        return;
      }

      setEvent(eventData);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load event.",
        variant: "destructive"
      });
      navigate("/venue-ticketing");
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  };

  const validateTicket = async (code: string) => {
    setResult(null);
    setValidating(true);

    try {
      // Find the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("venue_tickets")
        .select(`
          *,
          venue_events (
            id
          )
        `)
        .eq("unique_code", code)
        .single();

      if (ticketError || !ticket) {
        setResult({
          success: false,
          message: "Invalid ticket code. Ticket not found."
        });
        return;
      }

      // Verify ticket belongs to this event
      if (ticket.venue_events?.id !== eventId) {
        setResult({
          success: false,
          message: "This ticket is for a different event."
        });
        return;
      }

      // Check if already used
      if (ticket.status === 'used') {
        setResult({
          success: false,
          message: `This ticket has already been scanned on ${new Date(ticket.scanned_at).toLocaleString()}`,
          data: {
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            scanned_at: ticket.scanned_at
          }
        });
        return;
      }

      // Mark as used
      const { data: { session } } = await supabase.auth.getSession();
      const now = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from("venue_tickets")
        .update({
          status: 'used',
          scanned_at: now,
          scanned_by: session?.user.id
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      setResult({
        success: true,
        message: "Valid ticket! Entry approved.",
        data: {
          customer_name: ticket.customer_name,
          customer_email: ticket.customer_email,
          scanned_at: now
        }
      });

      toast({
        title: "Success!",
        description: "Ticket validated successfully."
      });

    } catch (error: any) {
      console.error("Error validating ticket:", error);
      setResult({
        success: false,
        message: "Error validating ticket. Please try again."
      });
    } finally {
      setValidating(false);
    }
  };

  const handleManualValidation = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Enter Code",
        description: "Please enter a ticket code.",
        variant: "destructive"
      });
      return;
    }
    validateTicket(manualCode.trim());
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/venue-ticketing")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Ticket Scanner</h1>
          <p className="text-muted-foreground">{event?.title}</p>
          <p className="text-sm text-muted-foreground">
            {event?.venues.name} • {event?.event_date && new Date(event.event_date).toLocaleDateString()}
          </p>
        </div>

        {/* Camera Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Camera Scanner
            </CardTitle>
            <CardDescription>
              Point your camera at a ticket QR code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <QrCode className="h-16 w-16 text-white/50" />
                </div>
              )}
            </div>
            {scanning ? (
              <Button onClick={stopScanning} variant="destructive" className="w-full">
                Stop Scanning
              </Button>
            ) : (
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground mt-2">
              After scanning, use manual entry to validate the code
            </p>
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Manual Entry
            </CardTitle>
            <CardDescription>
              Enter the ticket UUID code manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter ticket UUID (e.g., a1b2c3d4-...)"
                onKeyDown={(e) => e.key === "Enter" && handleManualValidation()}
                className="font-mono"
              />
              <Button onClick={handleManualValidation} disabled={validating}>
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card className={result.success 
            ? "border-green-500 bg-green-50 dark:bg-green-950/20" 
            : "border-red-500 bg-red-50 dark:bg-red-950/20"
          }>
            <CardContent className="pt-6">
              <div className="text-center">
                {result.success ? (
                  <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-500" />
                ) : (
                  <XCircle className="h-20 w-20 mx-auto mb-4 text-red-500" />
                )}
                <h3 className={`text-2xl font-bold mb-2 ${
                  result.success 
                    ? "text-green-700 dark:text-green-300" 
                    : "text-red-700 dark:text-red-300"
                }`}>
                  {result.success ? "SUCCESS" : "DENIED"}
                </h3>
                <p className={result.success 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
                }>
                  {result.message}
                </p>
                
                {result.data && (
                  <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg text-left">
                    {result.data.customer_name && (
                      <p><strong>Name:</strong> {result.data.customer_name}</p>
                    )}
                    {result.data.customer_email && (
                      <p><strong>Email:</strong> {result.data.customer_email}</p>
                    )}
                    <p><strong>Scanned:</strong> {new Date(result.data.scanned_at).toLocaleString()}</p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={resetScanner}
                >
                  Scan Next Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VenueTicketScanner;
