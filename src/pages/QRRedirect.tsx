import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const QRRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shortCode) {
      handleRedirect();
    }
  }, [shortCode]);

  const handleRedirect = async () => {
    try {
      // Get QR code info
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('short_code', shortCode?.toUpperCase())
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        setError("QR code not found or inactive");
        return;
      }

      // Get device info
      const userAgent = navigator.userAgent;
      let deviceType = "desktop";
      let browser = "unknown";
      let os = "unknown";

      if (/mobile/i.test(userAgent)) deviceType = "mobile";
      else if (/tablet/i.test(userAgent)) deviceType = "tablet";

      if (/chrome/i.test(userAgent)) browser = "Chrome";
      else if (/firefox/i.test(userAgent)) browser = "Firefox";
      else if (/safari/i.test(userAgent)) browser = "Safari";
      else if (/edge/i.test(userAgent)) browser = "Edge";

      if (/windows/i.test(userAgent)) os = "Windows";
      else if (/mac/i.test(userAgent)) os = "macOS";
      else if (/linux/i.test(userAgent)) os = "Linux";
      else if (/android/i.test(userAgent)) os = "Android";
      else if (/iphone|ipad/i.test(userAgent)) os = "iOS";

      // Generate a simple hash from user agent for unique tracking
      const ipHash = btoa(userAgent).substring(0, 32);

      // Record the scan
      await supabase
        .from('qr_code_scans')
        .insert({
          qr_code_id: qrCode.id,
          device_type: deviceType,
          browser: browser,
          operating_system: os,
          user_agent: userAgent,
          ip_hash: ipHash,
          referrer: document.referrer || null
        });

      // Redirect to destination
      window.location.href = qrCode.destination_url;
    } catch (err) {
      console.error("Error processing QR redirect:", err);
      setError("An error occurred while processing the QR code");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a href="/" className="text-primary hover:underline">
            Return to homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default QRRedirect;
