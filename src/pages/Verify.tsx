import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "already">("loading");

  useEffect(() => {
    const verified = searchParams.get("verified");
    const token = searchParams.get("token");

    if (verified) {
      setStatus(verified as "success" | "failed" | "already");
    } else if (token) {
      // Token present - redirect to edge function for verification
      window.location.href = `https://jungfmgsxbayxzptvpky.supabase.co/functions/v1/verify-email?token=${token}`;
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "already" && "Already Verified"}
            {status === "failed" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we verify your email address"}
            {status === "success" && "Your email has been successfully verified"}
            {status === "already" && "Your email was already verified"}
            {status === "failed" && "We couldn't verify your email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "already" && (
              <AlertCircle className="h-16 w-16 text-blue-500" />
            )}
            {status === "failed" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          {status === "success" && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You can now sign in to your account and start using TinyStickyAds.
              </p>
              <Link to="/auth">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
            </div>
          )}

          {status === "already" && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your email was previously verified. You can sign in to your account.
              </p>
              <Link to="/auth">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                The verification link may have expired or is invalid. Please request a new verification email.
              </p>
              <Link to="/auth">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
