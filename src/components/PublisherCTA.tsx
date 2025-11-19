import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const PublisherCTA = () => {
  return (
    <section className="py-16 px-6 text-center">
      <div className="container mx-auto">
        <Link to="/auth">
          <Button size="lg" className="text-lg px-8 py-6">
            Sell Ad Space
          </Button>
        </Link>
      </div>
    </section>
  );
};
