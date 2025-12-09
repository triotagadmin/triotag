import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface NewsletterSubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOPICS = [
  { id: "health", label: "Health" },
  { id: "tech", label: "Tech" },
  { id: "retail", label: "Retail" },
  { id: "beauty", label: "Beauty" },
  { id: "livestream", label: "Livestream Commerce" },
  { id: "deals", label: "General Deals" },
];

export async function subscribeToNewsletter(email: string, topics: string[], name?: string) {
  // Check if email already exists
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    // Update existing subscription
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ topics, name, updated_at: new Date().toISOString() })
      .eq("email", email);
    
    if (error) throw error;
    return { updated: true };
  } else {
    // Insert new subscription
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, name, topics });
    
    if (error) throw error;
    return { updated: false };
  }
}

export function NewsletterSubscribeDialog({ open, onOpenChange }: NewsletterSubscribeDialogProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      checkVerification();
    }
  }, [open]);

  const checkVerification = async () => {
    setIsCheckingVerification(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        setIsVerified(false);
        setIsCheckingVerification(false);
        return;
      }

      // Check publisher verification
      const { data: publisher } = await supabase
        .from("publisher_profiles")
        .select("verified, verification_status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (publisher && (publisher.verified || publisher.verification_status === "approved")) {
        setIsVerified(true);
        setEmail(session.user.email || "");
        setIsCheckingVerification(false);
        return;
      }

      // Check advertiser verification
      const { data: advertiser } = await supabase
        .from("advertiser_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (advertiser && advertiser.status === "approved") {
        setIsVerified(true);
        setEmail(session.user.email || "");
        setIsCheckingVerification(false);
        return;
      }

      setIsVerified(false);
    } catch (error) {
      console.error("Error checking verification:", error);
      setIsVerified(false);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await subscribeToNewsletter(email, selectedTopics, name || undefined);
      
      if (result.updated) {
        toast.success("Your subscription preferences have been updated!");
      } else {
        toast.success("You've been subscribed to our newsletter!");
      }
      
      // Reset form
      setEmail("");
      setName("");
      setSelectedTopics([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast.error(error.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingVerification) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Checking account status...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please log in to subscribe to our newsletter.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => { onOpenChange(false); window.location.href = "/auth"; }}>
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isVerified) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verification Required</DialogTitle>
            <DialogDescription>
              Only verified accounts can subscribe to our newsletter. Please complete your account verification to subscribe.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to Newsletter</DialogTitle>
          <DialogDescription>
            Get the latest micro-advertising trends and insights delivered to your inbox.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newsletter-email">Email *</Label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newsletter-name">Name (optional)</Label>
            <Input
              id="newsletter-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Topics of Interest *</Label>
            <div className="grid grid-cols-2 gap-3">
              {TOPICS.map((topic) => (
                <div key={topic.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={selectedTopics.includes(topic.id)}
                    onCheckedChange={() => handleTopicToggle(topic.id)}
                  />
                  <label
                    htmlFor={`topic-${topic.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {topic.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}