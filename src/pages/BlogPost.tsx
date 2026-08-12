import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface BlogPostData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  created_at: string;
  updated_at?: string | null;
  read_time: string;
  category: string;
  image_url: string | null;
  social_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  image_alt_text?: string | null;
  canonical_url?: string | null;
  slug?: string | null;
}


const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBlogPost();
    }
  }, [id]);

  // Inject Article JSON-LD schema into <head> for the live post
  useEffect(() => {
    if (!post) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-blog-schema", "true");
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.image_url || undefined,
      author: { "@type": "Person", name: post.author },
      datePublished: post.created_at,
    });
    document.head.appendChild(script);

    const prevTitle = document.title;
    document.title = post.meta_title || post.title;

    const created: Element[] = [];
    const prevContent = new Map<Element, string | null>();
    const setMeta = (property: string, content: string) => {
      let el =
        document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property.startsWith("og:") ? "property" : "name", property);
        document.head.appendChild(el);
        created.push(el);
      } else if (!prevContent.has(el)) {
        prevContent.set(el, el.getAttribute("content"));
      }
      el.setAttribute("content", content);
    };

    setMeta("og:title", post.meta_title || post.title);
    setMeta("og:description", post.meta_description || post.excerpt || "");
    setMeta("og:url", `https://triotag.com/insights/${post.id}`);
    setMeta("og:image", post.image_url || "");

    return () => {
      script.remove();
      document.title = prevTitle;
      created.forEach((el) => el.remove());
      prevContent.forEach((value, el) => {
        if (value === null) el.removeAttribute("content");
        else el.setAttribute("content", value);
      });
    };
  }, [post]);


  const loadBlogPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .eq("status", "published")
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Blog post not found");
        navigate("/insights");
        return;
      }

      setPost(data);
    } catch (error: any) {
      console.error("Error loading blog post:", error);
      toast.error("Failed to load blog post");
      navigate("/insights");
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

  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    // Convert markdown headings
    let html = content
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      // Convert bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Convert line breaks to paragraphs
      .split('\n\n')
      .map(para => para.trim() ? `<p class="mb-4 leading-relaxed">${para}</p>` : '')
      .join('');

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading blog post...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Button onClick={() => navigate("/insights")}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Insights
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Image */}
      {post.image_url && (
        <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
          <img
            src={post.image_url}
            alt={post.image_alt_text || post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/insights")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Insights
        </Button>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge>{post.category}</Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.read_time}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-b py-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t">
          <Button onClick={() => navigate("/insights")}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Insights
          </Button>
        </footer>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
