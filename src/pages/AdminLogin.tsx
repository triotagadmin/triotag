import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      console.log(`[Admin Login] Attempting login for: ${email}`);
      
      // Sign in with Supabase (uses JWT tokens internally)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("[Admin Login Error] Authentication failed:", authError);
        if (authError.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user || !authData.session) {
        console.error("[Admin Login Error] No user or session returned");
        toast.error("Authentication failed. Please try again.");
        return;
      }

      console.log(`[Admin Login] User authenticated: ${authData.user.id}`);

      // Verify role (admin or print_partner)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .single();

      if (roleError || (roleData?.role !== "admin" && roleData?.role !== "print_partner")) {
        console.error("[Admin Login Error] User does not have admin or print_partner role:", roleError);
        await supabase.auth.signOut();
        toast.error("Access denied. Admin or Print Partner credentials required.");
        return;
      }

      // Handle print_partner login
      if (roleData.role === "print_partner") {
        const { data: ppProfile } = await supabase
          .from("print_partner_profiles")
          .select("verified, company_name")
          .eq("user_id", authData.user.id)
          .single();

        if (!ppProfile?.verified) {
          await supabase.auth.signOut();
          toast.warning("Your print partner account is pending super admin approval.");
          return;
        }

        toast.success(`Welcome back, ${ppProfile.company_name}!`);
        navigate("/print-partner/dashboard");
        return;
      }

      console.log(`[Admin Login] Admin role verified for user: ${authData.user.id}`);

      // Check admin verification status
      const { data: adminProfile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("status, full_name")
        .eq("user_id", authData.user.id)
        .single();

      if (profileError || !adminProfile) {
        console.error("[Admin Login Error] Admin profile not found:", profileError);
        await supabase.auth.signOut();
        toast.error("Admin profile not found. Please contact support.");
        return;
      }

      console.log(`[Admin Login] Admin profile status: ${adminProfile.status} for user: ${authData.user.id}`);

      if (adminProfile.status === "pending") {
        console.log(`[Admin Login] Access denied - pending verification: ${authData.user.id}`);
        await supabase.auth.signOut();
        toast.warning("Your account is pending super-admin approval. Please wait for verification.", {
          duration: 6000,
        });
        return;
      }

      if (adminProfile.status === "rejected") {
        console.log(`[Admin Login] Access denied - rejected account: ${authData.user.id}`);
        await supabase.auth.signOut();
        toast.error("Your admin account has been rejected. Please contact support for more information.");
        return;
      }

      if (adminProfile.status === "verified") {
        console.log(`[Admin Login Success] Admin ${adminProfile.full_name} (${authData.user.id}) logged in successfully at ${new Date().toISOString()}`);
        toast.success(`Welcome back, ${adminProfile.full_name}! Redirecting to dashboard...`);
        // Session is stored in localStorage with JWT token
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      console.error("[Admin Login Error] Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
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

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Need admin access?{" "}
                <Link to="/admin/register" className="text-primary hover:underline font-medium">
                  Request Registration
                </Link>
              </p>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-semibold mb-1">🔒 Secure Authentication</p>
                <p>Your session is protected with industry-standard JWT tokens and encrypted connections.</p>
              </div>
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
