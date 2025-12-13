import { Facebook, Twitter, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { FaTiktok, FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";

export const Footer = () => {
  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/tinysticky", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/tinysticky", label: "Instagram" },
    { icon: BsTwitterX, href: "https://x.com/tinysticky", label: "X (Twitter)", isReactIcon: true },
    { icon: Youtube, href: "https://youtube.com/@tinysticky", label: "YouTube" },
    { icon: FaTiktok, href: "https://tiktok.com/@tinysticky", label: "TikTok", isReactIcon: true },
    { icon: FaDiscord, href: "https://discord.gg/tinysticky", label: "Discord", isReactIcon: true },
    { icon: Linkedin, href: "https://linkedin.com/company/tinysticky", label: "LinkedIn" },
    { icon: Mail, href: "mailto:contact@tinysticky.ads", label: "Email" }
  ];

  const footerLinks = {
    advertisers: [
      { label: "Register as an Advertiser", href: "/auth" },
      { label: "Browse by Publishers", href: "#publishers" },
      { label: "Browse by Locations", href: "#locations" }
    ],
    publishers: [
      { label: "Venue Publisher", href: "/auth" },
      { label: "Agent Publisher", href: "/auth" },
      { label: "Digital Publisher", href: "/auth" }
    ],
    company: [
      { label: "About Us", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" }
    ]
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-6 py-12">
        {/* Value Propositions Section */}
        <div className="mb-12 grid md:grid-cols-3 gap-6">
          <Link 
            to="/auth" 
            className="flex flex-col items-center text-center p-6 bg-background rounded-lg border hover:border-primary transition-colors group"
          >
            <div className="flex gap-3 mb-4">
              <Instagram className="w-6 h-6 text-primary" />
              <FaDiscord className="w-6 h-6 text-primary" />
              <Youtube className="w-6 h-6 text-primary" />
              <BsTwitterX className="w-6 h-6 text-primary" />
              <FaTiktok className="w-6 h-6 text-primary" />
              <Facebook className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              Turn Your Social Media Into Income!
            </h3>
            <p className="text-sm text-muted-foreground">Micro Ads. Massive Reach.</p>
          </Link>

          <Link 
            to="/auth" 
            className="flex flex-col items-center text-center p-6 bg-background rounded-lg border hover:border-primary transition-colors group"
          >
            <div className="text-6xl mb-4">#</div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              Turn Your Stickers Into Income!
            </h3>
            <p className="text-sm text-muted-foreground">Micro Ads. Massive Reach.</p>
          </Link>

          <Link 
            to="/auth" 
            className="flex flex-col items-center text-center p-6 bg-background rounded-lg border hover:border-primary transition-colors group"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              Turn Your Venue Into Income!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Micro Ads. Massive Reach.</p>
            <div className="text-6xl">☕</div>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Tiny Sticky Ads</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The micro-advertising revolution connecting advertisers with venues, agents, and digital publishers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Advertisers</h4>
            <ul className="space-y-2">
              {footerLinks.advertisers.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Publishers</h4>
            <ul className="space-y-2">
              {footerLinks.publishers.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tiny Sticky Ads. All rights reserved.
          </p>
          
          <div className="flex gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                  aria-label={social.label}
                >
                  {social.isReactIcon ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
