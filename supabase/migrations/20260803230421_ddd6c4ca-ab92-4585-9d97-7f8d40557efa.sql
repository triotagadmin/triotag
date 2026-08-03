ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS focus_keyword text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS image_alt_text text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug) WHERE slug IS NOT NULL;