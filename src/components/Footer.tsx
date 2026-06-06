import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Youtube, TrendingUp } from "lucide-react";
import { BRAND_NAME, BRAND_DESCRIPTION } from "@/lib/brand";

const linkCol = (title: string, links: { label: string; href: string; external?: boolean }[]) => (
  <div>
    <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">{title}</h4>
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.label}>
          {l.external ? (
            <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-green-500 transition-colors">
              {l.label}
            </a>
          ) : (
            <Link to={l.href} className="text-sm text-zinc-400 hover:text-green-500 transition-colors">
              {l.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 text-white">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-xl font-bold text-white">{BRAND_NAME}</span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">{BRAND_DESCRIPTION}</p>
          </div>

          {linkCol("Platform", [
            { label: "For Retailers", href: "/list-space" },
            { label: "For Retailers", href: "/campaign-submit" },
            { label: "Inventory Formats", href: "/explore" },
            { label: "Resources", href: "/insights" },
          ])}

          {linkCol("Company", [
            { label: "About Us", href: "https://sites.google.com/view/stickymedia", external: true },
            { label: "Careers", href: "/careers" },
            { label: "News & Press", href: "/insights" },
            { label: "Contact Us", href: "/contact" },
          ])}

          {linkCol("Legal", [
            { label: "Terms of Service", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Cookie Policy", href: "/privacy" },
          ])}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {[
              { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
              { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
              { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
              { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:text-green-500 hover:border-green-500/50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
