import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "already">("loading");
  const [verificationType, setVerificationType] = useState<"email" | "listing" | "subscription">("email");

  useEffect(() => {
    const verified = searchParams.get("verified");
    const token = searchParams.get("token");
    const listingVerified = searchParams.get("listing_verified");
    const listingToken = searchParams.get("listing_token");
    const subscriptionVerified = searchParams.get("subscription_verified");
    const subscriptionToken = searchParams.get("subscription_token");

    if (subscriptionVerified) {
      setVerificationType("subscription");
      setStatus(subscriptionVerified as "success" | "failed" | "already");
    } else if (subscriptionToken) {
      setVerificationType("subscription");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      window.location.href = `${supabaseUrl}/functions/v1/verify-venue-subscription?token=${subscriptionToken}`;
    } else if (listingVerified) {
      setVerificationType("listing");
      setStatus(listingVerified as "success" | "failed" | "already");
    } else if (verified) {
      setVerificationType("email");
      setStatus(verified as "success" | "failed" | "already");
    } else if (listingToken) {
      setVerificationType("listing");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      window.location.href = `${supabaseUrl}/functions/v1/verify-email?listing_token=${listingToken}`;
    } else if (token) {
      setVerificationType("email");
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      window.location.href = `${supabaseUrl}/functions/v1/verify-email?token=${token}`;
    }
  }, [searchParams]);

  const titleFor = () => {
    if (status === "loading") {
      if (verificationType === "subscription") return "Verifying Subscription...";
      if (verificationType === "listing") return "Verifying Ownership...";
      return "Verifying Email...";
    }
    if (status === "success") {
      if (verificationType === "subscription") return "Subscribed Successfully!";
      if (verificationType === "listing") return "Ownership Verified!";
      return "Email Verified!";
    }
    if (status === "already") return "Already Verified";
    return "Verification Failed";
  };

  const descFor = () => {
    if (status === "loading") return "Please wait while we verify your request";
    if (status === "success") {
      if (verificationType === "subscription")
        return "Your email has been successfully verified and subscribed. You can now receive advertising campaign invitations from Agent accounts.";
      if (verificationType === "listing") return "This listing is now linked to the advertiser account";
      return "Your email has been successfully verified";
    }
    if (status === "already") return "This verification was already completed.";
    return "We couldn't verify this request";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{titleFor()}</CardTitle>
          <CardDescription>{descFor()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === "loading" && <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>}
            {status === "success" && <CheckCircle2 className="h-16 w-16 text-green-500" />}
            {status === "already" && <AlertCircle className="h-16 w-16 text-blue-500" />}
            {status === "failed" && <XCircle className="h-16 w-16 text-red-500" />}
          </div>

          {(status === "success" || status === "already" || status === "failed") && (
            <div className="text-center space-y-4">
              <Link to="/auth">
                <Button className="w-full">Go to Sign In</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
