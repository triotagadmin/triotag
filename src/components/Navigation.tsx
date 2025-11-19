import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="Tiny Sticky Ads Logo" className="w-8 h-8" />
          <span className="font-bold text-xl">Tiny Sticky Ads</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost">Buy</Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost">Sell</Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline">Log In</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
