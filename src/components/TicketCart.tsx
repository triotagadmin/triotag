import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TicketCart = () => {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", email: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!checkoutForm.email || !checkoutForm.name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsProcessing(true);
    try {
      // Create orders for each item
      for (const item of items) {
        const { error } = await supabase.from("ticket_orders").insert({
          ticket_id: item.ticketId,
          buyer_email: checkoutForm.email,
          buyer_name: checkoutForm.name,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          payment_status: "completed",
        });

        if (error) throw error;

        // Get current ticket and update quantity sold
        const { data: ticketData } = await supabase
          .from("tickets")
          .select("quantity_sold")
          .eq("id", item.ticketId)
          .single();

        if (ticketData) {
          await supabase
            .from("tickets")
            .update({
              quantity_sold: (ticketData.quantity_sold || 0) + item.quantity,
            })
            .eq("id", item.ticketId);
        }
      }

      toast.success("Order placed successfully! Check your email for tickets.");
      clearCart();
      setIsCheckoutOpen(false);
      setCheckoutForm({ name: "", email: "" });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>
              {totalItems === 0
                ? "Your cart is empty"
                : `${totalItems} ticket${totalItems > 1 ? "s" : ""} in cart`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.ticketId}
                className="flex gap-4 p-4 border rounded-lg"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.location}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.eventDate).toLocaleDateString()}
                  </p>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.ticketId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.ticketId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeFromCart(item.ticketId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalItems > 0 && (
            <SheetFooter className="mt-6">
              <div className="w-full space-y-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
            <DialogDescription>
              Enter your details to receive your e-tickets via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={checkoutForm.name}
                onChange={(e) =>
                  setCheckoutForm({ ...checkoutForm, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={checkoutForm.email}
                onChange={(e) =>
                  setCheckoutForm({ ...checkoutForm, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
