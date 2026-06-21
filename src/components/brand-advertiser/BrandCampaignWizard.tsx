import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { getActiveAreaNamesText } from "@/lib/serviceAreas";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandAdvertiserId: string;
  onCreated?: () => void;
}

const ENVIRONMENTS = ["OOH", "DOOH", "AOOH"];
const TOTAL_STEPS = 4;

export default function BrandCampaignWizard({ open, onOpenChange, brandAdvertiserId, onCreated }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [campaignName, setCampaignName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Step 2
  const [envSearch, setEnvSearch] = useState("");
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);

  // Step 3
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [gender, setGender] = useState("All");
  const [creativeFormat, setCreativeFormat] = useState("Image");

  // Step 4
  const [notes, setNotes] = useState("");

  const filteredEnvs = useMemo(
    () => ENVIRONMENTS.filter((e) => e.toLowerCase().includes(envSearch.toLowerCase())),
    [envSearch]
  );

  const reset = () => {
    setStep(1); setCampaignName(""); setBudget(""); setStartDate(undefined); setEndDate(undefined);
    setEnvSearch(""); setSelectedEnvs([]); setAgeMin("18"); setAgeMax("65"); setGender("All");
    setCreativeFormat("Image"); setNotes("");
  };

  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  const toggleEnv = (env: string) => {
    setSelectedEnvs((p) => p.includes(env) ? p.filter(e => e !== env) : [...p, env]);
  };

  const canNext1 = campaignName.trim() && Number(budget) > 0 && startDate && endDate;
  const canNext2 = selectedEnvs.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("brand_campaigns").insert({
        brand_advertiser_id: brandAdvertiserId,
        campaign_name: campaignName,
        budget: Number(budget),
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        environments: selectedEnvs,
        countries: ["Philippines"],
        target_age_min: Number(ageMin),
        target_age_max: Number(ageMax),
        target_gender: gender,
        creative_format: creativeFormat,
        notes,
        status: "pending_review",
      });
      if (error) throw error;

      try {
        await supabase.functions.invoke("notify-brand-campaign-submission", {
          body: { campaign_name: campaignName, budget, environments: selectedEnvs },
        });
      } catch (e) { /* non-fatal */ }

      onCreated?.();
      close();
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">New Brand Campaign</DialogTitle>
          <div className="text-xs text-gray-500 mt-1">Step {step} of {TOTAL_STEPS}</div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign Name *</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Summer Brand Launch" />
            </div>
            <div className="space-y-1.5">
              <Label>Budget (PHP) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="pl-7" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 bg-white" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 bg-white" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            <h3 className="font-semibold text-gray-900">Select Environment</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={envSearch}
                onChange={(e) => setEnvSearch(e.target.value)}
                placeholder="Search environments..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => setSelectedEnvs([...ENVIRONMENTS])} className="bg-blue-600 hover:bg-blue-700 text-white">Check All</Button>
              <Button type="button" onClick={() => setSelectedEnvs([])} className="bg-gray-500 hover:bg-gray-600 text-white">Uncheck All</Button>
            </div>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100">
              {filteredEnvs.map((env) => (
                <label key={env} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <Checkbox checked={selectedEnvs.includes(env)} onCheckedChange={() => toggleEnv(env)} />
                  <span className="text-sm font-medium text-gray-800">{env}</span>
                </label>
              ))}
              {filteredEnvs.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No matches</div>
              )}
            </div>
            <div className="text-xs text-gray-500">{selectedEnvs.length} environment(s) selected</div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              Currently available in: {getActiveAreaNamesText()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Age Min</Label>
                <Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Age Max</Label>
                <Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Creative Format</Label>
              <Select value={creativeFormat} onValueChange={setCreativeFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="border border-gray-200 rounded-md p-4 space-y-2 bg-gray-50">
              <Row label="Campaign" value={campaignName} />
              <Row label="Budget" value={`₱${Number(budget || 0).toLocaleString()}`} />
              <Row label="Dates" value={`${startDate ? format(startDate, "MMM d, yyyy") : "—"} – ${endDate ? format(endDate, "MMM d, yyyy") : "—"}`} />
              <Row label="Environments" value={selectedEnvs.join(", ") || "—"} />
              <Row label="Country" value="Philippines" />
              <Row label="Age" value={`${ageMin} – ${ageMax}`} />
              <Row label="Gender" value={gender} />
              <Row label="Creative" value={creativeFormat} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything else our team should know?" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={() => step === 1 ? close() : setStep(step - 1)} disabled={submitting}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >Next</Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
              {submitting ? "Submitting..." : "Submit Campaign for Review"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
