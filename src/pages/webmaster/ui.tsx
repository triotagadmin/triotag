import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const PageHeader = ({ title, subtitle, scope = "ALL TENANTS", actions }: {
  title: string; subtitle?: string; scope?: string; actions?: React.ReactNode;
}) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-green-400/70">{scope}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

export const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <Card className="border-green-500/20 bg-black/40">
    <CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-green-300">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </CardContent>
  </Card>
);

export const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <Card className={`border-green-500/20 bg-black/40 ${className}`}>
    <CardContent className="p-4">{children}</CardContent>
  </Card>
);

const TONE: Record<string, string> = {
  active: "bg-green-500/15 text-green-300 border-green-500/40",
  approved: "bg-green-500/15 text-green-300 border-green-500/40",
  paid: "bg-green-500/15 text-green-300 border-green-500/40",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  pending_verification: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  pending_review: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  revision_required: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  suspended: "bg-red-500/15 text-red-300 border-red-500/40",
  disabled: "bg-red-500/15 text-red-300 border-red-500/40",
  rejected: "bg-red-500/15 text-red-300 border-red-500/40",
  cancelled: "bg-white/10 text-muted-foreground border-white/20",
  expired: "bg-white/10 text-muted-foreground border-white/20",
};

export const StatusBadge = ({ status }: { status: string | null | undefined }) => {
  const key = (status ?? "unknown").toLowerCase();
  return (
    <Badge variant="outline" className={TONE[key] ?? "bg-white/5 text-muted-foreground border-white/15"}>
      {key.replace(/_/g, " ")}
    </Badge>
  );
};

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
    {children}
  </p>
);
