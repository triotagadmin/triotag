import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

interface TicketCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    title: string;
    price: number;
    currency?: string;
  };
  quantity: number;
}

export function TicketCheckoutDialog({
  open,
  onOpenChange,
  ticket,
  quantity,
}: TicketCheckoutDialogProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!buyerName || !buyerEmail) {
      toast.error("Please fill in your name and email");
      return;
    }

    setLoading(true);

    try {
      const successUrl = `${window.location.origin}/ticket-success`;
      const cancelUrl = `${window.location.origin}/tickets`;

      const { data, error } = await supabase.functions.invoke("paymongo-checkout", {
        body: {
          ticketId: ticket.id,
          quantity,
          buyerName,
          buyerEmail,
          buyerPhone,
          successUrl,
          cancelUrl,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        // Redirect to PayMongo checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to create checkout session");
      setLoading(false);
    }
  };

  const totalAmount = ticket.price * quantity;
  const currency = ticket.currency || "PHP";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Enter your details to proceed with payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">{ticket.title}</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per ticket</span>
              <span>{currency} {ticket.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity</span>
              <span>{quantity}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{currency} {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Juan Dela Cruz"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@email.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="09123456789"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">Pay securely with:</p>
            <div className="flex justify-center gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">GCash</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Maya</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Card</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {currency} {totalAmount.toLocaleString()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
