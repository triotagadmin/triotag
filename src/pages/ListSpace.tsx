import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  publisherType: z.enum(["venue", "digital", "agent"], {
    required_error: "Please select a publisher type",
  }),
  businessName: z.string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  contactName: z.string()
    .trim()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name must be less than 100 characters"),
  contactEmail: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  contactPhone: z.string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must be less than 20 characters"),
  location: z.string()
    .trim()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be less than 200 characters"),
  description: z.string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
});

type FormData = z.infer<typeof formSchema>;

const ListSpace = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const publisherType = watch("publisherType");

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const { error } = await supabase.functions.invoke("submit-listing", {
        body: data,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your listing has been submitted. We'll be in touch soon!",
      });

      reset();
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPublisherTypeLabel = (type: string) => {
    switch (type) {
      case "venue":
        return "Venue";
      case "digital":
        return "Digital Media";
      case "agent":
        return "Agent Services";
      default:
        return "";
    }
  };

  const getPublisherTypeDescription = (type: string) => {
    switch (type) {
      case "venue":
        return "Bars, restaurants, cafes, event spaces, retail locations";
      case "digital":
        return "Social media, websites, apps, digital billboards, email lists";
      case "agent":
        return "Influencers, models, street teams, guerrilla marketing";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">List Your Media Space</h1>
            <p className="text-xl text-muted-foreground">
              Join our network of publishers and start monetizing your advertising space
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Listing Information</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24-48 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Publisher Type Selection */}
                <div className="space-y-3">
                  <Label>Publisher Type *</Label>
                  <RadioGroup
                    onValueChange={(value) => setValue("publisherType", value as "venue" | "digital" | "agent")}
                    value={publisherType}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["venue", "digital", "agent"].map((type) => (
                        <div key={type}>
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type}
                            className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <span className="text-lg font-semibold mb-2">
                              {getPublisherTypeLabel(type)}
                            </span>
                            <span className="text-sm text-muted-foreground text-center">
                              {getPublisherTypeDescription(type)}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                  {errors.publisherType && (
                    <p className="text-sm text-destructive">{errors.publisherType.message}</p>
                  )}
                </div>

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., Downtown Sports Bar, Social Media Agency"
                    {...register("businessName")}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                {/* Contact Name */}
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    placeholder="Your full name"
                    {...register("contactName")}
                  />
                  {errors.contactName && (
                    <p className="text-sm text-destructive">{errors.contactName.message}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your@email.com"
                    {...register("contactEmail")}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...register("contactPhone")}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-destructive">{errors.contactPhone.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="City, State or Region"
                    {...register("location")}
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your media space, audience demographics, traffic numbers, and what makes it unique..."
                    rows={6}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Minimum 20 characters. Include details about your audience, reach, and advertising capabilities.
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Listing"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By submitting this form, you agree to our terms of service and privacy policy.
              We'll review your submission and contact you within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListSpace;
