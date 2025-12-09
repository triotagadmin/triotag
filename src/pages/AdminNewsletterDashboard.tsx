import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Mail, Users, Send, Loader2, CheckCircle } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  topics: string[];
  created_at: string;
}

interface VerifiedAccount {
  id: string;
  email: string;
  name: string;
  type: "advertiser" | "venue" | "digital" | "agent";
}

const TOPICS = [
  { id: "health", label: "Health" },
  { id: "tech", label: "Tech" },
  { id: "retail", label: "Retail" },
  { id: "beauty", label: "Beauty" },
  { id: "livestream", label: "Livestream Commerce" },
  { id: "deals", label: "General Deals" },
];

export default function AdminNewsletterDashboard() {
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [verifiedAccounts, setVerifiedAccounts] = useState<VerifiedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("verified");
  
  // Email composition state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>(["advertiser", "venue", "digital", "agent"]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load newsletter subscribers
      const { data: subsData } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      setSubscribers(subsData || []);

      // Load verified advertisers
      const { data: advertisers } = await supabase
        .from("advertiser_profiles")
        .select("id, contact_email, company_name")
        .eq("status", "approved");

      // Load verified publishers
      const { data: publishers } = await supabase
        .from("publisher_profiles")
        .select("id, contact_email, business_name, publisher_type")
        .eq("verification_status", "approved");

      const accounts: VerifiedAccount[] = [
        ...(advertisers || []).map(a => ({
          id: a.id,
          email: a.contact_email,
          name: a.company_name,
          type: "advertiser" as const
        })),
        ...(publishers || []).map(p => ({
          id: p.id,
          email: p.contact_email,
          name: p.business_name,
          type: p.publisher_type as "venue" | "digital" | "agent"
        }))
      ];

      setVerifiedAccounts(accounts);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const handleAccountTypeToggle = (type: string) => {
    setSelectedAccountTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getFilteredSubscribers = () => {
    if (sendToAll) return subscribers;
    return subscribers.filter(sub => 
      sub.topics.some(topic => selectedTopics.includes(topic))
    );
  };

  const getFilteredVerifiedAccounts = () => {
    if (sendToAll) return verifiedAccounts;
    return verifiedAccounts.filter(acc => 
      selectedAccountTypes.includes(acc.type)
    );
  };

  const handleSendNewsletter = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const recipients = activeTab === "verified" 
      ? getFilteredVerifiedAccounts().map(a => ({ email: a.email, name: a.name }))
      : getFilteredSubscribers().map(s => ({ email: s.email, name: s.name }));

    if (recipients.length === 0) {
      toast.error("No recipients match the selected criteria");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject,
          message,
          recipients
        }
      });

      if (error) throw error;

      toast.success(`Newsletter sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}!`);
      setSubject("");
      setMessage("");
      setSelectedTopics([]);
      setSendToAll(true);
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      toast.error(error.message || "Failed to send newsletter");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "advertiser": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "venue": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "digital": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "agent": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Mail className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Newsletter Dashboard</h1>
            <p className="text-muted-foreground">Send newsletters to verified accounts and subscribers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compose Newsletter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Compose Newsletter
              </CardTitle>
              <CardDescription>
                Create and send a newsletter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Newsletter subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your newsletter content here..."
                  rows={8}
                />
              </div>

              <div className="space-y-3">
                <Label>Audience</Label>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="verified">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verified Accounts
                    </TabsTrigger>
                    <TabsTrigger value="subscribers">
                      <Users className="w-4 h-4 mr-2" />
                      Subscribers
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="send-to-all"
                    checked={sendToAll}
                    onCheckedChange={(checked) => setSendToAll(!!checked)}
                  />
                  <label htmlFor="send-to-all" className="text-sm font-medium cursor-pointer">
                    Send to all {activeTab === "verified" ? "verified accounts" : "subscribers"}
                  </label>
                </div>

                {!sendToAll && activeTab === "verified" && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                    {["advertiser", "venue", "digital", "agent"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedAccountTypes.includes(type)}
                          onCheckedChange={() => handleAccountTypeToggle(type)}
                        />
                        <label htmlFor={`type-${type}`} className="text-sm cursor-pointer capitalize">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {!sendToAll && activeTab === "subscribers" && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                    {TOPICS.map((topic) => (
                      <div key={topic.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`send-topic-${topic.id}`}
                          checked={selectedTopics.includes(topic.id)}
                          onCheckedChange={() => handleTopicToggle(topic.id)}
                        />
                        <label htmlFor={`send-topic-${topic.id}`} className="text-sm cursor-pointer">
                          {topic.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Recipients: {activeTab === "verified" 
                    ? getFilteredVerifiedAccounts().length 
                    : getFilteredSubscribers().length} {activeTab === "verified" ? "account" : "subscriber"}{(activeTab === "verified" ? getFilteredVerifiedAccounts().length : getFilteredSubscribers().length) !== 1 ? 's' : ''}
                </p>
                <Button
                  onClick={handleSendNewsletter}
                  disabled={isSending || (activeTab === "verified" ? getFilteredVerifiedAccounts().length === 0 : getFilteredSubscribers().length === 0)}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Newsletter
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recipients List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {activeTab === "verified" ? "Verified Accounts" : "Subscribers"}
                <Badge variant="secondary" className="ml-2">
                  {activeTab === "verified" ? verifiedAccounts.length : subscribers.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {activeTab === "verified" 
                  ? "All verified advertisers and publishers"
                  : "All newsletter subscribers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeTab === "verified" ? (
                verifiedAccounts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No verified accounts</p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifiedAccounts.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell className="font-medium">{acc.name}</TableCell>
                            <TableCell>{acc.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`capitalize ${getTypeBadgeColor(acc.type)}`}>
                                {acc.type}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                subscribers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No subscribers yet</p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Topics</TableHead>
                          <TableHead>Subscribed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell>{sub.name || "-"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {sub.topics.slice(0, 2).map((topic) => (
                                  <Badge key={topic} variant="outline" className="text-xs">
                                    {TOPICS.find(t => t.id === topic)?.label || topic}
                                  </Badge>
                                ))}
                                {sub.topics.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{sub.topics.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(sub.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}