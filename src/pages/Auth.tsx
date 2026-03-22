import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" })
    .max(72, { message: "Password must be less than 72 characters" }),
});

const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be less than 72 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<string>("advertiser");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

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

        const intendedRole = storedUserType === "venue" ? "publisher" : storedUserType;

        if (existingRole) {
          if (existingRole.role === intendedRole) {
            // Returning user with correct role - just route
            routeByRole(existingRole.role);
            return;
          }
          // New Google user whose trigger defaulted to wrong role - fix it
          await supabase.rpc("set_own_role", { _role: intendedRole as "admin" | "advertiser" | "publisher" });
        }

        // New Google user - create role and profile
        const mappedRole = storedUserType === "venue" ? "publisher" : storedUserType;

        // The trigger handle_new_user_role should handle this, but ensure it exists
        // Create the appropriate profile and mark as verified
        if (storedUserType === "advertiser") {
          const { data: existingProfile } = await supabase
            .from("advertiser_profiles")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (!existingProfile) {
            await supabase.from("advertiser_profiles").insert({
              user_id: userId,
              company_name: session.user.user_metadata?.full_name || "",
              contact_name: session.user.user_metadata?.full_name || "",
              contact_email: userEmail,
              verified: true,
            });
          } else {
            await supabase
              .from("advertiser_profiles")
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
        navigate("/admin/dashboard");
      } else if (role === "advertiser") {
        try {
          await supabase.functions.invoke("sync-pending-listing-ownership");
        } catch (syncError) {
          console.error("Failed to sync pending listings after OAuth:", syncError);
        }
        navigate("/advertiser-dashboard");
      } else if (role === "publisher") {
        navigate("/venue-publishers");
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
      } else {
        navigate("/");
      }
    };

    handleOAuthRedirect();
  }, [navigate, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = signUpSchema.parse({
        email,
        password,
      });

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("User creation failed");

      // Profile is automatically created by database trigger
      
      // Sign out the user immediately (they must verify email first)
      await supabase.auth.signOut();

      // Send verification email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-verification-email", {
        body: {
          email: validatedData.email,
          userId: authData.user.id,
          userType: userType,
        },
      });

      if (emailError) {
        console.error("Error sending verification email:", emailError);
        throw new Error("Failed to send verification email. Please contact support.");
      }

      toast({
        title: "Registration Successful!",
        description: "A verification email has been sent. Please check your inbox.",
      });
      setShowResendVerification(true);
      setResendEmail(validatedData.email);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = signInSchema.parse({
        email,
        password,
      });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (signInError) throw signInError;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No session found");

      // Check user role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      // Check verification status based on role
      if (roles?.role === "admin") {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("status")
          .eq("user_id", session.user.id)
          .single();
        
        if (adminProfile && adminProfile.status !== "verified") {
          toast({
            title: "Admin not verified",
            description: "Your admin account is pending verification.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in as admin.",
        });
        navigate("/admin/dashboard");
      } else if (roles?.role === "advertiser") {
        const { data: profile } = await supabase
          .from("advertiser_profiles")
          .select("verified")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile && !profile.verified) {
          toast({
            title: "Email not verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          setShowResendVerification(true);
          setResendEmail(validatedData.email);
          await supabase.auth.signOut();
          return;
        }
        
        try {
          await supabase.functions.invoke("sync-pending-listing-ownership");
        } catch (syncError) {
          console.error("Failed to sync pending listings on sign in:", syncError);
        }

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/");
      } else if (roles?.role === "publisher") {
        const { data: profile } = await supabase
          .from("publisher_profiles")
          .select("verified, publisher_type")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile && !profile.verified) {
          toast({
            title: "Email not verified",
            description: "Please verify your email before logging in.",
            variant: "destructive",
          });
          setShowResendVerification(true);
          setResendEmail(validatedData.email);
          await supabase.auth.signOut();
          return;
        }
        
        if (profile) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
          navigate("/");
        } else {
          navigate("/");
        }
      } else if (roles?.role === "talent") {
        // Check talent profile status to route correctly
        const { data: talentProfile } = await supabase
          .from("talent_profiles")
          .select("status")
          .eq("user_id", session.user.id)
          .maybeSingle();

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });

        if (talentProfile?.status === "approved") {
          navigate("/talent-dashboard");
        } else {
          navigate("/talent-profile");
        }
      } else {
        navigate("/");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) return;
    
    setLoading(true);
    try {
      // Look up user by email to get their userId
      let userId = "";
      
      // Try advertiser first
      const { data: advertiser } = await supabase
        .from("advertiser_profiles")
        .select("user_id")
        .eq("contact_email", resendEmail)
        .maybeSingle();
      
      if (advertiser) {
        userId = advertiser.user_id;
      } else {
        // Try publisher
        const { data: publisher } = await supabase
          .from("publisher_profiles")
          .select("user_id")
          .eq("contact_email", resendEmail)
          .maybeSingle();
        
        if (publisher) {
          userId = publisher.user_id;
        }
      }

      if (!userId) {
        throw new Error("No account found with this email. Please sign up first.");
      }

      // Call the custom edge function to resend verification email
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: {
          email: resendEmail,
          userId: userId,
          userType: userType,
        },
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
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
          <CardDescription>Sign in or create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <GoogleButton label="Sign in with Google" />
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-type">I am a...</Label>
                  <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advertiser">Franchise Partner</SelectItem>
                      <SelectItem value="print_partner">Print Partner</SelectItem>
                      <SelectItem value="venue">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <GoogleButton label="Sign up with Google" />
            </TabsContent>
          </Tabs>
          
          {showResendVerification && (
            <Card className="mt-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200 text-lg">Verify Your Email</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  We've sent a verification link to <strong>{resendEmail}</strong>. 
                  Please check your inbox (and spam folder) to activate your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleResendVerification} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
