import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <Navigation />
      <section className="flex-1 flex items-center justify-center py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-green-500" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/30 mb-4">
            Coming Soon
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Under Construction</h1>
          <p className="text-zinc-400 text-lg mb-8">
            We're building something great here. Check back soon — or get in touch if you can't wait.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
