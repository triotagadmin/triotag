import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Ticket,
  Calendar,
  DollarSign,
  Clock
} from "lucide-react";

interface ValidationResult {
  success: boolean;
  error?: string;
  message: string;
  event_name?: string;
  price?: number;
  scanned_at?: string;
}

const ValidateTicket = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const ticketId = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    if (ticketId && token) {
      validateTicket();
    } else {
      setResult({
        success: false,
        error: 'missing_params',
        message: 'Missing ticket ID or token'
      });
      setLoading(false);
    }
  }, [ticketId, token]);

  const validateTicket = async () => {
    try {
      // Call the atomic validation function
      const { data, error } = await supabase
        .rpc('validate_publisher_ticket', {
          p_ticket_id: ticketId,
          p_secret_token: token,
          p_scanner_ip: null
        });

      if (error) throw error;

      // Type assertion for the RPC response
      const validationResult = data as unknown as ValidationResult;
      setResult(validationResult);
    } catch (error: any) {
      console.error("Validation error:", error);
      setResult({
        success: false,
        error: 'system_error',
        message: 'An error occurred during validation'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-md mx-4 border-0 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping" />
              </div>
              <Loader2 className="h-24 w-24 mx-auto animate-spin text-primary relative z-10" />
            </div>
            <h2 className="text-2xl font-bold mt-8 mb-2">Validating Ticket</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // SUCCESS - Access Granted
  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white/20 animate-pulse" />
              </div>
              <CheckCircle className="h-28 w-28 relative z-10 drop-shadow-lg" />
            </div>
          </div>
          
          <CardContent className="pt-8 pb-8 text-center">
            <h1 className="text-4xl font-black text-green-600 mb-2 tracking-tight">
              ACCESS GRANTED
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ticket validated successfully!
            </p>

            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold text-lg">{result.event_name}</p>
                </div>
              </div>

              {result.price !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Price</p>
                    <p className="font-semibold">${result.price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Validated At</p>
                  <p className="font-semibold">
                    {result.scanned_at 
                      ? new Date(result.scanned_at).toLocaleString()
                      : new Date().toLocaleString()
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                This ticket has been marked as used and cannot be scanned again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ALREADY USED - Invalid
  if (result?.error === 'already_used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-rose-900 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-white text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-white/20 animate-pulse" />
              </div>
              <XCircle className="h-28 w-28 relative z-10 drop-shadow-lg" />
            </div>
          </div>
          
          <CardContent className="pt-8 pb-8 text-center">
            <h1 className="text-4xl font-black text-red-600 mb-2 tracking-tight">
              INVALID
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              This ticket has already been used
            </p>

            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-6 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Ticket className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold text-lg">{result.event_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Originally Scanned</p>
                  <p className="font-semibold text-red-600">
                    {result.scanned_at 
                      ? new Date(result.scanned_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Entry Denied - Ticket Already Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // INVALID TICKET or OTHER ERROR
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden">
        {/* Error Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-white/20 animate-pulse" />
            </div>
            <AlertTriangle className="h-28 w-28 relative z-10 drop-shadow-lg" />
          </div>
        </div>
        
        <CardContent className="pt-8 pb-8 text-center">
          <h1 className="text-4xl font-black text-orange-600 mb-2 tracking-tight">
            ERROR
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {result?.message || 'Unable to validate ticket'}
          </p>

          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-6">
            <p className="text-muted-foreground">
              The ticket could not be validated. This may be because:
            </p>
            <ul className="mt-4 text-left space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                The ticket ID is invalid
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                The security token doesn't match
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                The ticket has been deleted
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Please contact the event organizer if you believe this is an error.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidateTicket;
