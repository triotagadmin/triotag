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
  Search
} from "lucide-react";

const EventScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event.",
        variant: "destructive"
      });
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
        scanFrame();
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

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // For now, we'll use manual code entry
      // In production, you'd integrate a QR code scanning library
    }

    requestAnimationFrame(scanFrame);
  };

  const validateTicket = async (qrCode: string) => {
    setResult(null);
    
    try {
      // Find the purchase with this QR code
      const { data: purchase, error } = await supabase
        .from("event_purchases")
        .select(`
          *,
          event_tickets (
            ticket_name,
            event_id
          )
        `)
        .eq("qr_code", qrCode)
        .single();

      if (error || !purchase) {
        setResult({
          success: false,
          message: "Invalid QR code. Ticket not found."
        });
        return;
      }

      // Verify ticket belongs to this event
      if (purchase.event_tickets?.event_id !== eventId) {
        setResult({
          success: false,
          message: "This ticket is for a different event."
        });
        return;
      }

      // Check if already used
      if (purchase.ticket_status === "used") {
        setResult({
          success: false,
          message: `Ticket already used on ${new Date(purchase.checked_in_at).toLocaleString()}`,
          data: purchase
        });
        return;
      }

      // Check if valid
      if (purchase.ticket_status !== "valid") {
        setResult({
          success: false,
          message: "This ticket is not valid for entry.",
          data: purchase
        });
        return;
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from("event_purchases")
        .update({
          ticket_status: "used",
          checked_in_at: new Date().toISOString()
        })
        .eq("id", purchase.id);

      if (updateError) throw updateError;

      setResult({
        success: true,
        message: "Valid ticket! Entry approved.",
        data: {
          ...purchase,
          ticket_status: "used",
          checked_in_at: new Date().toISOString()
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
          onClick={() => navigate(`/advertiser/events/${eventId}/sales`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">QR Ticket Scanner</h1>
          <p className="text-muted-foreground">{event?.title}</p>
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
              Enter the ticket code manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter ticket code (e.g., TICKET-abc123-...)"
                onKeyDown={(e) => e.key === "Enter" && handleManualValidation()}
              />
              <Button onClick={handleManualValidation}>
                Validate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card className={result.success ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-500 bg-red-50 dark:bg-red-950/20"}>
            <CardContent className="pt-6">
              <div className="text-center">
                {result.success ? (
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                )}
                <h3 className={`text-xl font-bold mb-2 ${result.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {result.success ? "VALID" : "INVALID"}
                </h3>
                <p className={result.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  {result.message}
                </p>
                {result.data && (
                  <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg text-left">
                    <p><strong>Name:</strong> {result.data.buyer_name}</p>
                    <p><strong>Ticket:</strong> {result.data.event_tickets?.ticket_name}</p>
                    <p><strong>Quantity:</strong> {result.data.quantity}</p>
                    <p><strong>Order:</strong> {result.data.order_code?.substring(0, 8)}</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setResult(null);
                    setManualCode("");
                  }}
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

export default EventScanner;