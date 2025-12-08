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
import { toast } from "sonner";
import { ArrowLeft, Mail, Users, Send, Loader2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  topics: string[];
  created_at: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Email composition state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubscribers(data || []);
    } catch (error: any) {
      console.error("Error loading subscribers:", error);
      toast.error("Failed to load subscribers");
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

  const getFilteredRecipients = () => {
    if (sendToAll) return subscribers;
    
    return subscribers.filter(sub => 
      sub.topics.some(topic => selectedTopics.includes(topic))
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

    const recipients = getFilteredRecipients();
    if (recipients.length === 0) {
      toast.error("No recipients match the selected criteria");
      return;
    }

    setIsSending(true);

    try {
      // Call edge function to send newsletter
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject,
          message,
          recipients: recipients.map(r => ({ email: r.email, name: r.name }))
        }
      });

      if (error) throw error;

      toast.success(`Newsletter sent to ${recipients.length} subscriber${recipients.length > 1 ? 's' : ''}!`);
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
            <p className="text-muted-foreground">Manage subscribers and send newsletters</p>
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
                Create and send a newsletter to your subscribers
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
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="send-to-all"
                    checked={sendToAll}
                    onCheckedChange={(checked) => setSendToAll(!!checked)}
                  />
                  <label htmlFor="send-to-all" className="text-sm font-medium cursor-pointer">
                    Send to all subscribers
                  </label>
                </div>

                {!sendToAll && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                    {TOPICS.map((topic) => (
                      <div key={topic.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`send-topic-${topic.id}`}
                          checked={selectedTopics.includes(topic.id)}
                          onCheckedChange={() => handleTopicToggle(topic.id)}
                        />
                        <label
                          htmlFor={`send-topic-${topic.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {topic.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Recipients: {getFilteredRecipients().length} subscriber{getFilteredRecipients().length !== 1 ? 's' : ''}
                </p>
                <Button
                  onClick={handleSendNewsletter}
                  disabled={isSending || getFilteredRecipients().length === 0}
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

          {/* Subscribers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Subscribers
                <Badge variant="secondary" className="ml-2">
                  {subscribers.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                All newsletter subscribers and their topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No subscribers yet
                </p>
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}