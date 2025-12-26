import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewsletterSubscribeDialog } from "@/components/NewsletterSubscribeDialog";
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  read_time: string;
  category: string;
  image_url: string | null;
}
const Insights = () => {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewsletterDialog, setShowNewsletterDialog] = useState(false);
  useEffect(() => {
    loadBlogPosts();
    checkAdminStatus();
  }, []);
  const checkAdminStatus = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user) {
      const {
        data: roles
      } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      setIsAdmin(roles && roles.length > 0);
    }
  };
  const loadBlogPosts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("blog_posts").select("*").eq("status", "published").order("created_at", {
        ascending: false
      });
      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error: any) {
      console.error("Error loading blog posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setIsLoading(false);
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  const handleEditPost = (postId: string) => {
    navigate(`/admin/blog-submission?edit=${postId}`);
  };
  return <div className="min-h-screen">
      <Navigation />
      
      {/* Header Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge className="mb-4">Industry Insights</Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              Micro-Advertising Insights
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover trends, strategies, and success stories in the micro-advertising revolution
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          {isLoading ? <div className="text-center py-12">
              <p className="text-muted-foreground">Loading blog posts...</p>
            </div> : blogPosts.length === 0 ? <div className="text-center py-12">
              <p className="text-muted-foreground">No blog posts available yet.</p>
            </div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {blogPosts.map(post => <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all group">
                  {post.image_url && <div className="aspect-video overflow-hidden">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.read_time}
                      </span>
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.created_at)}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && <Button variant="ghost" size="sm" onClick={() => handleEditPost(post.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>}
                        <Link to={`/insights/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            Read More <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* Coming Soon Section */}
          <div className="mt-16 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Subscribe to our newsletter </CardTitle>
                <CardDescription className="text-base">Subscribe to our newsletter to get the latest micro-advertising placements, case studies, and strategies delivered to your inbox.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" readOnly onClick={() => setShowNewsletterDialog(true)} />
                  <Button onClick={() => setShowNewsletterDialog(true)}>Subscribe</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <NewsletterSubscribeDialog open={showNewsletterDialog} onOpenChange={setShowNewsletterDialog} />

      <Footer />
    </div>;
};
export default Insights;