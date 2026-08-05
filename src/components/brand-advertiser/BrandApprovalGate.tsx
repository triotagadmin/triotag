import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Clock, XCircle, Loader2 } from "lucide-react";

export default function BrandApprovalGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ loading: boolean; status: string; reason: string | null }>({
    loading: true,
    status: "pending",
    reason: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) setState({ loading: false, status: "pending", reason: null }); return; }
      const { data } = await supabase
        .from("brand_advertiser_profiles")
        .select("approval_status, rejection_reason")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        loading: false,
        status: (data as any)?.approval_status || "pending",
        reason: (data as any)?.rejection_reason || null,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (state.status !== "approved") {
    const rejected = state.status === "rejected";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-gray-200">
          <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${rejected ? "bg-red-100" : "bg-yellow-100"}`}>
            {rejected ? <XCircle className="w-6 h-6 text-red-600" /> : <Clock className="w-6 h-6 text-yellow-600" />}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mt-4">
            {rejected ? "Your Brand Advertiser application was rejected" : "Your Brand Advertiser account is awaiting Super Admin approval"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {rejected
              ? state.reason || "Please contact support for more details."
              : "We'll notify you once your account has been reviewed and approved."}
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
