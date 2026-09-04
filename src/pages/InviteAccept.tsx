import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Preview = {
  email: string;
  invited_role: string;
  tenant_name: string;
  expires_at: string;
  accepted: boolean;
};

export default function InviteAccept() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      if (session) {
        const { data } = await supabase.rpc("get_invitation_preview", { _token: token });
        setPreview((data as Preview[] | null)?.[0] ?? null);
      }
      setLoading(false);
    })();
  }, [token]);

  const signIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/invite/${token}`,
      extraParams: { prompt: "select_account" },
    });
    if (result.redirected) return;
    if (result.error) toast.error(result.error.message);
    else window.location.reload();
  };

  const accept = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("accept_invitation", { _token: token });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const role = (data as { member_role: string }[] | null)?.[0]?.member_role;
    toast.success("Invitation accepted");
    navigate(role === "super_admin" ? "/tenant/dashboard" : "/venue-publishers", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-6">
      <Card className="w-full max-w-md border-green-500/20 bg-black/60">
        <CardHeader>
          <CardTitle>TrioTag invitation</CardTitle>
          <CardDescription>
            {loading ? "Checking your invitation…"
              : !signedIn ? "Sign in with the Google account this invitation was sent to."
              : !preview ? "This invitation is invalid, revoked or no longer available."
              : preview.accepted ? "This invitation has already been used."
              : `You've been invited to join ${preview.tenant_name} as ${preview.invited_role === "super_admin" ? "Super Admin" : "Agent"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!loading && !signedIn && (
            <Button className="w-full" onClick={signIn}>Continue with Google</Button>
          )}
          {!loading && signedIn && preview && !preview.accepted && (
            <>
              <p className="text-sm text-muted-foreground">Invited email: {preview.email}</p>
              <Button className="w-full" onClick={accept} disabled={busy}>
                {busy ? "Joining…" : "Accept invitation"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
