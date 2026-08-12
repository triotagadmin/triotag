ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS social_image_url text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS social_image_source_url text;