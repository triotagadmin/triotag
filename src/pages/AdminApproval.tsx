import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminApproval() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"success" | "error" | "already" | "loading">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = searchParams.get("token");
      const verified = searchParams.get("verified");
      
      // If we have a token, call the verify-admin edge function
      if (token) {
        setStatus("loading");
        setMessage("Verifying admin account...");
        
        try {
          // Call the verify-admin edge function with the token
          const response = await fetch(
            `https://jungfmgsxbayxzptvpky.supabase.co/functions/v1/verify-admin?token=${token}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          
          // The edge function will redirect, but if we get a response, handle it
          if (response.redirected) {
            window.location.href = response.url;
          } else if (!response.ok) {
            setStatus("error");
            setMessage("Verification failed: Invalid or expired link. Please request a new verification link.");
          }
        } catch (error) {
          console.error("Verification error:", error);
          setStatus("error");
          setMessage("Verification failed: Unable to connect to verification service. Please try again later.");
        }
      } else if (verified === "success") {
        setStatus("success");
        setMessage("Admin account has been successfully verified and activated! The admin can now log in with their credentials.");
      } else if (verified === "already") {
        setStatus("already");
        setMessage("This admin account has already been verified. The admin can log in with their credentials.");
      } else if (verified === "error") {
        setStatus("error");
        setMessage("Verification failed: Invalid or expired link. Please request a new verification link.");
      } else {
        setStatus("error");
        setMessage("Invalid verification request. Please check your email for the correct link.");
      }
    };
    
    verifyAdmin();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center">
            {status === "loading" && (
              <div className="bg-primary/10 rounded-full w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="bg-green-500/10 rounded-full w-full h-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            )}
            {status === "already" && (
              <div className="bg-blue-500/10 rounded-full w-full h-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            )}
            {status === "error" && (
              <div className="bg-red-500/10 rounded-full w-full h-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold">
              {status === "loading" && "Verifying..."}
              {status === "success" && "Verification Successful"}
              {status === "already" && "Already Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {message}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {(status === "success" || status === "already") && (
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground text-center">
                The admin can now log in to their account and access the dashboard.
              </p>
            </div>
          )}

          {status !== "loading" && (
            <Button
              onClick={() => navigate("/")}
              className="w-full"
              variant={status === "error" ? "destructive" : "default"}
            >
              Return to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
