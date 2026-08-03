import { useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft, CheckCircle2, Printer, UserCheck } from "lucide-react";
import { z } from "zod";

const adminRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const printPartnerSchema = z.object({
  fullName: z.string().min(2, "Contact person name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(5, "Phone number required"),
  companyName: z.string().min(2, "Company name required"),
  businessAddress: z.string().min(5, "Business address required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const agentSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phoneNumber: z.string().min(5, "Phone number required"),
  companyName: z.string().min(2, "Business / agency name required"),
  businessAddress: z.string().min(2, "Coverage area required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const CAPABILITIES = [
  "Sticker Printing",
  "Poster Printing",
  "Table Tent Printing",
  "Flyer Printing",
  "Large Format Printing",
];

export default function AdminRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const type = useMemo(() => {
    return new URLSearchParams(location.search).get("type") || "admin";
  }, [location.search]);
  const isPrintPartner = type === "print_partner";
  const isAgent = type === "agent";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    companyName: "",
    businessAddress: "",
  });
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isAgent) {
        const validated = agentSchema.parse(formData);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              user_type: "agent",
              full_name: validated.fullName,
              business_name: validated.companyName,
              contact_phone: validated.phoneNumber,
              location: validated.businessAddress,
            },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Registration failed");

        const { error: notifyError } = await supabase.functions.invoke("notify-admin-registration", {
          body: {
            fullName: validated.fullName,
            email: validated.email,
            phoneNumber: validated.phoneNumber,
            userId: authData.user.id,
            registrationType: "agent",
            companyName: validated.companyName,
            businessAddress: validated.businessAddress,
          },
        });
        if (notifyError) console.error("Failed to send notification email:", notifyError);

        await supabase.auth.signOut();
        setIsSuccess(true);
        toast.success("Agent application submitted!");
        setTimeout(() => navigate("/admin"), 3000);
        return;
      }

      if (isPrintPartner) {
        const validated = printPartnerSchema.parse(formData);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              user_type: "print_partner",
              full_name: validated.fullName,
              contact_name: validated.fullName,
              company_name: validated.companyName,
              contact_phone: validated.phoneNumber,
              business_address: validated.businessAddress,
            },
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Registration failed");

        // Ensure profile row exists with full data (trigger may create a baseline row)
        await supabase.from("print_partner_profiles").upsert({
          user_id: authData.user.id,
          company_name: validated.companyName,
          contact_person: validated.fullName,
          contact_email: validated.email,
          contact_phone: validated.phoneNumber,
          business_address: validated.businessAddress,
          verified: false,
        }, { onConflict: "user_id" });

        const { error: notifyError } = await supabase.functions.invoke("notify-admin-registration", {
          body: {
            fullName: validated.fullName,
            email: validated.email,
            phoneNumber: validated.phoneNumber,
            userId: authData.user.id,
            registrationType: "print_partner",
            companyName: validated.companyName,
            businessAddress: validated.businessAddress,
            capabilities,
          },
        });
        if (notifyError) console.error("Failed to send notification email:", notifyError);

        await supabase.auth.signOut();
        setIsSuccess(true);
        toast.success("Print partner application submitted!");
        setTimeout(() => navigate("/admin"), 3000);
        return;
      }

      // Admin flow
      const validated = adminRegisterSchema.parse(formData);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            user_type: "admin",
            full_name: validated.fullName,
            phone_number: validated.phoneNumber || null,
          },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      const { error: notifyError } = await supabase.functions.invoke("notify-admin-registration", {
        body: {
          fullName: validated.fullName,
          email: validated.email,
          phoneNumber: validated.phoneNumber,
          userId: authData.user.id,
          registrationType: "admin",
        },
      });
      if (notifyError) console.error("Failed to send notification email:", notifyError);

      setIsSuccess(true);
      toast.success("Registration submitted successfully!");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/admin"), 3000);
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isPrintPartner || isAgent ? "Application Submitted" : "Registration Submitted"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {isAgent
                  ? "Your agent application has been submitted. An admin will review and approve your account."
                  : isPrintPartner
                  ? "Your print partner application has been submitted. The super admin will review and approve your account."
                  : "Your admin account request is pending approval"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Please allow 24-48 hours for manual verification. You will not be able to log in until your account is approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = isPrintPartner ? Printer : Shield;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isPrintPartner ? "Print Partner Registration" : "Request Admin Access"}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {isPrintPartner
                  ? "Apply to join TrioTag's print partner network. Your application will be reviewed by the super admin."
                  : "Submit your application for administrator privileges"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{isPrintPartner ? "Contact Person *" : "Full Name *"}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {isPrintPartner && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Your printing company"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Business Address *</Label>
                    <Input
                      id="businessAddress"
                      type="text"
                      placeholder="Full address"
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  {isPrintPartner ? "Phone Number *" : "Phone Number (Optional)"}
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+63..."
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required={isPrintPartner}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {isPrintPartner && (
                <div className="space-y-2">
                  <Label>Capabilities</Label>
                  <div className="space-y-2 bg-muted/30 p-3 rounded-md">
                    {CAPABILITIES.map((cap) => (
                      <div key={cap} className="flex items-center gap-2">
                        <Checkbox
                          id={`cap-${cap}`}
                          checked={capabilities.includes(cap)}
                          onCheckedChange={() => toggleCapability(cap)}
                          disabled={isLoading}
                        />
                        <Label htmlFor={`cap-${cap}`} className="text-sm font-normal cursor-pointer">
                          {cap}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Your account will be created with "Pending" status.
                  You cannot log in until the super admin approves your registration.
                </p>
              </div>

              <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/admin" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
