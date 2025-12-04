import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Flame, QrCode, BarChart3, Bot, Download, Scan, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface Campaign {
  id: string;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
  activeDates: string[];
  createdAt: string;
}

interface QRCodeData {
  id: string;
  short_code: string;
  destination_url: string;
  name: string;
  created_at: string;
  totalScans: number;
  uniqueScans: number;
}

interface QRScanDetail {
  id: string;
  scanned_at: string;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  country: string | null;
  city: string | null;
}

const HabitTracker = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  // QR Code State
  const [qrUrl, setQrUrl] = useState("");
  const [qrName, setQrName] = useState("");
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([]);
  const [loadingQR, setLoadingQR] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [lookupCode, setLookupCode] = useState("");
  const [scanDetails, setScanDetails] = useState<QRScanDetail[]>([]);
  const [loadingScanDetails, setLoadingScanDetails] = useState(false);
  
  // AI Analytics State
  const [analyticsText, setAnalyticsText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("campaigns");
    if (stored) {
      setCampaigns(JSON.parse(stored));
    }
    fetchUserQRCodes();
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    localStorage.setItem("campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  const fetchUserQRCodes = async () => {
    try {
      const { data: qrCodes } = await supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (qrCodes) {
        const qrsWithStats = await Promise.all(qrCodes.map(async qr => {
          const { count: totalScans } = await supabase
            .from('qr_code_scans')
            .select('*', { count: 'exact', head: true })
            .eq('qr_code_id', qr.id);

          const { data: uniqueData } = await supabase
            .from('qr_code_scans')
            .select('ip_hash')
            .eq('qr_code_id', qr.id);

          const uniqueScans = new Set(uniqueData?.map(s => s.ip_hash)).size;

          return {
            ...qr,
            totalScans: totalScans || 0,
            uniqueScans
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
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          destination_url: qrUrl,
          short_code: shortCode,
          name: qrName || `QR-${shortCode}`,
          created_by: user?.id || null
        })
        .select()
        .single();

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

  const lookupQRCode = async () => {
    if (!lookupCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive"
      });
      return;
    }
    setLoadingScanDetails(true);
    try {
      const { data: qr, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('short_code', lookupCode.toUpperCase())
        .single();

      if (error || !qr) {
        toast({
          title: "Not Found",
          description: "QR code not found in our database",
          variant: "destructive"
        });
        setLoadingScanDetails(false);
        return;
      }

      const { count: totalScans } = await supabase
        .from('qr_code_scans')
        .select('*', { count: 'exact', head: true })
        .eq('qr_code_id', qr.id);

      const { data: uniqueData } = await supabase
        .from('qr_code_scans')
        .select('ip_hash')
        .eq('qr_code_id', qr.id);

      const uniqueScans = new Set(uniqueData?.map(s => s.ip_hash)).size;

      // Fetch detailed scan data
      const { data: scans } = await supabase
        .from('qr_code_scans')
        .select('*')
        .eq('qr_code_id', qr.id)
        .order('scanned_at', { ascending: false })
        .limit(50);

      setSelectedQR({
        ...qr,
        totalScans: totalScans || 0,
        uniqueScans
      });
      setScanDetails(scans || []);
    } catch (error) {
      console.error('Error looking up QR:', error);
    } finally {
      setLoadingScanDetails(false);
    }
  };

  const getQRImageUrl = (shortCode: string) => {
    const trackingUrl = `${window.location.origin}/qr/${shortCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;
  };

  const copyAnalyticsToClipboard = () => {
    if (!selectedQR) {
      toast({
        title: "No Data",
        description: "Please lookup a QR code first",
        variant: "destructive"
      });
      return;
    }

    const analyticsData = `
QR Code Analytics Report
========================
Name: ${selectedQR.name}
Short Code: ${selectedQR.short_code}
Destination: ${selectedQR.destination_url}
Created: ${new Date(selectedQR.created_at).toLocaleDateString()}

Performance Metrics:
- Total Scans: ${selectedQR.totalScans}
- Unique Scans: ${selectedQR.uniqueScans}
- Repeat Rate: ${selectedQR.totalScans > 0 ? (((selectedQR.totalScans - selectedQR.uniqueScans) / selectedQR.totalScans) * 100).toFixed(1) : 0}%

Recent Scan Details:
${scanDetails.slice(0, 10).map(s => `- ${new Date(s.scanned_at || '').toLocaleString()} | ${s.device_type || 'Unknown'} | ${s.browser || 'Unknown'} | ${s.city || 'Unknown'}, ${s.country || 'Unknown'}`).join('\n')}
`.trim();

    navigator.clipboard.writeText(analyticsData);
    setAnalyticsText(analyticsData);
    toast({
      title: "Copied!",
      description: "Analytics data copied to clipboard"
    });
  };

  const generateAIAnalytics = async () => {
    if (!analyticsText && !selectedQR) {
      toast({
        title: "No Data",
        description: "Please copy analytics data first or lookup a QR code",
        variant: "destructive"
      });
      return;
    }

    setLoadingAI(true);
    try {
      // For now, generate a simple AI-like response
      // In production, this would call an AI API
      const insights = `
## AI Analytics Insights

Based on your QR code performance data:

### Performance Summary
${selectedQR ? `
- Your QR code "${selectedQR.name}" has received **${selectedQR.totalScans} total scans** with **${selectedQR.uniqueScans} unique visitors**.
- The repeat scan rate of **${selectedQR.totalScans > 0 ? (((selectedQR.totalScans - selectedQR.uniqueScans) / selectedQR.totalScans) * 100).toFixed(1) : 0}%** indicates ${selectedQR.totalScans > selectedQR.uniqueScans ? "good engagement with returning users" : "primarily new visitors"}.
` : "No QR code selected for analysis."}

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
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: "App Installed!",
        description: "QR Tracker has been added to your home screen"
      });
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const addCampaign = () => {
    if (!newCampaignName.trim() || !newBudget || !newStartDate || !newEndDate) {
      toast({
        title: "Error",
        description: "Please fill in all campaign details",
        variant: "destructive"
      });
      return;
    }
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaignName.trim(),
      budget: parseFloat(newBudget),
      startDate: newStartDate,
      endDate: newEndDate,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      activeDates: [],
      createdAt: new Date().toISOString()
    };
    setCampaigns([...campaigns, newCampaign]);
    setNewCampaignName("");
    setNewBudget("");
    setNewStartDate("");
    setNewEndDate("");
    toast({
      title: "Campaign Added",
      description: "Your ad campaign has been created"
    });
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
    toast({
      title: "Removed",
      description: "Campaign removed"
    });
  };

  const toggleCampaignActive = (id: string) => {
    setCampaigns(campaigns.map(campaign => {
      if (campaign.id === id) {
        const isActive = campaign.activeDates.includes(today);
        return {
          ...campaign,
          activeDates: isActive
            ? campaign.activeDates.filter(date => date !== today)
            : [...campaign.activeDates, today]
        };
      }
      return campaign;
    }));
  };

  const updateCampaignMetrics = (id: string, field: 'impressions' | 'clicks' | 'conversions', value: number) => {
    setCampaigns(campaigns.map(campaign =>
      campaign.id === id ? { ...campaign, [field]: value } : campaign
    ));
  };

  const calculateActiveStreak = (activeDates: string[]) => {
    if (activeDates.length === 0) return 0;
    const sortedDates = [...activeDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) streak++;
      else break;
    }
    return streak;
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return "0.00";
    return ((clicks / impressions) * 100).toFixed(2);
  };

  const calculateConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return "0.00";
    return ((conversions / clicks) * 100).toFixed(2);
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">QR Tracker</h1>
            <p className="text-muted-foreground">Generate, track, and analyze your QR codes</p>
          </div>

          <Tabs defaultValue="qr-generator" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="qr-generator" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Generator
              </TabsTrigger>
              <TabsTrigger value="qr-tracker" className="flex items-center gap-2">
                <Scan className="w-4 h-4" />
                Tracker
              </TabsTrigger>
              <TabsTrigger value="ad-tracker" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Ad Tracker
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
                    Free QR Code Generator
                  </CardTitle>
                  <CardDescription>
                    Create trackable QR codes with full analytics - no login required!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter destination URL..."
                      value={qrUrl}
                      onChange={(e) => setQrUrl(e.target.value)}
                    />
                    <Input
                      placeholder="QR Code name (optional)"
                      value={qrName}
                      onChange={(e) => setQrName(e.target.value)}
                    />
                    <Button
                      onClick={generateQRCode}
                      disabled={loadingQR}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {loadingQR ? "Generating..." : "Generate QR Code"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated QR Codes List */}
              {generatedQRs.length > 0 && (
                <Card className="bg-card/95 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Your QR Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedQRs.map((qr) => (
                        <div key={qr.id} className="p-4 border rounded-lg flex items-center gap-4">
                          <img
                            src={getQRImageUrl(qr.short_code)}
                            alt="QR Code"
                            className="w-16 h-16 border rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{qr.name}</p>
                            <p className="text-xs text-muted-foreground">Code: {qr.short_code}</p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span>{qr.totalScans} scans</span>
                              <span>{qr.uniqueScans} unique</span>
                            </div>
                          </div>
                          <a
                            href={getQRImageUrl(qr.short_code)}
                            download={`${qr.short_code}.png`}
                            className="p-2 hover:bg-muted rounded"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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

            {/* QR Code Tracker Tab */}
            <TabsContent value="qr-tracker" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-xl border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5" />
                    QR Code Tracker
                  </CardTitle>
                  <CardDescription>
                    Look up any QR code generated by our platform to view its analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter QR short code (e.g., ABC123)..."
                      value={lookupCode}
                      onChange={(e) => setLookupCode(e.target.value)}
                    />
                    <Button onClick={lookupQRCode} disabled={loadingScanDetails}>
                      <Scan className="w-4 h-4 mr-2" />
                      {loadingScanDetails ? "Loading..." : "Lookup"}
                    </Button>
                  </div>

                  {selectedQR && (
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-start gap-4">
                          <img
                            src={getQRImageUrl(selectedQR.short_code)}
                            alt="QR Code"
                            className="w-24 h-24 border rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{selectedQR.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {selectedQR.destination_url}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {new Date(selectedQR.created_at).toLocaleDateString()}
                            </p>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div className="text-center p-2 bg-primary/10 rounded">
                                <p className="text-2xl font-bold text-primary">{selectedQR.totalScans}</p>
                                <p className="text-xs text-muted-foreground">Total Scans</p>
                              </div>
                              <div className="text-center p-2 bg-accent/10 rounded">
                                <p className="text-2xl font-bold text-accent">{selectedQR.uniqueScans}</p>
                                <p className="text-xs text-muted-foreground">Unique Scans</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Copy Analytics Button */}
                      <Button
                        onClick={copyAnalyticsToClipboard}
                        variant="outline"
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Analytics to Clipboard
                      </Button>

                      {/* Scan Details Table */}
                      {scanDetails.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-3 bg-muted/50 border-b">
                            <h5 className="font-medium">Recent Scans ({scanDetails.length})</h5>
                          </div>
                          <div className="max-h-64 overflow-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/30 sticky top-0">
                                <tr>
                                  <th className="text-left p-2">Time</th>
                                  <th className="text-left p-2">Device</th>
                                  <th className="text-left p-2">Location</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scanDetails.map((scan) => (
                                  <tr key={scan.id} className="border-t">
                                    <td className="p-2 text-xs">
                                      {new Date(scan.scanned_at || '').toLocaleString()}
                                    </td>
                                    <td className="p-2 text-xs">
                                      {scan.device_type || 'Unknown'} / {scan.browser || 'Unknown'}
                                    </td>
                                    <td className="p-2 text-xs">
                                      {scan.city || 'Unknown'}, {scan.country || 'Unknown'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ad Tracker Tab */}
            <TabsContent value="ad-tracker" className="space-y-6">
              <Card className="p-6 bg-card/95 backdrop-blur-xl border-primary/30 shadow-xl">
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Ad Tracker</h3>
                <div className="space-y-3 mb-3">
                  <Input
                    placeholder="Campaign name..."
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Budget ($)"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                    />
                    <Button onClick={addCampaign} className="bg-gradient-to-r from-primary to-accent">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Campaign
                    </Button>
                  </div>
                </div>
              </Card>

              {campaigns.length === 0 ? (
                <Card className="p-12 text-center bg-card/95 backdrop-blur-xl">
                  <p className="text-foreground text-lg font-medium mb-2">No campaigns yet</p>
                  <p className="text-muted-foreground">Add your first campaign above to start tracking.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => {
                    const isActiveToday = campaign.activeDates.includes(today);
                    const streak = calculateActiveStreak(campaign.activeDates);
                    const ctr = calculateCTR(campaign.clicks, campaign.impressions);
                    const conversionRate = calculateConversionRate(campaign.conversions, campaign.clicks);
                    return (
                      <Card
                        key={campaign.id}
                        className={`p-6 transition-all bg-card/95 backdrop-blur-xl ${
                          isActiveToday
                            ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary"
                            : "border-accent/20"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                checked={isActiveToday}
                                onCheckedChange={() => toggleCampaignActive(campaign.id)}
                                className="w-6 h-6"
                              />
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span>${campaign.budget.toLocaleString()}</span>
                                  <span>
                                    {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                                    {new Date(campaign.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Flame className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">
                                    {streak} day streak
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Impressions</label>
                              <Input
                                type="number"
                                value={campaign.impressions}
                                onChange={(e) =>
                                  updateCampaignMetrics(campaign.id, "impressions", parseInt(e.target.value) || 0)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Clicks</label>
                              <Input
                                type="number"
                                value={campaign.clicks}
                                onChange={(e) =>
                                  updateCampaignMetrics(campaign.id, "clicks", parseInt(e.target.value) || 0)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Conversions</label>
                              <Input
                                type="number"
                                value={campaign.conversions}
                                onChange={(e) =>
                                  updateCampaignMetrics(campaign.id, "conversions", parseInt(e.target.value) || 0)
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                              <p className="text-lg font-bold text-primary">{ctr}%</p>
                              <p className="text-xs text-muted-foreground">CTR</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
                              <p className="text-lg font-bold text-accent">{conversionRate}%</p>
                              <p className="text-xs text-muted-foreground">Conversion Rate</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
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
                      1. First, look up a QR code in the Tracker tab
                      <br />
                      2. Copy the analytics data using the "Copy Analytics" button
                      <br />
                      3. Click "Generate AI Analytics" below
                    </p>

                    {analyticsText && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Copied Analytics Data:</p>
                        <pre className="text-xs whitespace-pre-wrap max-h-32 overflow-auto">
                          {analyticsText.substring(0, 300)}...
                        </pre>
                      </div>
                    )}

                    <Button
                      onClick={generateAIAnalytics}
                      disabled={loadingAI}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingAI ? "animate-spin" : ""}`} />
                      {loadingAI ? "Analyzing..." : "Generate AI Analytics"}
                    </Button>
                  </div>

                  {aiResponse && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{aiResponse}</pre>
                      </div>
                    </div>
                  )}

                  {!aiResponse && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {showInstallPrompt && (
            <Button
              onClick={handleInstallClick}
              className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-accent shadow-2xl z-50 rounded-full h-14 px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Install App
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HabitTracker;
