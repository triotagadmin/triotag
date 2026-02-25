import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, CheckCircle, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface TalentProfile {
  id: string;
  full_name: string;
  location: string;
  skill_type: string;
  bio: string | null;
  portfolio_urls: string[];
  availability: string | null;
  avg_rating?: number;
  review_count?: number;
}

const SKILL_LABELS: Record<string, string> = {
  promoter: "Promoter",
  artist: "Artist",
  creator: "Creator",
};

const HireTalent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [talents, setTalents] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reviews for ratings
      const { data: reviews } = await supabase
        .from("talent_reviews")
        .select("talent_id, rating");

      const ratingMap: Record<string, { total: number; count: number }> = {};
      (reviews || []).forEach((r: any) => {
        if (!ratingMap[r.talent_id]) ratingMap[r.talent_id] = { total: 0, count: 0 };
        ratingMap[r.talent_id].total += r.rating;
        ratingMap[r.talent_id].count += 1;
      });

      const enriched: TalentProfile[] = (profiles || []).map((p: any) => ({
        ...p,
        portfolio_urls: Array.isArray(p.portfolio_urls) ? p.portfolio_urls : [],
        avg_rating: ratingMap[p.id] ? ratingMap[p.id].total / ratingMap[p.id].count : undefined,
        review_count: ratingMap[p.id]?.count || 0,
      }));

      setTalents(enriched);
    } catch (error) {
      console.error("Error fetching talents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === "all"
    ? talents
    : talents.filter((t) => t.skill_type === activeTab);

  const handleBookNow = (talentId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate(`/book-talent/${talentId}`);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Hire Talent</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find promoters, artists, and creators for your next campaign.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="promoter">Promoters</TabsTrigger>
            <TabsTrigger value="artist">Artists</TabsTrigger>
            <TabsTrigger value="creator">Creators</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading talent...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No talent found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((talent) => (
              <Card key={talent.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Portfolio preview */}
                {talent.portfolio_urls.length > 0 && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={talent.portfolio_urls[0]}
                      alt={`${talent.full_name} portfolio`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {talent.full_name}
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {SKILL_LABELS[talent.skill_type] || talent.skill_type}
                        </Badge>
                      </div>
                    </div>
                    {talent.avg_rating !== undefined && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium">{talent.avg_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({talent.review_count})</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{talent.location}</span>
                  </div>
                  {talent.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{talent.bio}</p>
                  )}
                  {talent.availability && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Availability:</strong> {talent.availability}
                    </p>
                  )}
                  {talent.portfolio_urls.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {talent.portfolio_urls.slice(1, 5).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Portfolio ${idx + 2}`}
                          className="h-16 w-16 rounded object-cover flex-shrink-0"
                        />
                      ))}
                      {talent.portfolio_urls.length > 5 && (
                        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          +{talent.portfolio_urls.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                  <Button className="w-full mt-2" onClick={() => handleBookNow(talent.id)}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HireTalent;
