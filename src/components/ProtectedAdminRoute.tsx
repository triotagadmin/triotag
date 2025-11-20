import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      // Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to access this page");
        navigate("/admin");
        return;
      }

      // Verify admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleError || roleData?.role !== "admin") {
        toast.error("Access denied. Admin credentials required.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      // Verify admin status
      const { data: adminProfile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .single();

      if (profileError || !adminProfile) {
        toast.error("Admin profile not found");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (adminProfile.status === "pending") {
        toast.warning("Your account is pending approval. Please wait for verification.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (adminProfile.status === "rejected") {
        toast.error("Your admin account has been rejected. Please contact support.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      if (adminProfile.status !== "verified") {
        toast.error("Invalid admin status");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      // All checks passed
      setIsVerified(true);
    } catch (error) {
      console.error("Admin access check failed:", error);
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
