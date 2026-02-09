import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PrintOrderPaymentGateProps {
  orderId: string;
  onProceedToPayment: () => void;
  onBackToDashboard: () => void;
}

export const PrintOrderPaymentGate = ({
  orderId,
  onProceedToPayment,
  onBackToDashboard,
}: PrintOrderPaymentGateProps) => {
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isApproved = orderStatus === "in_production" || orderStatus === "shipped" || orderStatus === "delivered";

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("print_orders")
        .select("order_status")
        .eq("id", orderId)
        .single();
      if (data) setOrderStatus(data.order_status);
      setLoading(false);
    };

    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`print-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "print_orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrderStatus((payload.new as any).order_status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {isApproved ? (
        <Button onClick={onProceedToPayment} className="w-full" size="lg">
          Proceed to Payment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="font-medium text-sm text-yellow-800 dark:text-yellow-300">
              Waiting for admin approval
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              You'll be able to proceed to payment once admin approves your print order.
            </p>
          </div>
        </div>
      )}
      <Button variant="outline" onClick={onBackToDashboard} className="w-full">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Return to Dashboard
      </Button>
    </div>
  );
};
