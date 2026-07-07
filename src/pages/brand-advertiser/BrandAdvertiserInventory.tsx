import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Monitor, Volume2, ArrowRight, ClipboardList } from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import { calculateMediaPlanEstimate } from "@/lib/mediaPlanPricing";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

const UNIT_FORMATS = [
  {
    key: "OOH" as const,
    title: "OOH Units",
    desc: "Out-of-Home print placements",
    icon: ImageIcon,
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    key: "DOOH" as const,
    title: "DOOH Units",
    desc: "Digital screens with scheduled creative",
    icon: Monitor,
    bg: "bg-cyan-50",
    iconColor: "text-cyan-600",
  },
  {
    key: "AOOH" as const,
    title: "AOOH Units",
    desc: "Ambient / audio placements",
    icon: Volume2,
    bg: "bg-green-50",
    iconColor: "text-green-600",
  },
];

type UnitCounts = { OOH: string; DOOH: string; AOOH: string };

export default function BrandAdvertiserInventory() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("My Brand");
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [units, setUnits] = useState<UnitCounts>({ OOH: "", DOOH: "", AOOH: "" });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("brand_advertiser_profiles")
          .select("company_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.company_name) setCompanyName(profile.company_name);
      }
    })();
  }, []);

  const estimate = useMemo(
    () => calculateMediaPlanEstimate([], radiusMeters),
    [radiusMeters]
  );

  const totalUnits =
    (Number(units.OOH) || 0) + (Number(units.DOOH) || 0) + (Number(units.AOOH) || 0);

  const submitRegistry = () => {
    navigate("/brand-advertiser/campaigns", {
      state: {
        openWizard: true,
        prefill: {
          radiusMeters,
          center,
          unitCounts: {
            OOH: Number(units.OOH) || 0,
            DOOH: Number(units.DOOH) || 0,
            AOOH: Number(units.AOOH) || 0,
          },
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={0} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Campaign Unit Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick your target area and register how many OOH, DOOH, and AOOH units you want for this campaign.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Map + radius planner */}
          <div className="lg:col-span-3 space-y-4">
            <RadiusMapPlanner
              center={center}
              radiusMeters={radiusMeters}
              onCenterChange={setCenter}
              onRadiusChange={setRadiusMeters}
            />

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Coverage Radius — affects campaign reach pricing
              </div>
              <div className="text-sm text-gray-700">
                {estimate.radiusPercent}% coverage ={" "}
                <span className="font-semibold text-green-700">
                  ₱{estimate.radiusFee.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5">
                5% coverage starts at ₱200,000 · 100% coverage is ₱3,500,000
              </div>
            </div>
          </div>

          {/* RIGHT: Registry form */}
          <div className="lg:col-span-2">
            <Card className="p-5 bg-white border border-gray-200 sticky top-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">Unit Registry</h2>
                  <p className="text-xs text-gray-500">How many of each unit do you need?</p>
                </div>
              </div>

              <div className="space-y-3">
                {UNIT_FORMATS.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.key}
                      className="rounded-xl border border-gray-200 p-3 flex items-center gap-3 bg-white"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${f.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label
                          htmlFor={`units-${f.key}`}
                          className="text-sm font-semibold text-gray-900"
                        >
                          {f.title}
                        </Label>
                        <div className="text-xs text-gray-500">{f.desc}</div>
                      </div>
                      <Input
                        id={`units-${f.key}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={units[f.key]}
                        onChange={(e) =>
                          setUnits((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        className="w-20 text-center"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-600">Total units requested</span>
                <span className="text-sm font-semibold text-gray-900">{totalUnits}</span>
              </div>

              <Button
                onClick={submitRegistry}
                disabled={totalUnits === 0}
                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white"
              >
                Submit &amp; Continue to Campaign <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-[11px] text-gray-500 text-center mt-2">
                We'll match your registered units to available inventory in your radius.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
