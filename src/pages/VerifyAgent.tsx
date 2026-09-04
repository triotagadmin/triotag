import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

type Preview = { email: string; name: string; tenant_name: string; expires_at: string };

const invokeVerify = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("agent-verify", { body });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as any).context;
      if (ctx?.json) message = (await ctx.json())?.error ?? message;
      else if (ctx && typeof ctx.text === "function") message = JSON.parse(await ctx.text())?.error ?? message;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
};

export default function VerifyAgent() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      try {
        setPreview(await invokeVerify({ token, mode: "preview" }));
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [token]);

  const signIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/verify/agent?token=${token}`,
      extraParams: { prompt: "select_account", login_hint: preview?.email ?? "" },
    });
    if (result.redirected) return;
    if (result.error) toast.error(result.error.message);
    else window.location.reload();
  };

  const activate = async () => {
    setBusy(true);
    try {
      const res = await invokeVerify({ token, mode: "verify" });
      toast.success("Your Agent account is now active.");
      navigate(res.redirect ?? "/venue-publishers", { replace: true });
    } catch (e: any) {
      toast.error(e.message);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-6">
      <Card className="w-full max-w-md border-green-500/20 bg-black/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" /> Agent Account Verification
          </CardTitle>
          <CardDescription>
            {loading ? "Checking your verification link…" : preview
              ? `You've been invited to join ${preview.tenant_name} as a TrioTag Agent.`
              : "We couldn't verify this link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-green-400" />}

          {!loading && error && <p className="text-sm text-red-400">{error}</p>}

          {!loading && preview && !error && (
            <>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Invited email: </span>{preview.email}</p>
                <p className="text-xs text-muted-foreground">
                  This link is single-use and expires on {new Date(preview.expires_at).toLocaleString()}.
                </p>
              </div>
              {signedIn ? (
                <Button className="w-full" onClick={activate} disabled={busy}>
                  {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Activating…</> : "Verify & Activate Account"}
                </Button>
              ) : (
                <Button className="w-full" onClick={signIn}>
                  Sign in with Google to verify
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
