import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { FaTiktok, FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}
export const Footer = () => {
  const socialLinks = [{
    icon: Facebook,
    href: "https://facebook.com",
    label: "Facebook"
  }, {
    icon: Instagram,
    href: "https://instagram.com",
    label: "Instagram"
  }, {
    icon: BsTwitterX,
    href: "https://x.com",
    label: "X (Twitter)",
    isReactIcon: true
  }, {
    icon: Youtube,
    href: "https://youtube.com",
    label: "YouTube"
  }, {
    icon: FaTiktok,
    href: "https://tiktok.com",
    label: "TikTok",
    isReactIcon: true
  }, {
    icon: FaDiscord,
    href: "https://discord.com",
    label: "Discord",
    isReactIcon: true
  }, {
    icon: Linkedin,
    href: "https://linkedin.com",
    label: "LinkedIn"
  }, {
    icon: Mail,
    href: "mailto:contact@tinysticky.ads",
    label: "Email"
  }];
  const footerLinks = {
    company: [{
      label: "About Us",
      href: "https://sites.google.com/view/stickymedia",
      external: true
    }, {
      label: "Contact",
      href: "/contact"
    }, {
      label: "Privacy Policy",
      href: "/privacy"
    }, {
      label: "Terms of Service",
      href: "/terms"
    }]
  };
  return <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand Section */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="font-bold text-lg md:text-xl text-primary neon-text-glow">
              Tiny Sticky Ads
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">We connect advertisers to micro out-of-home ad spaces.</p>
          </div>

          {/* Company Links - Two Columns */}
          <div className="space-y-3 text-center sm:text-left">
            <h4 className="font-semibold text-foreground uppercase tracking-wider text-xs md:text-sm">
              Company
            </h4>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {footerLinks.company.map((link: FooterLink) => <li key={link.label}>
                  {link.external ? <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </a> : <Link to={link.href} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </Link>}
                </li>)}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-4 md:pt-6">
          <div className="flex flex-col items-center gap-3 md:gap-4">
            {/* Social Icons */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
              {socialLinks.map(social => {
              const IconComponent = social.icon;
              return <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded border border-border bg-muted/30 text-muted-foreground hover:text-primary hover:border-primary hover:neon-glow transition-all duration-300" aria-label={social.label}>
                    <IconComponent className="w-3 h-3 md:w-4 md:h-4" />
                  </a>;
            })}
            </div>

            {/* Copyright */}
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Tiny Sticky Ads. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};