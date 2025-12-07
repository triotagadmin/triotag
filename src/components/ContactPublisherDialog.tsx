import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";

interface ContactPublisherDialogProps {
  publisherUserId: string;
  publisherName: string;
  listingId: string;
  listingType: string;
  listingTitle: string;
  children?: React.ReactNode;
}

export const ContactPublisherDialog = ({
  publisherUserId,
  publisherName,
  listingId,
  listingType,
  listingTitle,
  children
}: ContactPublisherDialogProps) => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Inquiry about: ${listingTitle}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSend = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages.",
      });
      navigate("/auth");
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: session.user.id,
          recipient_id: publisherUserId,
          subject,
          content: message,
          listing_id: listingId,
          listing_type: listingType,
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${publisherName}.`,
      });

      setMessage("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button className="w-full">Contact Publisher</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {publisherName}</DialogTitle>
          <DialogDescription>
            Send a message about "{listingTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={5}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
