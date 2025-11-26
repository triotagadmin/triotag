import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [resendUserId, setResendUserId] = useState("");
  const [resendUserType, setResendUserType] = useState("");

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
      setResendUserId(authData.user.id);
      setResendUserType(userType);
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
      if (roles?.role === "advertiser") {
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
          setResendUserId(session.user.id);
          setResendUserType("advertiser");
          await supabase.auth.signOut();
          return;
        }
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/home");
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
          setResendUserId(session.user.id);
          setResendUserType(profile.publisher_type);
          await supabase.auth.signOut();
          return;
        }
        
        if (profile) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
          navigate("/home");
        } else {
          // No profile yet, go to complete profile
          navigate("/complete-profile");
        }
      } else {
        navigate("/home");
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
    if (!resendEmail || !resendUserId || !resendUserType) return;
    
    setLoading(true);
    try {
      // Send custom verification email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-verification-email", {
        body: {
          email: resendEmail,
          userId: resendUserId,
          userType: resendUserType,
        },
      });

      if (emailError) throw emailError;

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to Tiny Sticky Ads</CardTitle>
          <CardDescription>Sign in or create an account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
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
                      <SelectItem value="advertiser">Advertiser</SelectItem>
                      <SelectItem value="venue">Venue Publisher</SelectItem>
                      <SelectItem value="agent">Agent Publisher</SelectItem>
                      <SelectItem value="digital">Digital Publisher</SelectItem>
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
