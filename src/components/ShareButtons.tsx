import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

const SHARE_TEXT_SUFFIX = "Check out this ad space on Tiny Sticky Ads!";

const ShareButtons = ({ url, title, description }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = `${title}${description ? ` – ${description}` : ""}. ${SHARE_TEXT_SUFFIX}`;

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: "Listing URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const openShare = (e: React.MouseEvent, shareUrl: string) => {
    e.stopPropagation();
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const platforms = [
    {
      label: "Copy link",
      icon: copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />,
      onClick: copyLink,
    },
    {
      label: "Bluesky",
      icon: <BlueskySvg />,
      onClick: (e: React.MouseEvent) =>
        openShare(e, `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + " " + url)}`),
    },
    {
      label: "Facebook",
      icon: <FacebookSvg />,
      onClick: (e: React.MouseEvent) =>
        openShare(e, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`),
    },
    {
      label: "LinkedIn",
      icon: <LinkedInSvg />,
      onClick: (e: React.MouseEvent) =>
        openShare(e, `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`),
    },
    {
      label: "Threads",
      icon: <ThreadsSvg />,
      onClick: (e: React.MouseEvent) =>
        openShare(e, `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText + " " + url)}`),
    },
    {
      label: "X",
      icon: <XSvg />,
      onClick: (e: React.MouseEvent) =>
        openShare(e, `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`),
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap gap-1">
          {platforms.map((p) => (
            <Button
              key={p.label}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={p.onClick}
              title={p.label}
            >
              {p.icon}
              <span className="hidden sm:inline">{p.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const BlueskySvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.601 3.492 6.158 3.142-4.476.764-8.446 2.614-3.202 9.092C8.971 28.07 11.1 20.24 12 17.2c.9 3.04 2.068 10.532 8.42 5.28 5.245-6.477 1.275-8.328-3.202-9.092 2.557.35 5.373-.515 6.158-3.142.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

const FacebookSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" />
  </svg>
);

const LinkedInSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const ThreadsSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.228 1.33-2.929.812-.616 1.905-.942 3.07-1.003.852-.031 1.653.039 2.393.198-.1-.566-.309-1.015-.617-1.335-.416-.432-1.06-.665-1.859-.682l-.007-.002c-.63 0-1.621.169-2.164.876l-1.69-1.209c.808-1.055 2.17-1.664 3.854-1.664l.01.002c1.293.019 2.362.398 3.18 1.13.907.812 1.422 2 1.487 3.426l.003.084c.497.249.95.553 1.352.912 1.128 1.008 1.834 2.46 1.834 4.31 0 .142-.005.282-.014.421-.173 2.59-1.365 4.63-3.437 5.903C17.865 23.28 15.375 24 12.186 24zm-1.638-8.093c-.662.036-1.178.178-1.538.43-.322.226-.479.527-.455.871.024.345.18.643.462.888.402.349 1.003.518 1.73.485 1.036-.056 1.822-.426 2.337-1.098.34-.445.568-1.01.683-1.688a8.862 8.862 0 00-3.22.112z" />
  </svg>
);

const XSvg = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default ShareButtons;
