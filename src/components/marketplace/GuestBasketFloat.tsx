import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ShoppingCart, Trash2, MapPin, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useGuestBasket } from "@/contexts/GuestBasketContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const GuestBasketFloat = () => {
  const { items, removeLocation, updateItem, clearBasket, totalLocations, totalQuantity, grandTotal } = useGuestBasket();
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [creativeUrl, setCreativeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState(false);

  if (items.length === 0) return null;

  const handleUpload = async (file: File) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP images are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `guest-creatives/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("ad-space-media").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("ad-space-media").getPublicUrl(path);
      setCreativeUrl(urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleCheckout = async () => {
    if (!isValidEmail(guestEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setChecking(true);
    try {
      // 1. Create guest booking
      const { data: booking, error: bookingErr } = await supabase
        .from("guest_bookings")
        .insert({
          guest_email: guestEmail,
          guest_name: guestName || null,
          brand_name: brandName || null,
          creative_url: creativeUrl,
          total_locations: totalLocations,
          total_quantity: totalQuantity,
          total_price: grandTotal,
          currency: items[0]?.currency || "PHP",
          payment_status: "pending",
          booking_status: "pending",
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;

      // 2. Insert locations
      const locations = items.map(i => ({
        guest_booking_id: booking.id,
        listing_id: i.listing_id,
        branch_id: i.branch_id,
        branch_name: i.branch_name,
        branch_address: i.branch_address,
        city: i.city,
        unit_type: i.unit_type,
        unit_price: i.unit_price,
        quantity: i.quantity,
        duration_weeks: i.duration_weeks,
        subtotal: i.unit_price * i.quantity * i.duration_weeks,
      }));

      const { error: locErr } = await supabase
        .from("guest_booking_locations")
        .insert(locations);

      if (locErr) throw locErr;

      // 3. Create PayMongo checkout
      const { data: checkoutData, error: checkoutErr } = await supabase.functions.invoke("create-checkout", {
        body: {
          type: "guest_booking",
          guestBookingId: booking.id,
          guestEmail,
          guestName: guestName || guestEmail,
          lineItems: items.map(i => ({
            name: `${i.listing_title} — ${i.branch_name}`,
            quantity: i.quantity * i.duration_weeks,
            amount: Math.round(i.unit_price * 100),
            currency: i.currency,
          })),
          totalAmount: Math.round(grandTotal * 100),
          currency: items[0]?.currency || "PHP",
          successUrl: `${window.location.origin}/payment-success?type=guest_booking&id=${booking.id}`,
          cancelUrl: `${window.location.origin}/explore`,
        },
      });

      if (checkoutErr) throw checkoutErr;

      if (checkoutData?.checkoutUrl) {
        // Save checkout session ref
        await supabase
          .from("guest_bookings")
          .update({ paymongo_checkout_session_id: checkoutData.checkoutSessionId || null, booking_status: "awaiting_payment" })
          .eq("id", booking.id);

        clearBasket();
        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Checkout failed. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const currency = items[0]?.currency || "PHP";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg h-14 px-6 gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Basket</span>
            <Badge variant="secondary" className="ml-1">{totalLocations}</Badge>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg flex flex-col overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Location Bundle ({totalLocations})
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-4 py-4">
            {/* Items */}
            {items.map((item, idx) => {
              const subtotal = item.unit_price * item.quantity * item.duration_weeks;
              return (
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.listing_title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.branch_name} — {item.city}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0"
                        onClick={() => removeLocation(item.branch_id, item.listing_id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-[10px]">Qty</Label>
                        <Input type="number" min={1} value={item.quantity}
                          onChange={e => updateItem(item.branch_id, item.listing_id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="h-8 text-sm" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[10px]">Weeks</Label>
                        <Input type="number" min={1} value={item.duration_weeks}
                          onChange={e => updateItem(item.branch_id, item.listing_id, { duration_weeks: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="h-8 text-sm" />
                      </div>
                      <p className="text-sm font-semibold text-primary whitespace-nowrap">
                        {item.currency} {subtotal.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Creative Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ad Creative (optional)</Label>
              {creativeUrl ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                  <img src={creativeUrl} alt="Creative" className="w-full h-full object-cover" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={() => setCreativeUrl(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Upload JPG, PNG, WEBP"}
                  </span>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
                </label>
              )}
            </div>

            {/* Guest Details */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <Label htmlFor="guest-email" className="text-sm">Email *</Label>
                <Input id="guest-email" type="email" placeholder="your@email.com" value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="guest-name" className="text-sm">Name (optional)</Label>
                <Input id="guest-name" placeholder="Your name" value={guestName}
                  onChange={e => setGuestName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="brand-name" className="text-sm">Brand Name (optional)</Label>
                <Input id="brand-name" placeholder="Your brand" value={brandName}
                  onChange={e => setBrandName(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Locations</span>
              <span className="font-medium">{totalLocations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Booking Quantity</span>
              <span className="font-medium">{totalQuantity}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Grand Total</span>
              <span className="text-primary">{currency} {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <SheetFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={clearBasket}>Clear Basket</Button>
            <Button className="flex-1" onClick={handleCheckout} disabled={checking || !guestEmail}>
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {checking ? "Processing..." : `Pay ${currency} ${grandTotal.toLocaleString()}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
