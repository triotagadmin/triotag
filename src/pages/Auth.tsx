import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<string>("retailer");

  useEffect(() => {
    const intendedRole = localStorage.getItem("intended_role");
    if (intendedRole) {
      setUserType(intendedRole);
      localStorage.removeItem("intended_role");
    }
  }, []);

  // Read ?redirect=... once so post-auth flows can honor it
  const redirectTo = (() => {
    if (typeof window === "undefined") return null;
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (!r || !r.startsWith("/")) return null;
    return r;
  })();
  const goAfterAuth = (fallback: string) => navigate(redirectTo || fallback);

  // Handle post-OAuth redirect: detect session, create profile if needed, route to dashboard
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Read account_type from URL params first, fallback to localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const urlAccountType = urlParams.get("account_type");
      const storedUserType = urlAccountType || localStorage.getItem("google_signup_user_type");
      if (!storedUserType) return; // Not a Google signup flow we initiated

      localStorage.removeItem("google_signup_user_type");
      // Clean up URL params
      if (urlAccountType) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      setLoading(true);

      try {
        const userId = session.user.id;
        const userEmail = session.user.email || "";

        // Check if user_roles already exist (returning user)
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          // Existing account (including legacy retailers) — always honor its role
          routeByRole(existingRole.role);
          return;
        }



        // New Google user - create role and profile
        const mappedRole =
          storedUserType === "venue" ? "agent" :
          storedUserType === "advertiser" ? "retailer" :
          storedUserType === "brand_advertiser" ? "brand_advertiser" :
          storedUserType;

        // The trigger handle_new_user_role should handle this, but ensure it exists
        // Create the appropriate profile and mark as verified
        if (storedUserType === "print_partner") {

          const { data: existingProfile } = await supabase
            .from("print_partner_profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("print_partner_profiles").insert({
              user_id: userId,
              company_name: session.user.user_metadata?.full_name || "",
              contact_person: session.user.user_metadata?.full_name || "",
              contact_email: userEmail,
              verified: true,
            });
          } else {
            await supabase
              .from("print_partner_profiles")
              .update({ verified: true })
              .eq("user_id", userId);
          }
        } else if (storedUserType === "venue") {
          const { data: existingProfile } = await supabase
            .from("publisher_profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("publisher_profiles").insert({
              user_id: userId,
              publisher_type: "venue",
              business_name: session.user.user_metadata?.full_name || session.user.email || "Agent",
              contact_email: userEmail,
              verified: true,
              verification_status: "pending",
            });
          } else {
            await supabase
              .from("publisher_profiles")
              .update({ verified: true })
              .eq("user_id", userId);
          }
        } else if (storedUserType === "brand_advertiser") {
          const { data: existingProfile } = await supabase
            .from("brand_advertiser_profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("brand_advertiser_profiles").insert({
              user_id: userId,
              company_name: session.user.user_metadata?.full_name || "",
              contact_name: session.user.user_metadata?.full_name || "",
              contact_email: userEmail,
              verified: true,
            });
          } else {
            await supabase
              .from("brand_advertiser_profiles")
              .update({ verified: true })
              .eq("user_id", userId);
          }
        } else if (storedUserType === "talent") {
          // Ensure the role is set to talent (trigger may have defaulted to advertiser)
          if (!existingRole || existingRole.role !== "talent") {
            await supabase.rpc("set_own_role", { _role: "talent" });
          }
          // Talent profiles are created via the /talent-profile onboarding form
          // No automatic profile creation here — routeByRole will redirect to /talent-profile
        }

        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
        routeByRole(mappedRole);
      } catch (error: any) {
        console.error("OAuth post-redirect error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const routeByRole = async (role: string) => {
      if (role === "admin") {
        goAfterAuth("/admin/dashboard");
      } else if (role === "retailer") {
        try {
          await supabase.functions.invoke("sync-pending-listing-ownership");
        } catch (syncError) {
          console.error("Failed to sync pending listings after OAuth:", syncError);
        }
        goAfterAuth("/retailer-dashboard");
      } else if (role === "print_partner") {
        goAfterAuth("/print-partner/dashboard");
      } else if (role === "agent") {
        goAfterAuth("/venue-publishers");
      } else if (role === "talent") {
        // Check talent profile status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: tp } = await supabase
            .from("talent_profiles")
            .select("status")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (tp?.status === "approved") {
            navigate("/talent-dashboard");
          } else {
            navigate("/talent-profile");
          }
        } else {
          navigate("/talent-profile");
        }
      } else if (role === "brand_advertiser") {
        goAfterAuth("/brand-advertiser/dashboard");
      } else {
        navigate("/");
      }
    };

    handleOAuthRedirect();
  }, [navigate, toast]);




  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Store the selected user type for post-OAuth redirect handling
      localStorage.setItem("google_signup_user_type", userType);

      const redirectUrl = `${window.location.origin}/auth?account_type=${encodeURIComponent(userType)}`;

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUrl,
      });
      if (result.error) {
        localStorage.removeItem("google_signup_user_type");
        toast({
          title: "Google Sign-In Failed",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      localStorage.removeItem("google_signup_user_type");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const GoogleButton = ({ label = "Sign in with Google" }: { label?: string }) => (
    <div className="space-y-4 mt-4">

      <Button
        type="button"
        variant="outline"
        className="w-full group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-primary/40 active:scale-[0.98]"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <svg className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        <span className="relative font-medium">{label}</span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to TrioTag</CardTitle>
          <CardDescription>Continue with Google to sign in or create your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-type">I am a...</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger id="user-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="brand_advertiser">Brand Advertiser</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <GoogleButton label="Continue with Google" />
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
