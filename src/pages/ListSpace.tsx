import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle, Shield, CreditCard, ImageIcon } from "lucide-react";

const SPACE_TYPES = ["Wall", "Counter", "Glass", "Table", "Door", "Ceiling", "Floor", "Other"];
const SIZES = [
  { value: "tiny", label: "Tiny", description: "Business card to A5 size" },
  { value: "small", label: "Small Format", description: "A4 to A3 poster size" },
];

type Step = "form" | "payment" | "confirmation";

const ListSpace = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [size, setSize] = useState("tiny");
  const [notes, setNotes] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");

  // Check for successful payment return
  const urlParams = new URLSearchParams(window.location.search);
  const listingIdFromUrl = urlParams.get("listing_id");

  useEffect(() => {
    if (listingIdFromUrl && step !== "confirmation") {
      setStep("confirmation");
    }
  }, [listingIdFromUrl]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("listing-photos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(data.path);

      setPhotoUrl(urlData.publicUrl);
      setPhotoPreview(URL.createObjectURL(file));
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    if (!locationName.trim() || locationName.trim().length < 2) {
      toast({ title: "Error", description: "Location name must be at least 2 characters.", variant: "destructive" });
      return false;
    }
    if (!address.trim() || address.trim().length < 3) {
      toast({ title: "Error", description: "Address must be at least 3 characters.", variant: "destructive" });
      return false;
    }
    if (!spaceType) {
      toast({ title: "Error", description: "Please select a space type.", variant: "destructive" });
      return false;
    }
    if (!size) {
      toast({ title: "Error", description: "Please select a size.", variant: "destructive" });
      return false;
    }
    if (!submitterName.trim() || submitterName.trim().length < 2) {
      toast({ title: "Error", description: "Your name must be at least 2 characters.", variant: "destructive" });
      return false;
    }
    if (!submitterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail.trim())) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) return;
    setStep("payment");
  };

  const handlePayAndSubmit = async () => {
    setIsSubmitting(true);
    try {
      const currentUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke("listing-checkout", {
        body: {
          locationName: locationName.trim(),
          address: address.trim(),
          spaceType,
          photoUrl,
          size,
          notes: notes.trim() || null,
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          submitterPhone: submitterPhone.trim() || null,
          successUrl: `${currentUrl}/list-space`,
          cancelUrl: `${currentUrl}/list-space`,
        },
      });

      if (error) throw error;

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation screen
  if (step === "confirmation" || listingIdFromUrl) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-lg mx-auto text-center">
            <Card>
              <CardContent className="pt-8 pb-8 space-y-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Listing Submitted!</h2>
                <p className="text-muted-foreground">
                  Your ad space listing has been submitted and is now <strong>Pending Review</strong>.
                  We'll review your submission and notify you once it's approved.
                </p>
                <div className="bg-muted/50 rounded-md p-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="font-semibold text-primary">Pending Review</span>
                  </p>
                </div>
                <Button onClick={() => {
                  window.history.replaceState({}, "", "/list-space");
                  setStep("form");
                  setLocationName("");
                  setAddress("");
                  setSpaceType("");
                  setPhotoUrl(null);
                  setPhotoPreview(null);
                  setSize("tiny");
                  setNotes("");
                  setSubmitterName("");
                  setSubmitterEmail("");
                  setSubmitterPhone("");
                }} className="mt-4">
                  Submit Another Listing
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">List Your Ad Space</h1>
            <p className="text-xl text-muted-foreground">
              Submit your micro advertising space to our marketplace
            </p>
          </div>

          {/* Pricing Banner */}
          <Card className="mb-6 border-primary/40 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between py-4 gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-lg">$10 per listing</p>
                  <p className="text-sm text-muted-foreground">One-time fee · Secure payment · Admin review included</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure checkout</span>
              </div>
            </CardContent>
          </Card>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === "form" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <span>1</span> Listing Details
            </div>
            <div className="h-px w-8 bg-border" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <span>2</span> Payment
            </div>
          </div>

          {step === "form" && (
            <Card>
              <CardHeader>
                <CardTitle>Listing Details</CardTitle>
                <CardDescription>
                  Describe the ad space you want to list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Location Name */}
                  <div className="space-y-2">
                    <Label htmlFor="locationName">Location Name *</Label>
                    <Input
                      id="locationName"
                      placeholder="e.g., Joe's Coffee Shop, Main Street Mall"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address / General Area *</Label>
                    <Input
                      id="address"
                      placeholder="e.g., 123 Main St, Manila or Downtown Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  {/* Space Type */}
                  <div className="space-y-3">
                    <Label>Space Type *</Label>
                    <RadioGroup value={spaceType} onValueChange={setSpaceType}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {SPACE_TYPES.map((type) => (
                          <div key={type}>
                            <RadioGroupItem value={type} id={`type-${type}`} className="peer sr-only" />
                            <Label
                              htmlFor={`type-${type}`}
                              className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label>Photo (Optional)</Label>
                    <div
                      className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {photoPreview ? (
                        <div className="space-y-2">
                          <img src={photoPreview} alt="Preview" className="max-h-40 mx-auto rounded-md object-cover" />
                          <p className="text-sm text-muted-foreground">Click to change photo</p>
                        </div>
                      ) : isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload a photo of the space</p>
                          <p className="text-xs text-muted-foreground">Max 5MB · JPG, PNG, WebP</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Size */}
                  <div className="space-y-3">
                    <Label>Size *</Label>
                    <RadioGroup value={size} onValueChange={setSize}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SIZES.map((s) => (
                          <div key={s.value}>
                            <RadioGroupItem value={s.value} id={`size-${s.value}`} className="peer sr-only" />
                            <Label
                              htmlFor={`size-${s.value}`}
                              className="flex flex-col rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="font-semibold">{s.label}</span>
                              <span className="text-sm text-muted-foreground">{s.description}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe the visibility, foot traffic, or any special details..."
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="border-t pt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Your Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="submitterName">Your Name *</Label>
                        <Input
                          id="submitterName"
                          placeholder="Full name"
                          value={submitterName}
                          onChange={(e) => setSubmitterName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="submitterEmail">Email *</Label>
                        <Input
                          id="submitterEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={submitterEmail}
                          onChange={(e) => setSubmitterEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="submitterPhone">Phone (Optional)</Label>
                      <Input
                        id="submitterPhone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={submitterPhone}
                        onChange={(e) => setSubmitterPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleProceedToPayment} size="lg" className="w-full">
                    Continue to Payment — $10
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm & Pay</CardTitle>
                <CardDescription>
                  Review your listing details and complete payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Listing Summary</h4>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{locationName}</span>
                    <span className="text-muted-foreground">Address:</span>
                    <span>{address}</span>
                    <span className="text-muted-foreground">Space Type:</span>
                    <span>{spaceType}</span>
                    <span className="text-muted-foreground">Size:</span>
                    <span className="capitalize">{size === "tiny" ? "Tiny" : "Small Format"}</span>
                    <span className="text-muted-foreground">Contact:</span>
                    <span>{submitterName}</span>
                  </div>
                  {photoPreview && (
                    <img src={photoPreview} alt="Space" className="mt-2 max-h-32 rounded-md object-cover" />
                  )}
                </div>

                {/* Price */}
                <div className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Ad Space Listing Fee</p>
                    <p className="text-sm text-muted-foreground">One-time payment</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">$10</p>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span>One-time fee</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Admin review included</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => setStep("form")} className="sm:w-auto w-full">
                    Back to Edit
                  </Button>
                  <Button onClick={handlePayAndSubmit} size="lg" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay $10 & Submit Listing"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By submitting this form, you agree to our terms of service and privacy policy.
              Each payment covers exactly one listing submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListSpace;
