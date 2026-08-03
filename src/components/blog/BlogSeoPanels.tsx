import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Copy,
  Search,
  Gauge,
  Code2,
  BookOpen,
  Files,
  Settings2,
} from "lucide-react";

export interface BlogSeoFields {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image_url: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  focus_keyword: string;
  image_alt_text: string;
}

const SITE_DOMAIN = "tinystickyads.com";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const stripMarkdown = (content: string) =>
  content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countSyllables = (word: string) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
};

function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mt-6">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <CardTitle className="text-lg flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

const counterClass = (len: number, good: number, warn: number) =>
  len === 0 || len > warn
    ? "text-destructive"
    : len > good
      ? "text-amber-500"
      : "text-green-600";

interface Props {
  form: BlogSeoFields;
  onChange: (patch: Partial<BlogSeoFields>) => void;
  currentPostId?: string | null;
  publishedDate?: string;
}

export function BlogSeoPanels({ form, onChange, currentPostId, publishedDate }: Props) {
  /* ---------------- Foundation ---------------- */
  const suggestedSlug = slugify(form.title || "");

  /* ---------------- Analysis helpers ---------------- */
  const plain = useMemo(() => stripMarkdown(form.content || ""), [form.content]);
  const words = useMemo(() => (plain ? plain.split(/\s+/).filter(Boolean) : []), [plain]);
  const sentences = useMemo(
    () => plain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0),
    [plain],
  );
  const keyword = (form.focus_keyword || "").trim().toLowerCase();
  const has = (haystack: string) => !!keyword && haystack.toLowerCase().includes(keyword);

  const links = useMemo(() => {
    const out: string[] = [];
    const re = /\[[^\]]+\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(form.content || ""))) out.push(m[1]);
    return out;
  }, [form.content]);
  const internalLinks = links.filter(
    (u) => u.startsWith("/") || u.startsWith("#") || u.includes(SITE_DOMAIN),
  );
  const externalLinks = links.filter((u) => !internalLinks.includes(u));

  const headings = (form.content || "")
    .split("\n")
    .filter((l) => /^#{1,6}\s/.test(l.trim()));

  const metaTitle = form.meta_title || "";
  const metaDesc = form.meta_description || "";

  const checks = useMemo(() => {
    const first100 = words.slice(0, 100).join(" ");
    const list: { ok: boolean; weight: number; label: string; message: string }[] = [
      {
        ok: metaTitle.length >= 30 && metaTitle.length <= 60,
        weight: 20,
        label: "Meta title length",
        message: metaTitle
          ? `Meta title is ${metaTitle.length} characters — aim for 30–60.`
          : "Meta title is missing — add one between 30 and 60 characters.",
      },
      {
        ok: metaDesc.length >= 120 && metaDesc.length <= 160,
        weight: 20,
        label: "Meta description length",
        message: metaDesc
          ? `Meta description is ${metaDesc.length} characters — aim for 120–160.`
          : "Meta description is missing — add one between 120 and 160 characters.",
      },
      {
        ok: has(form.title || ""),
        weight: 8,
        label: "Keyword in title",
        message: keyword
          ? `Focus keyword not found in the title — add "${form.focus_keyword}".`
          : "Set a focus keyword to enable keyword checks.",
      },
      {
        ok: has(metaTitle),
        weight: 8,
        label: "Keyword in meta title",
        message: keyword
          ? `Focus keyword not found in the meta title — add "${form.focus_keyword}".`
          : "Set a focus keyword to enable keyword checks.",
      },
      {
        ok: has(metaDesc),
        weight: 8,
        label: "Keyword in meta description",
        message: keyword
          ? `Focus keyword not found in meta description — add "${form.focus_keyword}" to improve relevance.`
          : "Set a focus keyword to enable keyword checks.",
      },
      {
        ok: has(first100),
        weight: 8,
        label: "Keyword in first 100 words",
        message: keyword
          ? `Focus keyword not found in the first 100 words — mention "${form.focus_keyword}" early.`
          : "Set a focus keyword to enable keyword checks.",
      },
      {
        ok: headings.some((h) => has(h)),
        weight: 6,
        label: "Keyword in a heading",
        message: keyword
          ? `No heading contains "${form.focus_keyword}" — add it to an ## heading.`
          : "Set a focus keyword to enable keyword checks.",
      },
      {
        ok: words.length >= 300,
        weight: 10,
        label: "Content length",
        message: `Content is ${words.length} words — write at least 300.`,
      },
      {
        ok: !!form.image_url && !!form.image_alt_text,
        weight: 6,
        label: "Image with alt text",
        message: !form.image_url
          ? "No hero image uploaded — add one."
          : "Hero image has no alt text — describe it for accessibility and SEO.",
      },
      {
        ok: internalLinks.length > 0,
        weight: 4,
        label: "Internal link",
        message: "Add at least one internal link, e.g. [related post](/insights).",
      },
      {
        ok: externalLinks.length > 0,
        weight: 4,
        label: "External link",
        message: "Add at least one external link to a credible source.",
      },
      {
        ok: !!form.slug && form.slug.length < 75,
        weight: 8,
        label: "Slug",
        message: !form.slug
          ? "Slug is missing — generate one from the title."
          : "Slug is too long — keep it under 75 characters.",
      },
    ];
    return list;
  }, [form, words, headings, internalLinks, externalLinks, metaTitle, metaDesc, keyword]);

  const score = useMemo(() => {
    const total = checks.reduce((a, c) => a + c.weight, 0);
    const got = checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0);
    return Math.round((got / total) * 100);
  }, [checks]);

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-500" : "text-destructive";
  const scoreRing = score >= 80 ? "border-green-600" : score >= 50 ? "border-amber-500" : "border-destructive";

  /* ---------------- SERP pixel width ---------------- */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [titlePx, setTitlePx] = useState(0);
  const serpTitle = metaTitle || form.title || "Untitled post";
  const serpDesc = metaDesc || form.excerpt || "";
  const serpUrl = `${SITE_DOMAIN}/blog/${form.slug || suggestedSlug || "post-slug"}`;

  useEffect(() => {
    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.font = "20px Arial, sans-serif";
    setTitlePx(Math.round(ctx.measureText(serpTitle).width));
  }, [serpTitle]);

  const DESKTOP_TITLE_PX = 600;
  const MOBILE_TITLE_PX = 400;

  const truncateToPx = (text: string, maxPx: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return text;
    ctx.font = "20px Arial, sans-serif";
    if (ctx.measureText(text).width <= maxPx) return text;
    let out = text;
    while (out.length > 0 && ctx.measureText(out + "…").width > maxPx) out = out.slice(0, -1);
    return out.trimEnd() + "…";
  };

  /* ---------------- Schema ---------------- */
  const schema = useMemo(
    () =>
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: form.title,
          description: metaDesc || form.excerpt,
          image: form.image_url || undefined,
          author: { "@type": "Person", name: form.author },
          datePublished: publishedDate || new Date().toISOString(),
        },
        null,
        2,
      ),
    [form.title, metaDesc, form.excerpt, form.image_url, form.author, publishedDate],
  );

  /* ---------------- Readability ---------------- */
  const readability = useMemo(() => {
    const wordCount = words.length;
    const sentCount = sentences.length || 1;
    const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
    const avgSentence = wordCount / sentCount;
    const avgSyll = wordCount ? syllables / wordCount : 0;
    const grade = 0.39 * avgSentence + 11.8 * avgSyll - 15.59;
    const passive = sentences.filter((s) =>
      /\b(was|were|is|are|been|being)\b\s+\w+(ed|en)\b|\bis being\b|\bwas being\b|\bby\s+the\b/i.test(s),
    ).length;
    return {
      wordCount,
      grade: Math.max(1, Math.round(grade)),
      minutes: Math.max(1, Math.round(wordCount / 200)),
      avgSentence: Math.round(avgSentence * 10) / 10,
      passivePct: Math.round((passive / sentCount) * 100),
    };
  }, [words, sentences]);

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  /* ---------------- Duplicates ---------------- */
  const [dupLoading, setDupLoading] = useState(false);
  const [dupResults, setDupResults] = useState<
    { id: string; title: string; pct: number; reasons: string[] }[] | null
  >(null);

  const normalize = (v: string) =>
    (v || "").toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

  const checkDuplicates = async () => {
    setDupLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, meta_description, content");
      if (error) throw error;
      const mine = sentences.map(normalize).filter((s) => s.length > 20);
      const results = (data || [])
        .filter((p) => p.id !== currentPostId)
        .map((p) => {
          const reasons: string[] = [];
          if (normalize(p.title) === normalize(form.title) && form.title) reasons.push("Identical title");
          if (
            metaDesc &&
            p.meta_description &&
            normalize(p.meta_description) === normalize(metaDesc)
          )
            reasons.push("Identical meta description");
          const theirs = new Set(
            stripMarkdown(p.content || "")
              .split(/[.!?]+/)
              .map((s) => normalize(s))
              .filter((s) => s.length > 20),
          );
          const overlap = mine.length
            ? Math.round((mine.filter((s) => theirs.has(s)).length / mine.length) * 100)
            : 0;
          return { id: p.id, title: p.title as string, pct: overlap, reasons };
        })
        .filter((r) => r.pct > 25 || r.reasons.length > 0)
        .sort((a, b) => b.pct - a.pct);
      setDupResults(results);
    } catch (e: any) {
      toast.error(e.message || "Duplicate check failed");
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <>
      {/* SEO Settings */}
      <CollapsibleCard title="SEO Settings" icon={<Settings2 className="w-5 h-5 text-primary" />} defaultOpen>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => onChange({ slug: e.target.value })}
                placeholder="auto-generated-from-title"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => onChange({ slug: suggestedSlug })}
                disabled={!suggestedSlug}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {SITE_DOMAIN}/blog/{form.slug || suggestedSlug || "your-post-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_title">Meta Title</Label>
              <span className={`text-xs font-medium ${counterClass(metaTitle.length, 60, 70)}`}>
                {metaTitle.length} chars
              </span>
            </div>
            <Input
              id="meta_title"
              value={form.meta_title}
              onChange={(e) => onChange({ meta_title: e.target.value })}
              placeholder="Title shown in search results"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_description">Meta Description</Label>
              <span className={`text-xs font-medium ${counterClass(metaDesc.length, 155, 160)}`}>
                {metaDesc.length} chars
              </span>
            </div>
            <Textarea
              id="meta_description"
              rows={3}
              value={form.meta_description}
              onChange={(e) => onChange({ meta_description: e.target.value })}
              placeholder="Summary shown in search results"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical_url">Canonical URL (optional)</Label>
            <Input
              id="canonical_url"
              value={form.canonical_url}
              onChange={(e) => onChange({ canonical_url: e.target.value })}
              placeholder={`https://${serpUrl}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus_keyword">Focus Keyword</Label>
            <Input
              id="focus_keyword"
              value={form.focus_keyword}
              onChange={(e) => onChange({ focus_keyword: e.target.value })}
              placeholder="e.g., retail media advertising"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_alt_text">Image Alt Text</Label>
            <Input
              id="image_alt_text"
              value={form.image_alt_text}
              onChange={(e) => onChange({ image_alt_text: e.target.value })}
              placeholder="Describe the hero image"
            />
          </div>
        </div>
      </CollapsibleCard>

      {/* Module 1 — SEO Score */}
      <CollapsibleCard title="Live SEO Score" icon={<Gauge className="w-5 h-5 text-primary" />}>
        <div className="flex items-center gap-6 mb-6">
          <div
            className={`w-24 h-24 rounded-full border-8 ${scoreRing} flex items-center justify-center`}
          >
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {score >= 80
              ? "Great — this post is well optimized."
              : score >= 50
                ? "Decent, but several improvements remain."
                : "Needs work — address the warnings below."}
          </p>
        </div>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-sm">
              {c.ok ? (
                <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              )}
              <span className={c.ok ? "text-muted-foreground" : ""}>
                <strong>{c.label}:</strong> {c.ok ? "Passed" : c.message}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      {/* Module 2 — SERP Preview */}
      <CollapsibleCard title="Google SERP Preview" icon={<Search className="w-5 h-5 text-primary" />}>
        <Tabs defaultValue="desktop">
          <TabsList className="mb-4">
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
          <TabsContent value="desktop">
            <div className="rounded-lg border p-4 max-w-[600px] bg-card">
              <div className="text-xs text-green-700 dark:text-green-500 mb-1">{serpUrl}</div>
              <div className="text-[20px] leading-snug text-blue-700 dark:text-blue-400">
                {truncateToPx(serpTitle, DESKTOP_TITLE_PX)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {serpDesc.length > 160 ? serpDesc.slice(0, 157) + "…" : serpDesc}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile">
            <div className="rounded-lg border p-4 max-w-[400px] bg-card">
              <div className="text-xs text-green-700 dark:text-green-500 mb-1">{serpUrl}</div>
              <div className="text-[18px] leading-snug text-blue-700 dark:text-blue-400">
                {truncateToPx(serpTitle, MOBILE_TITLE_PX)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {serpDesc.length > 130 ? serpDesc.slice(0, 127) + "…" : serpDesc}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <p className="text-xs mt-4">
          Measured title width: <strong>{titlePx}px</strong>{" "}
          {titlePx > DESKTOP_TITLE_PX ? (
            <span className="text-destructive">
              — exceeds Google's ~{DESKTOP_TITLE_PX}px desktop limit and will be truncated.
            </span>
          ) : (
            <span className="text-green-600">— fits within Google's desktop limit.</span>
          )}
        </p>
      </CollapsibleCard>

      {/* Module 3 — Schema */}
      <CollapsibleCard title="Schema Generator (JSON-LD)" icon={<Code2 className="w-5 h-5 text-primary" />}>
        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">{schema}</pre>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            navigator.clipboard.writeText(schema);
            toast.success("Schema copied");
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy schema
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This schema is injected automatically into the live blog post page.
        </p>
      </CollapsibleCard>

      {/* Module 4 — Readability */}
      <CollapsibleCard title="Readability Analyzer" icon={<BookOpen className="w-5 h-5 text-primary" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Grade level</p>
            <p className="text-xl font-bold">{ordinal(readability.grade)} grade</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Reading time</p>
            <p className="text-xl font-bold">{readability.minutes} min</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Avg sentence</p>
            <p className="text-xl font-bold">{readability.avgSentence || 0} words</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Passive voice</p>
            <p className="text-xl font-bold">{readability.passivePct}%</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {readability.avgSentence > 25 && (
            <li className="flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              Sentences average over 25 words — break them up for readability.
            </li>
          )}
          {readability.passivePct > 20 && (
            <li className="flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
              {readability.passivePct}% of sentences look passive — aim for under 20%.
            </li>
          )}
          {readability.avgSentence <= 25 && readability.passivePct <= 20 && (
            <li className="flex gap-2 items-start text-muted-foreground">
              <Check className="w-4 h-4 text-green-600 mt-0.5" />
              Sentence length and passive voice are within healthy ranges.
            </li>
          )}
        </ul>
      </CollapsibleCard>

      {/* Module 5 — Duplicates */}
      <CollapsibleCard title="Duplicate Content Checker" icon={<Files className="w-5 h-5 text-primary" />}>
        <Button type="button" variant="outline" onClick={checkDuplicates} disabled={dupLoading}>
          {dupLoading ? "Checking..." : "Check for duplicates"}
        </Button>
        {dupResults && (
          <div className="mt-4 space-y-2 text-sm">
            {dupResults.length === 0 ? (
              <p className="flex gap-2 items-center text-green-600">
                <Check className="w-4 h-4" /> No significant duplicates found.
              </p>
            ) : (
              dupResults.map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <p>
                    This post is <strong>{r.pct}%</strong> similar to{" "}
                    <a href={`/blog/${r.id}`} className="text-primary hover:underline">
                      "{r.title}"
                    </a>
                  </p>
                  {r.reasons.length > 0 && (
                    <p className="text-xs text-amber-500 mt-1">{r.reasons.join(" · ")}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CollapsibleCard>
    </>
  );
}
