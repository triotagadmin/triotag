import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileDown, QrCode, Link, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

interface QRAnalytics {
  id: string;
  short_code: string;
  destination_url: string;
  name: string;
  totalScans: number;
  uniqueScans: number;
  deviceStats: { device_type: string; count: number }[];
  browserStats: { browser: string; count: number }[];
  countryStats: { country: string; count: number }[];
  recentScans: { scanned_at: string; city: string; device_type: string }[];
}

export function QRTrackerTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrLink, setQrLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const checkVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use QR Tracker",
        variant: "destructive"
      });
      return false;
    }

    const { data: publisherProfile } = await supabase
      .from('publisher_profiles')
      .select('verified, verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: advertiserProfile } = await supabase
      .from('advertiser_profiles')
      .select('verified, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const verified = 
      publisherProfile?.verified === true || 
      publisherProfile?.verification_status === 'approved' ||
      advertiserProfile?.verified === true || 
      advertiserProfile?.status === 'approved';

    setIsVerified(verified);

    if (!verified) {
      toast({
        title: "Verification Required",
        description: "QR Tracker is only available for verified accounts.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const extractShortCodeFromUrl = (url: string): string | null => {
    // Try to extract short code from various URL patterns
    const patterns = [
      /\/qr\/([A-Z0-9]+)/i,
      /[?&]code=([A-Z0-9]+)/i,
      /^([A-Z0-9]{6})$/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].toUpperCase();
    }

    return null;
  };

  const fetchQRAnalytics = async (shortCode: string) => {
    // Fetch QR code data
    const { data: qrCode, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (error || !qrCode) {
      throw new Error("QR code not found. Please check the code and try again.");
    }

    // Fetch scan statistics
    const { data: scans } = await supabase
      .from('qr_code_scans')
      .select('*')
      .eq('qr_code_id', qrCode.id)
      .order('scanned_at', { ascending: false });

    const totalScans = scans?.length || 0;
    const uniqueIps = new Set(scans?.map(s => s.ip_hash));
    const uniqueScans = uniqueIps.size;

    // Device stats
    const deviceCounts: Record<string, number> = {};
    scans?.forEach(s => {
      const device = s.device_type || 'Unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });
    const deviceStats = Object.entries(deviceCounts).map(([device_type, count]) => ({ device_type, count }));

    // Browser stats
    const browserCounts: Record<string, number> = {};
    scans?.forEach(s => {
      const browser = s.browser || 'Unknown';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });
    const browserStats = Object.entries(browserCounts).map(([browser, count]) => ({ browser, count }));

    // Country stats
    const countryCounts: Record<string, number> = {};
    scans?.forEach(s => {
      const country = s.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const countryStats = Object.entries(countryCounts).map(([country, count]) => ({ country, count }));

    // Recent scans
    const recentScans = (scans || []).slice(0, 10).map(s => ({
      scanned_at: s.scanned_at || '',
      city: s.city || 'Unknown',
      device_type: s.device_type || 'Unknown'
    }));

    return {
      id: qrCode.id,
      short_code: qrCode.short_code,
      destination_url: qrCode.destination_url,
      name: qrCode.name || `QR-${qrCode.short_code}`,
      totalScans,
      uniqueScans,
      deviceStats,
      browserStats,
      countryStats,
      recentScans
    };
  };

  const handleTrackQR = async () => {
    if (!qrLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code link or short code",
        variant: "destructive"
      });
      return;
    }

    const verified = await checkVerification();
    if (!verified) return;

    setIsLoading(true);
    try {
      const shortCode = extractShortCodeFromUrl(qrLink.trim());
      if (!shortCode) {
        throw new Error("Could not extract QR code. Please enter a valid QR link or short code.");
      }

      const data = await fetchQRAnalytics(shortCode);
      setAnalytics(data);
      toast({
        title: "Analytics Loaded",
        description: `Found ${data.totalScans} scans for ${data.name}`
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load QR analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const verified = await checkVerification();
    if (!verified) return;

    // For now, show a message that image QR scanning is coming soon
    toast({
      title: "Feature Coming Soon",
      description: "QR code image scanning will be available soon. Please use the link/code input for now."
    });
  };

  const downloadPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.text("QR Code Analytics Report", pageWidth / 2, 20, { align: "center" });
    
    // QR Info
    doc.setFontSize(12);
    doc.text(`QR Code: ${analytics.name}`, 20, 40);
    doc.text(`Short Code: ${analytics.short_code}`, 20, 48);
    doc.text(`Destination: ${analytics.destination_url}`, 20, 56);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 64);
    
    // Stats
    doc.setFontSize(14);
    doc.text("Performance Summary", 20, 80);
    doc.setFontSize(12);
    doc.text(`Total Scans: ${analytics.totalScans}`, 20, 90);
    doc.text(`Unique Visitors: ${analytics.uniqueScans}`, 20, 98);
    doc.text(`Repeat Rate: ${analytics.totalScans > 0 ? ((analytics.totalScans - analytics.uniqueScans) / analytics.totalScans * 100).toFixed(1) : 0}%`, 20, 106);
    
    // Device breakdown
    if (analytics.deviceStats.length > 0) {
      doc.setFontSize(14);
      doc.text("Device Breakdown", 20, 122);
      doc.setFontSize(12);
      let y = 132;
      analytics.deviceStats.forEach(stat => {
        doc.text(`${stat.device_type}: ${stat.count} scans`, 20, y);
        y += 8;
      });
    }

    // Country breakdown
    if (analytics.countryStats.length > 0) {
      doc.setFontSize(14);
      doc.text("Geographic Distribution", 20, 170);
      doc.setFontSize(12);
      let y = 180;
      analytics.countryStats.slice(0, 5).forEach(stat => {
        doc.text(`${stat.country}: ${stat.count} scans`, 20, y);
        y += 8;
      });
    }

    doc.save(`qr-analytics-${analytics.short_code}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your analytics report has been downloaded"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/95 backdrop-blur-xl border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            QR Code Tracker
          </CardTitle>
          <CardDescription>
            Upload a QR image or enter a QR code link to track its real-time analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link Input */}
          <div className="space-y-2">
            <Label htmlFor="qr-link">QR Code Link or Short Code</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="qr-link"
                  placeholder="Enter QR link or short code (e.g., ABC123)"
                  value={qrLink}
                  onChange={(e) => setQrLink(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleTrackQR} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Or Upload QR Code Image</Label>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload a QR code image</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics Results */}
      {analytics && (
        <Card className="bg-card/95 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{analytics.name}</CardTitle>
              <CardDescription>Code: {analytics.short_code}</CardDescription>
            </div>
            <Button onClick={downloadPDF} variant="outline" size="sm">
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{analytics.totalScans}</p>
                <p className="text-sm text-muted-foreground">Total Scans</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg text-center">
                <p className="text-2xl font-bold">{analytics.uniqueScans}</p>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg text-center">
                <p className="text-2xl font-bold">
                  {analytics.totalScans > 0 
                    ? ((analytics.totalScans - analytics.uniqueScans) / analytics.totalScans * 100).toFixed(1) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Repeat Rate</p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{analytics.deviceStats.length}</p>
                <p className="text-sm text-muted-foreground">Device Types</p>
              </div>
            </div>

            {/* Device Stats */}
            {analytics.deviceStats.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Device Breakdown</h4>
                <div className="space-y-2">
                  {analytics.deviceStats.map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{stat.device_type}</span>
                      <span className="text-sm font-medium">{stat.count} scans</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Country Stats */}
            {analytics.countryStats.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Geographic Distribution</h4>
                <div className="space-y-2">
                  {analytics.countryStats.slice(0, 5).map((stat, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm">{stat.country}</span>
                      <span className="text-sm font-medium">{stat.count} scans</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Scans */}
            {analytics.recentScans.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Scans</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analytics.recentScans.map((scan, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
                      <span>{new Date(scan.scanned_at).toLocaleString()}</span>
                      <span className="text-muted-foreground">{scan.city} • {scan.device_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}