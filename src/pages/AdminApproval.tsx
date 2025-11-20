import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminApproval() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyAdmin(token);
  }, [searchParams]);

  const verifyAdmin = async (token: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-admin?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.redirected) {
        // Handle redirect response from edge function
        const url = new URL(response.url);
        const verified = url.searchParams.get("verified");
        
        if (verified === "success") {
          setStatus("success");
          setMessage("Admin account has been successfully verified and activated!");
        } else if (verified === "already") {
          setStatus("already");
          setMessage("This admin account has already been verified.");
        } else {
          setStatus("error");
          setMessage("Verification failed. Please contact support.");
        }
      } else if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      } else {
        setStatus("success");
        setMessage("Admin account has been successfully verified and activated!");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("error");
      
      if (error.message.includes("expired")) {
        setMessage("This verification link has expired. Please request a new one.");
      } else if (error.message.includes("Invalid")) {
        setMessage("Invalid verification link. Please check your email for the correct link.");
      } else {
        setMessage(error.message || "Verification failed. Please try again or contact support.");
      }
    }
  };

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
              {status === "loading" && "Verifying Admin Account"}
              {status === "success" && "Verification Successful"}
              {status === "already" && "Already Verified"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {status === "loading" && "Please wait while we verify the admin account..."}
              {message}
            </CardDescription>
          </div>
        </CardHeader>

        {status !== "loading" && (
          <CardContent className="space-y-4">
            {(status === "success" || status === "already") && (
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground text-center">
                  The admin can now log in to their account and access the dashboard.
                </p>
              </div>
            )}

            <Button
              onClick={() => navigate("/")}
              className="w-full"
              variant={status === "error" ? "destructive" : "default"}
            >
              Return to Home
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
