import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDashboardByRole } from "@/components/RoleProtectedRoute";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log("[Protected Route] Checking admin access...");
      
      // Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("[Protected Route] No active session found");
        toast.error("Please log in to access this page");
        navigate("/admin");
        return;
      }

      console.log(`[Protected Route] Session found for user: ${session.user.id}`);

      // Verify admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleError || roleData?.role !== "admin") {
        console.error("[Protected Route] Admin role verification failed:", roleError);
        toast.error("Access denied. Admin credentials required.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      console.log(`[Protected Route] Admin role verified for user: ${session.user.id}`);

      // Verify admin status
      const { data: adminProfile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("status, full_name")
        .eq("user_id", session.user.id)
        .single();

      if (profileError || !adminProfile) {
        console.error("[Protected Route] Admin profile not found:", profileError);
        toast.error("Admin profile not found");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      console.log(`[Protected Route] Admin profile status: ${adminProfile.status} for ${adminProfile.full_name}`);

      if (adminProfile.status === "pending") {
        console.log(`[Protected Route] Access denied - pending verification for user: ${session.user.id}`);
        toast.warning("Your account is pending approval. Please wait for verification.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (adminProfile.status === "rejected") {
        console.log(`[Protected Route] Access denied - rejected account for user: ${session.user.id}`);
        toast.error("Your admin account has been rejected. Please contact support.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (adminProfile.status !== "verified") {
        console.error(`[Protected Route] Invalid admin status: ${adminProfile.status} for user: ${session.user.id}`);
        toast.error("Invalid admin status");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      // All checks passed
      console.log(`[Protected Route] Access granted for admin: ${adminProfile.full_name} (${session.user.id})`);
      setIsVerified(true);
    } catch (error) {
      console.error("[Protected Route] Admin access check failed:", error);
      toast.error("Authentication error. Please try logging in again.");
      navigate("/admin");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return null;
  }

  return <>{children}</>;
}
