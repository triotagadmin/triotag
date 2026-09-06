import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

// Self-serve signup only creates Brand Advertiser accounts.
const SIGNUP_USER_TYPE = "brand_advertiser";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const userType = SIGNUP_USER_TYPE;


  // Read ?redirect=... once so post-auth flows can honor it
  const redirectTo = (() => {
    if (typeof window === "undefined") return null;
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (!r || !r.startsWith("/")) return null;
    return r;
  })();
  const goAfterAuth = (fallback: string) => navigate(redirectTo || fallback);

  // Handle post-OAuth redirect: the database (not the browser) decides who this user is.
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Signup hints are only used for messaging / first-time profile creation.
      const urlParams = new URLSearchParams(window.location.search);
      const urlAccountType = urlParams.get("account_type");
      const storedUserType = urlAccountType || localStorage.getItem("google_signup_user_type");
      localStorage.removeItem("google_signup_user_type");
      const intent = localStorage.getItem("google_auth_intent");
      localStorage.removeItem("google_auth_intent");
      if (urlAccountType) window.history.replaceState({}, "", window.location.pathname);

      setLoading(true);
      try {
        // Database-backed identity: role + brand profile keyed on auth.users.id.
        const account = await resolveAccount();

        if (account.needsManualReview) {
          toast({
            title: "We need to check your account",
            description: "More than one company record matches your email. Our team will sort this out for you.",
            variant: "destructive",
          });
        }

        const isReturning = !!account.brandProfileId || (!!account.role && intent !== "signup");

        // Brand advertisers always keep exactly one profile row, keyed on the auth UUID.
        if (account.role === "brand_advertiser" && !account.brandProfileId) {
          const { data: existingProfile } = await supabase
            .from("brand_advertiser_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!existingProfile) {
            const { error: insertError } = await supabase.from("brand_advertiser_profiles").insert({
              user_id: user.id,
              company_name: user.user_metadata?.full_name || "",
              contact_name: user.user_metadata?.full_name || "",
              contact_email: user.email || "",
              verified: true,
            } as any);
            // A duplicate here just means another tab already created it — never a second account.
            if (insertError && insertError.code !== "23505") {
              console.error("Failed to create brand advertiser profile:", insertError);
            }
          }
        }

        if (!account.role) {
          toast({
            title: "Your account isn't set up yet",
            description: "Please use the invitation link you were sent, or contact TrioTag support.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast(
          isReturning
            ? { title: "Welcome back!", description: "We found your existing account and signed you in." }
            : { title: "Welcome!", description: "Your account has been created successfully." }
        );
        void storedUserType;
        routeByRole(account.role);
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




  const handleGoogleSignIn = async (intent: "signin" | "signup" = "signin") => {
    setLoading(true);
    try {
      // Store the selected user type for post-OAuth redirect handling
      localStorage.setItem("google_signup_user_type", userType);
      localStorage.setItem("google_auth_intent", intent);

      const redirectUrl = `${window.location.origin}/auth?account_type=${encodeURIComponent(userType)}`;

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectUrl,
      });
      if (result.error) {
        localStorage.removeItem("google_signup_user_type");
        localStorage.removeItem("google_auth_intent");
        toast({
          title: "Google Sign-In Failed",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      localStorage.removeItem("google_signup_user_type");
      localStorage.removeItem("google_auth_intent");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to TrioTag</CardTitle>
          <CardDescription>Sign in to your account or create a new one with Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            className="w-full group relative overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
            onClick={() => handleGoogleSignIn("signin")}
            disabled={loading}
          >
            <GoogleIcon />
            <span className="relative font-medium">Sign In with Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:border-primary/40 active:scale-[0.98]"
            onClick={() => handleGoogleSignIn("signup")}
            disabled={loading}
          >
            <GoogleIcon />
            <span className="relative font-medium">Sign Up with Google</span>
          </Button>
          <p className="text-xs text-muted-foreground text-center pt-1">
            New accounts are created as Brand Advertiser accounts.
          </p>
        </CardContent>

      </Card>
    </div>
  );
};

export default Auth;
