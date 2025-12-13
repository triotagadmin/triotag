import { Facebook, Twitter, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { FaTiktok, FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
export const Footer = () => {
  const socialLinks = [{
    icon: Facebook,
    href: "https://facebook.com/tinysticky",
    label: "Facebook"
  }, {
    icon: Instagram,
    href: "https://instagram.com/tinysticky",
    label: "Instagram"
  }, {
    icon: BsTwitterX,
    href: "https://x.com/tinysticky",
    label: "X (Twitter)",
    isReactIcon: true
  }, {
    icon: Youtube,
    href: "https://youtube.com/@tinysticky",
    label: "YouTube"
  }, {
    icon: FaTiktok,
    href: "https://tiktok.com/@tinysticky",
    label: "TikTok",
    isReactIcon: true
  }, {
    icon: FaDiscord,
    href: "https://discord.gg/tinysticky",
    label: "Discord",
    isReactIcon: true
  }, {
    icon: Linkedin,
    href: "https://linkedin.com/company/tinysticky",
    label: "LinkedIn"
  }, {
    icon: Mail,
    href: "mailto:contact@tinysticky.ads",
    label: "Email"
  }];
  const footerLinks = {
    advertisers: [{
      label: "Register as an Advertiser",
      href: "/auth"
    }, {
      label: "Browse by Publishers",
      href: "#publishers"
    }, {
      label: "Browse by Locations",
      href: "#locations"
    }],
    publishers: [{
      label: "Venue Publisher",
      href: "/auth"
    }, {
      label: "Agent Publisher",
      href: "/auth"
    }, {
      label: "Digital Publisher",
      href: "/auth"
    }],
    company: [{
      label: "About Us",
      href: "#about"
    }, {
      label: "Contact",
      href: "#contact"
    }, {
      label: "Privacy Policy",
      href: "#privacy"
    }, {
      label: "Terms of Service",
      href: "#terms"
    }]
  };
  return <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-6 py-12">
        {/* Value Propositions Section */}
        

        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="my-0 py-0 px-0 mx-0">
            <h3 className="font-bold text-lg mb-4">Tiny Sticky Ads</h3>
            <p className="text-sm text-muted-foreground mb-4 mx-0 my-0 px-0 py-0">
              The micro-advertising revolution connecting advertisers with venues, agents, and digital publishers.
            </p>
          </div>

          

          

          <div>
            <h4 className="font-semibold mb-4 text-right">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map(link => <li key={link.label} className="text-right">
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>)}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tiny Sticky Ads. All rights reserved.
          </p>
          
          
        </div>
      </div>
    </footer>;
};