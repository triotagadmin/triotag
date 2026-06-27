import { useState, useEffect } from "react";
import { Bell, Check, MoreHorizontal, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  onReportIssue?: (notificationId: string) => void;
}

export const NotificationBell = ({ onReportIssue }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read when dropdown opens
  const handleDropdownOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && userId) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        try {
          await supabase
            .from("notifications")
            .update({ read: true })
            .in("id", unreadIds);

          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
          console.error("Error marking all as read:", error);
        }
      }
    }
  };

  const markAsUnread = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase
        .from("notifications")
        .update({ read: false })
        .eq("id", notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      toast({ title: "Marked as unread" });
    } catch (error) {
      console.error("Error marking as unread:", error);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({ title: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleReportIssue = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReportIssue) {
      onReportIssue(notification.id);
    } else {
      // Navigate to messages with context
      navigate(`/messages?report=${notification.id}`);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Close dropdown first, then navigate after a tick
    setIsOpen(false);
    
    setTimeout(() => {
      // Navigate based on notification type
      if (notification.type === "order_approved") {
        navigate("/retailer-dashboard");
      } else if (notification.type === "payment_received") {
        navigate("/venue-publishers");
      } else if (notification.type === "ad_request_received") {
        navigate("/publisher/ad-requests");
      } else if (notification.type === "ad_request_approved" || notification.type === "ad_request_rejected") {
        navigate("/retailer-dashboard");
      } else if (notification.type === "new_print_order") {
        navigate("/admin/orders");
      } else if (notification.type === "booking_approved" || notification.type === "booking_rejected") {
        navigate("/retailer-dashboard");
      } else if (notification.type === "payment_required" || notification.type === "payment_reminder") {
        navigate("/retailer-dashboard");
      }
    }, 100);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!userId) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 mr-2 ${
                    !notification.read ? "bg-primary" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => markAsUnread(notification.id, e)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Mark as Unread
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => deleteNotification(notification.id, e)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => handleReportIssue(notification, e)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue to Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
