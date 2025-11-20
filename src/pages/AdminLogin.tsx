import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show verification success message
    const verified = searchParams.get("verified");
    if (verified === "success") {
      toast.success("Admin verified successfully! You can now log in.", {
        duration: 5000,
        icon: <CheckCircle className="h-5 w-5" />,
      });
    } else if (verified === "already") {
      toast.info("This admin account is already verified. You can log in.", {
        duration: 5000,
      });
    }

    // Check if user is already logged in as verified admin
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: adminProfile } = await supabase
          .from("admin_profiles")
          .select("status")
          .eq("user_id", session.user.id)
          .single();

        if (adminProfile?.status === "verified") {
          navigate("/admin/dashboard");
        }
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleError || roleData?.role !== "admin") {
        await supabase.auth.signOut();
        toast.error("Access denied. Admin credentials required.");
        return;
      }

      // Check admin verification status
      const { data: adminProfile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("status")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        toast.error("Admin profile not found.");
        return;
      }

      if (adminProfile.status === "pending") {
        await supabase.auth.signOut();
        toast.warning("Your account is pending approval by Tiny Sticky Ads.");
        return;
      }

      if (adminProfile.status === "rejected") {
        await supabase.auth.signOut();
        toast.error("Your admin account has been rejected. Please contact support.");
        return;
      }

      if (adminProfile.status === "verified") {
        toast.success("Welcome back, Admin!");
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <CardDescription className="text-base mt-2">
                Secure access for verified administrators
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Need admin access?{" "}
                <Link to="/admin/register" className="text-primary hover:underline font-medium">
                  Request Registration
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This portal is restricted to verified administrators only.
          <br />
          Unauthorized access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
