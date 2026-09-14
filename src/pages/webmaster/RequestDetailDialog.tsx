import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "./ui";
import { peso, BrandCampaign } from "./platformData";

export type RequestItem =
  | { kind: "brand"; row: BrandCampaign }
  | { kind: "media_plan"; row: Record<string, any> };

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="rounded-lg border border-white/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{Array.isArray(value) ? value.join(", ") : value}</p>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-4">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400/80">{title}</p>
    <div className="grid gap-2 sm:grid-cols-2">{children}</div>
  </div>
);

const date = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString() : null);
const json = (v: unknown) => {
  if (!v || typeof v !== "object" || Object.keys(v as object).length === 0) return null;
  return JSON.stringify(v, null, 1).replace(/[{}"]/g, "").trim();
};

export default function RequestDetailDialog({ item, onClose }: { item: RequestItem | null; onClose: () => void }) {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    setLocations([]);
    if (item?.kind !== "brand") return;
    (async () => {
      const { data } = await supabase
        .from("campaign_ad_space_targets")
        .select("id,quantity,ad_format,unit_rate,ad_spaces(title,location,category,media_types,media_owner_name,media_owner_email)")
        .eq("campaign_id", item.row.id);
      setLocations(data ?? []);
    })();
  }, [item]);

  if (!item) return null;
  const r: any = item.row;
  const brand = item.kind === "brand" ? r.brand_advertiser_profiles : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {r.campaign_name || "Untitled campaign"}
            <StatusBadge status={r.status} />
            <span className="text-xs font-normal text-muted-foreground">
              {item.kind === "brand" ? r.campaign_ref || "Brand request" : "Media plan request"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {brand && (
          <Section title="Requester">
            <Field label="Company" value={brand.company_name} />
            <Field label="Industry" value={brand.industry} />
            <Field label="Contact" value={brand.contact_name} />
            <Field label="Email" value={brand.contact_email} />
            <Field label="Phone" value={brand.contact_phone} />
            <Field label="Website" value={brand.website_domain} />
          </Section>
        )}

        <Section title="Campaign">
          <Field label="Campaign type" value={r.campaign_type} />
          <Field label="Pillar" value={r.campaign_pillar} />
          <Field label="Objective" value={r.objective} />
          <Field label="Objective notes" value={r.objective_notes} />
          <Field label="Media types" value={r.media_types} />
          <Field label="Environments" value={r.environments} />
          <Field label="Scope" value={r.scope_name} />
          <Field label="Countries" value={r.countries} />
          <Field label="Location types" value={r.location_types} />
          <Field label="Locations requested" value={r.location_count ?? r.venue_count} />
          <Field label="Start" value={date(r.start_date || r.preferred_start_date)} />
          <Field label="End" value={date(r.end_date || r.preferred_end_date)} />
          <Field label="Budget" value={r.budget != null ? peso(r.budget) : null} />
          <Field label="Estimated cost" value={r.estimated_cost != null ? peso(r.estimated_cost) : r.estimated_price != null ? peso(r.estimated_price) : null} />
        </Section>

        <Section title="Audience & creative">
          <Field label="Age range" value={r.target_age_min || r.target_age_max ? `${r.target_age_min ?? "?"} – ${r.target_age_max ?? "?"}` : null} />
          <Field label="Gender" value={r.target_gender} />
          <Field label="Audience" value={json(r.audience)} />
          <Field label="Creative format" value={r.creative_format} />
          <Field label="Creative mode" value={r.creative_mode} />
          <Field label="Creative requirements" value={json(r.creative_requirements)} />
        </Section>

        <Section title="Request">
          <Field label="Requester email" value={r.requester_email} />
          <Field label="Notes" value={r.notes || r.additional_notes} />
          <Field label="Rejection reason" value={r.rejection_reason} />
          <Field label="Submitted" value={date(r.submitted_at || r.created_at)} />
          <Field label="OOH / DOOH / AOOH units" value={r.ooh_units != null ? `${r.ooh_units ?? 0} / ${r.dooh_units ?? 0} / ${r.aooh_units ?? 0}` : null} />
        </Section>

        {item.kind === "brand" && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400/80">
              Selected locations ({locations.length})
            </p>
            <div className="space-y-2">
              {locations.map((t) => (
                <div key={t.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
                  <p className="font-medium">{t.ad_spaces?.title || "Location"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.ad_spaces?.location || "—"} · {t.ad_spaces?.category || "—"} · {t.ad_format || "—"} ·
                    {" "}{t.quantity ?? 1} unit(s) · {t.unit_rate != null ? peso(t.unit_rate) : "rate TBC"}
                  </p>
                  {t.ad_spaces?.media_owner_name && (
                    <p className="text-xs text-muted-foreground">
                      Media owner: {t.ad_spaces.media_owner_name} · {t.ad_spaces.media_owner_email || "no email"}
                    </p>
                  )}
                </div>
              ))}
              {locations.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-muted-foreground">
                  No specific locations attached to this request.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
