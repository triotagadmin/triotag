import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Bot, Download, RefreshCw, ScanLine, MapPin, ChevronDown, ChevronUp, Monitor, Smartphone, Tablet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { QRTrackerTab } from "@/components/QRTrackerTab";
interface ScanData {
  ip_hash: string | null;
  city: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  scanned_at: string | null;
}
interface QRCodeData {
  id: string;
  short_code: string;
  destination_url: string;
  name: string;
  created_at: string;
  totalScans: number;
  uniqueScans: number;
  scans: ScanData[];
}
const HabitTracker = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const {
    toast
  } = useToast();

  // QR Code State
  const [qrUrl, setQrUrl] = useState("");
  const [qrName, setQrName] = useState("");
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([]);
  const [loadingQR, setLoadingQR] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  // AI Analytics State
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  useEffect(() => {
    fetchUserQRCodes();
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  const fetchUserQRCodes = async () => {
    try {
      const {
        data: qrCodes
      } = await supabase.from('qr_codes').select('*').order('created_at', {
        ascending: false
      }).limit(10);
      if (qrCodes) {
        const qrsWithStats = await Promise.all(qrCodes.map(async qr => {
          const {
            count: totalScans
          } = await supabase.from('qr_code_scans').select('*', {
            count: 'exact',
            head: true
          }).eq('qr_code_id', qr.id);
          const {
            data: scanData
          } = await supabase.from('qr_code_scans').select('ip_hash, city, country, device_type, browser, operating_system, scanned_at').eq('qr_code_id', qr.id).order('scanned_at', { ascending: false });
          const uniqueScans = new Set(scanData?.map(s => s.ip_hash)).size;
          return {
            ...qr,
            totalScans: totalScans || 0,
            uniqueScans,
            scans: scanData || []
          };
        }));
        setGeneratedQRs(qrsWithStats);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  };
  const generateQRCode = async () => {
    if (!qrUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive"
      });
      return;
    }
    setLoadingQR(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Check if user is verified
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate QR codes",
          variant: "destructive"
        });
        setLoadingQR(false);
        return;
      }

      // Check if user is a verified advertiser or admin (publishers excluded)
      const { data: advertiserProfile } = await supabase
        .from('advertiser_profiles')
        .select('verified, status')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const isAllowed =
        advertiserProfile?.verified === true ||
        advertiserProfile?.status === 'approved' ||
        !!userRole;

      if (!isAllowed) {
        toast({
          title: "Access Restricted",
          description: "QR code generation is only available for verified advertiser and admin accounts.",
          variant: "destructive"
        });
        setLoadingQR(false);
        return;
      }
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const {
        data,
        error
      } = await supabase.from('qr_codes').insert({
        destination_url: qrUrl,
        short_code: shortCode,
        name: qrName || `QR-${shortCode}`,
        created_by: user.id
      }).select().single();
      if (error) throw error;
      toast({
        title: "QR Code Generated!",
        description: `Code: ${shortCode}`
      });
      setQrUrl("");
      setQrName("");
      fetchUserQRCodes();
    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingQR(false);
    }
  };
  const getQRImageUrl = (shortCode: string) => {
    const trackingUrl = `${window.location.origin}/qr/${shortCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;
  };
  const generateAIAnalytics = async () => {
    if (generatedQRs.length === 0 && !selectedQR) {
      toast({
        title: "No Data",
        description: "Please generate a QR code first to analyze",
        variant: "destructive"
      });
      return;
    }

    // Use selected QR or the first generated QR
    const qrToAnalyze = selectedQR || generatedQRs[0];
    setLoadingAI(true);
    try {
      // For now, generate a simple AI-like response
      // In production, this would call an AI API
      const insights = `
## AI Analytics Insights

Based on your QR code performance data:

### Performance Summary
${qrToAnalyze ? `
- Your QR code "${qrToAnalyze.name}" has received **${qrToAnalyze.totalScans} total scans** with **${qrToAnalyze.uniqueScans} unique visitors**.
- The repeat scan rate of **${qrToAnalyze.totalScans > 0 ? ((qrToAnalyze.totalScans - qrToAnalyze.uniqueScans) / qrToAnalyze.totalScans * 100).toFixed(1) : 0}%** indicates ${qrToAnalyze.totalScans > qrToAnalyze.uniqueScans ? "good engagement with returning users" : "primarily new visitors"}.
` : "No QR code available for analysis."}

### Recommendations
1. **Increase Visibility**: Place QR codes at eye level in high-traffic areas
2. **Add Call-to-Action**: Include compelling text near your QR code
3. **Track Time Patterns**: Monitor when scans peak to optimize placement timing
4. **A/B Testing**: Create multiple QR codes with different destinations to test effectiveness

### Advertising Opportunities
Based on your scan patterns, consider:
- **Venue Partnerships**: Partner with cafes or restaurants for table tent ads
- **Event Sponsorships**: Place QR codes at local events for brand awareness
- **Digital Integration**: Link QR codes to exclusive online content or discounts
      `.trim();
      setAiResponse(insights);
      toast({
        title: "Analysis Complete",
        description: "AI analytics generated successfully"
      });
    } catch (error) {
      console.error('Error generating AI analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI analytics",
        variant: "destructive"
      });
    } finally {
      setLoadingAI(false);
    }
  };
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const {
      outcome
    } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: "App Installed!",
        description: "QR Tracker has been added to your home screen"
      });
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };
  return <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Apps</h1>
            <p className="text-muted-foreground">Generate, track, and analyze your QR codes</p>
          </div>

          <Tabs defaultValue="qr-generator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="qr-generator" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Generator
              </TabsTrigger>
              <TabsTrigger value="qr-tracker" className="flex items-center gap-2">
                <ScanLine className="w-4 h-4" />
                QR Tracker
              </TabsTrigger>
              <TabsTrigger value="ai-analytics" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Analytics
              </TabsTrigger>
            </TabsList>

            {/* QR Code Generator Tab */}
            <TabsContent value="qr-generator" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-xl border-primary/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-6 h-6 text-primary" />
                    QR Code Generator
                  </CardTitle>
                  <CardDescription>
                    Create trackable QR codes with full analytics - available for verified accounts only
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input placeholder="Enter destination URL..." value={qrUrl} onChange={e => setQrUrl(e.target.value)} />
                    <Input placeholder="QR Code name (optional)" value={qrName} onChange={e => setQrName(e.target.value)} />
                    <Button onClick={generateQRCode} disabled={loadingQR} className="w-full bg-gradient-to-r from-primary to-accent">
                      <QrCode className="w-4 h-4 mr-2" />
                      {loadingQR ? "Generating..." : "Generate QR Code"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated QR Codes List */}
              {generatedQRs.length > 0 && <Card className="bg-card/95 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Your QR Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {generatedQRs.map(qr => <div key={qr.id} className="border rounded-lg overflow-hidden">
                          <div className="p-4 flex items-center gap-4">
                            <img src={getQRImageUrl(qr.short_code)} alt="QR Code" className="w-16 h-16 border rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{qr.name || "Unnamed QR"}</p>
                              <a href={qr.destination_url.startsWith('http') ? qr.destination_url : `https://${qr.destination_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{qr.destination_url}</a>
                              <p className="text-xs text-muted-foreground">Code: {qr.short_code}</p>
                              <div className="flex gap-4 mt-1 text-sm">
                                <span>{qr.totalScans} scans</span>
                                
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={getQRImageUrl(qr.short_code)} download={`${qr.short_code}.png`} className="p-2 hover:bg-muted rounded">
                                <Download className="w-4 h-4" />
                              </a>
                              {qr.scans.length > 0 && (
                                <button onClick={() => setExpandedQR(expandedQR === qr.id ? null : qr.id)} className="p-2 hover:bg-muted rounded">
                                  {expandedQR === qr.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                          {expandedQR === qr.id && qr.scans.length > 0 && (
                            <div className="border-t bg-muted/30 p-4">
                              <p className="text-sm font-medium mb-3">Scan History</p>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {qr.scans.map((scan, idx) => (
                                  <div key={idx} className="flex items-start gap-3 text-xs p-2 bg-background rounded border">
                                    <div className="mt-0.5">
                                      {scan.device_type === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-muted-foreground" /> : scan.device_type === 'tablet' ? <Tablet className="w-3.5 h-3.5 text-muted-foreground" /> : <Monitor className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 text-primary" />
                                        <span className="font-medium">
                                          {scan.city && scan.country ? `${scan.city}, ${scan.country}` : scan.country || scan.city || 'Unknown location'}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground">
                                        {scan.browser || 'Unknown'} · {scan.operating_system || 'Unknown'} · {scan.device_type || 'Unknown'}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : 'Unknown time'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>)}
                    </div>
                  </CardContent>
                </Card>}

              {/* Masahiro Hara Tribute */}
              <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Tribute to Masahiro Hara</CardTitle>
                  <CardDescription>Father of the QR Code</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    In 1994, <strong className="text-foreground">Masahiro Hara</strong>, an engineer at Denso Wave (a subsidiary of Toyota), invented the QR Code while seeking a faster way to track automotive parts during manufacturing.
                  </p>
                  <p>
                    Unlike traditional barcodes that could only store about 20 characters, Hara's QR Code could store over 7,000 characters. The "Quick Response" code was designed to be scanned at high speed from any direction.
                  </p>
                  <p>
                    What makes Hara's contribution extraordinary is that Denso Wave chose not to exercise their patent rights, making QR codes freely available to everyone. This decision transformed QR codes from an industrial tool into a global phenomenon used by billions daily.
                  </p>
                  <p className="italic border-l-2 border-primary pl-4">
                    "I wanted to create a code that was easy for machines to read, but the biggest thing was making it accessible to everyone." — Masahiro Hara
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Tracker Tab */}
            <TabsContent value="qr-tracker" className="space-y-6">
              <QRTrackerTab />
            </TabsContent>

            {/* AI Analytics Tab */}
            <TabsContent value="ai-analytics" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-xl border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-primary" />
                    AI Analytics
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered insights from your QR code analytics data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Generate AI-powered insights from your QR code performance data. Select a QR code from the Generator tab to analyze its performance.
                    </p>

                    <Button onClick={generateAIAnalytics} disabled={loadingAI} className="w-full bg-gradient-to-r from-primary to-accent">
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingAI ? "animate-spin" : ""}`} />
                      {loadingAI ? "Analyzing..." : "Generate AI Analytics"}
                    </Button>
                  </div>

                  {aiResponse && <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{aiResponse}</pre>
                      </div>
                    </div>}

                  {!aiResponse && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 border-dashed">
                        <h5 className="font-medium mb-2">Performance Analysis</h5>
                        <p className="text-xs text-muted-foreground">
                          AI will identify your best-performing campaigns and QR codes
                        </p>
                      </Card>
                      <Card className="p-4 border-dashed">
                        <h5 className="font-medium mb-2">Audience Insights</h5>
                        <p className="text-xs text-muted-foreground">
                          Understand who's scanning your QR codes and when
                        </p>
                      </Card>
                      <Card className="p-4 border-dashed">
                        <h5 className="font-medium mb-2">Growth Suggestions</h5>
                        <p className="text-xs text-muted-foreground">
                          Get recommendations for new advertising opportunities
                        </p>
                      </Card>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {showInstallPrompt && <Button onClick={handleInstallClick} className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-accent shadow-2xl z-50 rounded-full h-14 px-6">
              <Plus className="w-5 h-5 mr-2" />
              Install App
            </Button>}
        </div>
      </div>
      <Footer />
    </>;
};
export default HabitTracker;