import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight } from "lucide-react";

interface MessagesCardProps {
  userId: string;
}

export const MessagesCard = ({ userId }: MessagesCardProps) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [recentSenders, setRecentSenders] = useState<string[]>([]);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false);

      const { data: recent } = await supabase
        .from("messages")
        .select("sender_id, subject, read")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      const { count: total } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", userId);

      setUnreadCount(unread ?? 0);
      setTotalCount(total ?? 0);
    };
    fetchCounts();

    // Real-time subscription for new messages
    const channel = supabase
      .channel("publisher-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` },
        () => fetchCounts()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Messages
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground ml-2">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>{totalCount} total messages in your inbox</CardDescription>
          </div>
          <Button onClick={() => navigate("/messages")}>
            Open Inbox <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0
            ? `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}. Open your inbox to view and reply.`
            : "You're all caught up! No unread messages."}
        </p>
      </CardContent>
    </Card>
  );
};
