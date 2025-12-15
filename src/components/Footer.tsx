import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { FaTiktok, FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";

export const Footer = () => {
  const socialLinks = [
    {
      icon: Facebook,
      href: "https://facebook.com",
      label: "Facebook",
    },
    {
      icon: Instagram,
      href: "https://instagram.com",
      label: "Instagram",
    },
    {
      icon: BsTwitterX,
      href: "https://x.com",
      label: "X (Twitter)",
      isReactIcon: true,
    },
    {
      icon: Youtube,
      href: "https://youtube.com",
      label: "YouTube",
    },
    {
      icon: FaTiktok,
      href: "https://tiktok.com",
      label: "TikTok",
      isReactIcon: true,
    },
    {
      icon: FaDiscord,
      href: "https://discord.com",
      label: "Discord",
      isReactIcon: true,
    },
    {
      icon: Linkedin,
      href: "https://linkedin.com",
      label: "LinkedIn",
    },
    {
      icon: Mail,
      href: "mailto:contact@tinysticky.ads",
      label: "Email",
    },
  ];

  const footerLinks = {
    advertisers: [
      { label: "Register as an Advertiser", href: "/auth" },
      { label: "Browse Publishers", href: "/publishers" },
      { label: "Marketplace", href: "/explore" },
    ],
    publishers: [
      { label: "Venue Publisher", href: "/auth" },
      { label: "Agent Publisher", href: "/auth" },
      { label: "Digital Publisher", href: "/auth" },
    ],
    company: [
      { label: "About Us", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
    ],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-primary neon-text-glow">
              Tiny Sticky Ads
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The micro-advertising revolution connecting advertisers with
              venues, agents, and digital publishers.
            </p>
          </div>

          {/* Advertisers Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm">
              Advertisers
            </h4>
            <ul className="space-y-3">
              {footerLinks.advertisers.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Publishers Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm">
              Publishers
            </h4>
            <ul className="space-y-3">
              {footerLinks.publishers.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-sm">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Tiny Sticky Ads. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded border border-border bg-muted/30 text-muted-foreground hover:text-primary hover:border-primary hover:neon-glow transition-all duration-300"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
