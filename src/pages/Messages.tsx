import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  other_user_name?: string;
  other_user_role?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    fetchConversations();

    // Check for report parameter
    const reportNotificationId = searchParams.get("report");
    if (reportNotificationId) {
      handleReportIssue(reportNotificationId);
    }
  }, [userId, searchParams]);

  useEffect(() => {
    if (!selectedConversation) return;
    fetchMessages(selectedConversation.id);
    markMessagesAsRead(selectedConversation.id);

    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchConversations = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Fetch user info for each conversation
      const conversationsWithNames = await Promise.all(
        (data || []).map(async (conv) => {
          const otherId = conv.participant_1_id === userId 
            ? conv.participant_2_id 
            : conv.participant_1_id;

          // Try to get name from admin_profiles, advertiser_profiles, or publisher_profiles
          let name = "User";
          let role = "";

          const { data: adminProfile } = await supabase
            .from("admin_profiles")
            .select("full_name")
            .eq("user_id", otherId)
            .maybeSingle();

          if (adminProfile) {
            name = adminProfile.full_name || "Admin";
            role = "Admin";
          } else {
            const { data: advertiserProfile } = await supabase
              .from("advertiser_profiles")
              .select("company_name, contact_name")
              .eq("user_id", otherId)
              .maybeSingle();

            if (advertiserProfile) {
              name = advertiserProfile.contact_name || advertiserProfile.company_name || "Advertiser";
              role = "Advertiser";
            } else {
              const { data: publisherProfile } = await supabase
                .from("publisher_profiles")
                .select("business_name")
                .eq("user_id", otherId)
                .maybeSingle();

              if (publisherProfile) {
                name = publisherProfile.business_name || "Publisher";
                role = "Publisher";
              }
            }
          }

          // Get unread count
          const { count } = await supabase
            .from("conversation_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", userId)
            .eq("read", false);

          return {
            ...conv,
            other_user_name: name,
            other_user_role: role,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithNames);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!userId) return;
    try {
      await supabase
        .from("conversation_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleReportIssue = async (notificationId: string) => {
    if (!userId) return;

    try {
      // Find an admin user
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (!adminRole) {
        toast({
          title: "Error",
          description: "No admin available to report to",
          variant: "destructive",
        });
        return;
      }

      const adminUserId = adminRole.user_id;

      // Get notification details
      const { data: notification } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", notificationId)
        .maybeSingle();

      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(participant_1_id.eq.${userId},participant_2_id.eq.${adminUserId}),and(participant_1_id.eq.${adminUserId},participant_2_id.eq.${userId})`
        )
        .maybeSingle();

      let conversationId: string;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            participant_1_id: userId,
            participant_2_id: adminUserId,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Create issue report
      await supabase.from("issue_reports").insert({
        user_id: userId,
        notification_id: notificationId,
        conversation_id: conversationId,
      });

      // Send initial message
      const contextMessage = notification
        ? `[Issue Report]\nNotification: "${notification.title}"\nMessage: ${notification.message}\nTimestamp: ${format(new Date(notification.created_at), "MMM d, yyyy h:mm a")}\n\nDescribe your issue:`
        : "[Issue Report]\n\nI would like to report an issue regarding a notification.";

      await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: contextMessage,
        notification_reference_id: notificationId,
      });

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Refresh and select conversation
      await fetchConversations();
      const conv = conversations.find(c => c.id === conversationId) || {
        id: conversationId,
        participant_1_id: userId,
        participant_2_id: adminUserId,
        last_message_at: new Date().toISOString(),
        other_user_name: "Admin",
        other_user_role: "Admin",
      };
      setSelectedConversation(conv);

      // Clear URL param
      navigate("/messages", { replace: true });

      toast({ title: "Issue reported to admin" });
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId) return;

    setSending(true);
    try {
      await supabase.from("conversation_messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        content: newMessage.trim(),
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const startNewConversationWithAdmin = async () => {
    if (!userId) return;

    try {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (!adminRole) {
        toast({
          title: "Error",
          description: "No admin available",
          variant: "destructive",
        });
        return;
      }

      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(participant_1_id.eq.${userId},participant_2_id.eq.${adminRole.user_id}),and(participant_1_id.eq.${adminRole.user_id},participant_2_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingConv) {
        setSelectedConversation({
          ...existingConv,
          other_user_name: "Admin",
          other_user_role: "Admin",
        });
      } else {
        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert({
            participant_1_id: userId,
            participant_2_id: adminRole.user_id,
          })
          .select()
          .single();

        if (error) throw error;

        setSelectedConversation({
          ...newConv,
          other_user_name: "Admin",
          other_user_role: "Admin",
        });
        await fetchConversations();
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button size="sm" onClick={startNewConversationWithAdmin}>
                  New Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-320px)]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <Button
                      variant="link"
                      className="mt-2"
                      onClick={startNewConversationWithAdmin}
                    >
                      Start a conversation with Admin
                    </Button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{conv.other_user_name}</p>
                          {conv.other_user_role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {conv.other_user_role}
                            </Badge>
                          )}
                        </div>
                        {(conv.unread_count || 0) > 0 && (
                          <Badge className="bg-primary text-primary-foreground">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(conv.last_message_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Panel */}
          <Card className="md:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {selectedConversation.other_user_name}
                    </CardTitle>
                    {selectedConversation.other_user_role && (
                      <Badge variant="outline">
                        {selectedConversation.other_user_role}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-380px)]">
                  <ScrollArea className="flex-1 p-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 flex ${
                          msg.sender_id === userId ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.sender_id === userId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender_id === userId
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
