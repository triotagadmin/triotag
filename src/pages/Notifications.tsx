import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";
import { format } from "date-fns";
import { Navigation } from "@/components/Navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?redirect=/notifications");
        return;
      }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, [navigate]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("notifications").update({ read: true } as any).eq("user_id", session.user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-green-500" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          {items.some((n) => !n.read) && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No notifications yet</Card>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <Card
                key={n.id}
                className={`p-4 cursor-pointer transition-colors ${n.read ? "" : "border-green-500/50 bg-green-500/5"}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{n.title}</h3>
                      {!n.read && <Badge className="bg-green-600 text-white text-[10px]">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
