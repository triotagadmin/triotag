import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, FileText, Upload, Image, Search, Pencil, Trash2 } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { BlogSeoPanels, slugify } from "@/components/blog/BlogSeoPanels";

export default function AdminBlogSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [publishedDate, setPublishedDate] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    author: "",
    category: "",
    image_url: "",
    read_time: "",
    slug: "",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    focus_keyword: "",
    image_alt_text: ""
  });

  // --- Independent state for the blog post list ---
  type PostRow = {
    id: string;
    title: string;
    author: string | null;
    category: string | null;
    created_at: string;
    status: string | null;
  };
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postSearch, setPostSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, author, category, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPosts((data as PostRow[]) || []);
    } catch (error: any) {
      console.error("Error loading blog posts:", error);
      toast.error("Failed to load blog posts");
    } finally {
      setPostsLoading(false);
    }
  };

  const [showBlogList, setShowBlogList] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const handleShowBlogList = () => {
    setShowBlogList(true);
    if (!postsLoaded) {
      setPostsLoaded(true);
      loadPosts();
    }
  };


  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Blog post deleted");
      setDeleteTarget(null);
      await loadPosts();
    } catch (error: any) {
      console.error("Error deleting blog post:", error);
      toast.error(error.message || "Failed to delete blog post");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPosts = posts.filter((p) =>
    (p.title || "").toLowerCase().includes(postSearch.trim().toLowerCase())
  );

  useEffect(() => {
    if (editId) {
      loadBlogPost(editId);
    }
  }, [editId]);


  const loadBlogPost = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          author: data.author || "",
          category: data.category || "",
          image_url: data.image_url || "",
          read_time: data.read_time || "",
          slug: (data as any).slug || "",
          meta_title: (data as any).meta_title || "",
          meta_description: (data as any).meta_description || "",
          canonical_url: (data as any).canonical_url || "",
          focus_keyword: (data as any).focus_keyword || "",
          image_alt_text: (data as any).image_alt_text || ""
        });
        setPublishedDate(data.created_at || undefined);
        if (data.image_url) {
          setPreviewUrl(data.image_url);
        }

      }
    } catch (error: any) {
      console.error("Error loading blog post:", error);
      toast.error("Failed to load blog post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upload images");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `blog-${Date.now()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("ad-space-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("ad-space-media")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      setPreviewUrl(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.excerpt || !formData.content || !formData.author || !formData.category || !formData.read_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to submit a blog post");
        navigate("/admin");
        return;
      }

      const payload = {
        ...formData,
        slug: formData.slug?.trim() ? slugify(formData.slug) : slugify(formData.title),
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        canonical_url: formData.canonical_url || null,
        focus_keyword: formData.focus_keyword || null,
        image_alt_text: formData.image_alt_text || null,
      };

      if (editId) {
        // Update existing blog post
        const { error } = await supabase
          .from("blog_posts")
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq("id", editId);

        if (error) throw error;

        toast.success("Blog post updated successfully!");
      } else {
        // Create new blog post
        const { error } = await supabase
          .from("blog_posts")
          .insert({
            ...payload,
            published_by: user.id,
            status: "published"
          });

        if (error) throw error;

        toast.success("Blog post published successfully!");
      }

      await loadPosts();
      navigate("/insights");
    } catch (error: any) {
      console.error("Error submitting blog post:", error);
      toast.error(error.message || "Failed to publish blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-4xl flex items-center justify-center">
          <p>Loading blog post...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">All Blog Posts</CardTitle>
            <CardDescription>
              {postsLoading ? "Loading..." : `${posts.length} blog post${posts.length === 1 ? "" : "s"} total`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Search by title"
                className="pl-9"
              />
            </div>

            {postsLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading blog posts...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No blog posts yet — create your first one below
              </p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No posts match your search.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[240px] truncate">{post.title}</TableCell>
                        <TableCell>{post.author || "—"}</TableCell>
                        <TableCell>{post.category || "—"}</TableCell>
                        <TableCell>
                          {post.created_at
                            ? new Date(post.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status || "draft"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/admin/blog-submission?edit=${post.id}`} aria-label="Edit post">
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Delete post"
                              onClick={() => setDeleteTarget(post)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this blog post?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteTarget?.title}" will be permanently removed. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeletePost();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-3xl">
                  {editId ? "Edit Blog Post" : "Submit Blog Post"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {editId ? "Update your existing blog post" : "Create and publish a new blog post for the Insights page"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog post title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the blog post"
                  rows={3}
                  required
                />
              </div>

              {/* Hero Image Upload */}
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {previewUrl || formData.image_url ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl || formData.image_url}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer py-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload a hero image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {isUploading && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Industry Trends"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="read_time">Read Time *</Label>
                <Input
                  id="read_time"
                  value={formData.read_time}
                  onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                  placeholder="e.g., 5 min read"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content * (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full blog post content (you can use Markdown formatting)"
                  rows={15}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can use Markdown syntax for formatting (e.g., ## for headings, ** for bold, * for italic)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex-1"
                >
                  {isSubmitting ? (editId ? "Updating..." : "Publishing...") : (editId ? "Update Blog Post" : "Publish Blog Post")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <BlogSeoPanels
          form={formData}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          currentPostId={editId}
          publishedDate={publishedDate}
        />

      </div>

      <Footer />
    </div>
  );
}
