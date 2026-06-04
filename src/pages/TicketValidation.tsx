import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { 
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";

interface ValidationResult {
  success: boolean;
  message: string;
  ticketData?: {
    customer_name: string | null;
    customer_email: string | null;
    event_title: string;
    scanned_at: string | null;
  };
}

const TicketValidation = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (uniqueCode) {
      checkOwnerAndValidate();
    }
  }, [uniqueCode]);

  const checkOwnerAndValidate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // First, get the ticket via secure RPC (token-scoped by unique_code)
      const { data: rpcRows, error: ticketError } = await supabase
        .rpc("get_venue_ticket_by_code", { _unique_code: uniqueCode });

      const ticket: any = Array.isArray(rpcRows) ? rpcRows[0] : null;

      if (ticketError || !ticket) {
        setResult({
          success: false,
          message: "Invalid ticket code. Ticket not found."
        });
        return;
      }

      // Check if current user is the venue owner
      const venueOwnerId = ticket.venue_owner_id;
      const isVenueOwner = session?.user?.id === venueOwnerId;
      setIsOwner(isVenueOwner);

      // If not the owner, just show ticket info
      if (!isVenueOwner) {
        setResult({
          success: ticket.status === 'valid',
          message: ticket.status === 'valid' 
            ? "This is a valid ticket. Only venue staff can scan it."
            : `This ticket was already used on ${new Date(ticket.scanned_at).toLocaleString()}`,
          ticketData: {
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            event_title: ticket.venue_events?.title || "Unknown Event",
            scanned_at: ticket.scanned_at
          }
        });
        return;
      }

      // Owner is scanning - process validation
      if (ticket.status === 'used') {
        setResult({
          success: false,
          message: `This ticket has already been scanned on ${new Date(ticket.scanned_at).toLocaleString()}`,
          ticketData: {
            customer_name: ticket.customer_name,
            customer_email: ticket.customer_email,
            event_title: ticket.venue_events?.title || "Unknown Event",
            scanned_at: ticket.scanned_at
          }
        });
        return;
      }

      // Mark ticket as used
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("venue_tickets")
        .update({
          status: 'used',
          scanned_at: now,
          scanned_by: session.user.id
        })
        .eq("id", ticket.id);

      if (updateError) throw updateError;

      setResult({
        success: true,
        message: "Ticket validated successfully! Entry approved.",
        ticketData: {
          customer_name: ticket.customer_name,
          customer_email: ticket.customer_email,
          event_title: ticket.venue_events?.title || "Unknown Event",
          scanned_at: now
        }
      });

    } catch (error: any) {
      console.error("Error validating ticket:", error);
      setResult({
        success: false,
        message: "Error validating ticket. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-bold mb-2">Validating Ticket...</h2>
              <p className="text-muted-foreground">Please wait</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-md">
        <Card className={`overflow-hidden ${result?.success ? 'border-green-500' : 'border-red-500'}`}>
          {/* Status Header */}
          <div className={`p-6 ${result?.success ? 'bg-green-500' : 'bg-red-500'} text-white text-center`}>
            {result?.success ? (
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
            ) : (
              <XCircle className="h-20 w-20 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold">
              {result?.success ? "VALID" : "INVALID"}
            </h1>
          </div>

          <CardContent className="pt-6 space-y-4">
            <p className={`text-center text-lg ${result?.success ? 'text-green-600' : 'text-red-600'}`}>
              {result?.message}
            </p>

            {result?.ticketData && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-medium">{result.ticketData.event_title}</p>
                </div>
                {result.ticketData.customer_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{result.ticketData.customer_name}</p>
                  </div>
                )}
                {result.ticketData.customer_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{result.ticketData.customer_email}</p>
                  </div>
                )}
                {result.ticketData.scanned_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Scanned At</p>
                    <p className="font-medium">
                      {new Date(result.ticketData.scanned_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isOwner && (
              <p className="text-center text-sm text-muted-foreground">
                Only venue staff can validate tickets for entry.
              </p>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              {isOwner && (
                <Button 
                  className="flex-1"
                  onClick={() => navigate("/venue-ticketing")}
                >
                  Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketValidation;
