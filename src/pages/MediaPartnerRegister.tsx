import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Handshake, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { z } from "zod";
import {
  AVAILABILITY_OPTIONS,
  CERTIFICATION_TYPES,
  PARTNER_MEDIA_ACCEPT,
  PORTFOLIO_PLATFORMS,
  SERVICE_COVERAGE_OPTIONS,
  SOCIAL_PLATFORMS,
  TEAM_SIZE_OPTIONS,
  fetchPartnerTaxonomy,
  type PartnerTaxonomy,
} from "@/lib/partnerTaxonomy";

const STEPS = ["Company", "Classification", "Business Profile", "Portfolio & Experience"];

const step1Schema = z.object({
  companyName: z.string().trim().min(2, "Company / brand name is required").max(120),
  contactPerson: z.string().trim().min(2, "Contact person is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().min(5, "Mobile number is required").max(40),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PortfolioLink = { platform: string; url: string; title: string };

const emptyLink: PortfolioLink = { platform: "Website", url: "", title: "" };

export default function MediaPartnerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [taxonomy, setTaxonomy] = useState<PartnerTaxonomy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [businessRegistrationName, setBusinessRegistrationName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [socials, setSocials] = useState<Record<string, string>>({});

  // Step 2
  const [category, setCategory] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);

  // Step 3
  const [description, setDescription] = useState("");
  const [yearsInOperation, setYearsInOperation] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [serviceCoverage, setServiceCoverage] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [regions, setRegions] = useState("");
  const [provinces, setProvinces] = useState("");
  const [cities, setCities] = useState("");
  const [countries, setCountries] = useState("");

  // Step 4
  const [links, setLinks] = useState<PortfolioLink[]>([{ ...emptyLink }]);
  const [files, setFiles] = useState<File[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [notableClients, setNotableClients] = useState("");
  const [industriesServed, setIndustriesServed] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [availability, setAvailability] = useState<string[]>([]);

  useEffect(() => {
    fetchPartnerTaxonomy()
      .then(setTaxonomy)
      .catch((e) => toast.error(e.message || "Could not load partner categories"));
  }, []);

  const categorySpecializations = useMemo(() => {
    if (!taxonomy || !category) return [];
    const cat = taxonomy.categories.find((c) => c.slug === category);
    return taxonomy.specializations.filter((s) => s.category_id === cat?.id);
  }, [taxonomy, category]);

  const categoryCapabilities = useMemo(() => {
    if (!taxonomy || !category) return [];
    const cat = taxonomy.categories.find((c) => c.slug === category);
    return taxonomy.capabilities.filter((s) => s.category_id === cat?.id);
  }, [taxonomy, category]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const splitList = (value: string) =>
    value.split(",").map((v) => v.trim()).filter(Boolean);

  const validateStep = () => {
    if (step === 0) {
      const result = step1Schema.safeParse({
        companyName, contactPerson, email, phone, password, confirmPassword,
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return false;
      }
      return true;
    }
    if (step === 1) {
      if (!category) return toast.error("Select a primary partner category"), false;
      if (specializations.length === 0) return toast.error("Select at least one specialization"), false;
      return true;
    }
    if (step === 2) {
      if (description.trim().length < 20) return toast.error("Add a company description (min 20 characters)"), false;
      if (!serviceCoverage) return toast.error("Select your service coverage"), false;
      return true;
    }
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            user_type: "print_partner",
            full_name: contactPerson,
            contact_name: contactPerson,
            company_name: companyName,
            contact_phone: phone,
            business_address: businessAddress,
          },
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Registration failed");

      const { data: profile, error: profileError } = await supabase
        .from("print_partner_profiles")
        .upsert(
          {
            user_id: user.id,
            company_name: companyName.trim(),
            business_registration_name: businessRegistrationName.trim() || null,
            contact_person: contactPerson.trim(),
            job_title: jobTitle.trim() || null,
            contact_email: email.trim(),
            contact_phone: phone.trim(),
            website: website.trim() || null,
            social_links: socials,
            business_address: businessAddress.trim() || null,
            partner_category: category,
            specializations,
            capabilities,
            company_description: description.trim(),
            years_in_operation: yearsInOperation ? Number(yearsInOperation) : null,
            team_size: teamSize || null,
            service_coverage: serviceCoverage,
            coverage_regions: splitList(regions),
            coverage_provinces: splitList(provinces),
            coverage_cities: splitList(cities),
            coverage_countries: splitList(countries),
            certifications,
            notable_clients: notableClients.trim() || null,
            industries_served: splitList(industriesServed),
            years_experience: yearsExperience ? Number(yearsExperience) : null,
            availability,
            verified: false,
          },
          { onConflict: "user_id" }
        )
        .select("id")
        .single();
      if (profileError) throw profileError;

      const items: Array<Record<string, unknown>> = links
        .filter((l) => l.url.trim())
        .map((l, i) => ({
          partner_id: profile.id,
          item_type: "link",
          platform: l.platform,
          title: l.title.trim() || l.platform,
          url: l.url.trim(),
          sort_order: i,
        }));

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${user.id}/${Date.now()}-${i}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("partner-portfolio")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        items.push({
          partner_id: profile.id,
          item_type: "file",
          title: file.name,
          file_path: path,
          mime_type: file.type,
          sort_order: items.length,
        });
      }

      if (items.length) {
        const { error: itemsError } = await supabase.from("partner_portfolio_items").insert(items as never);
        if (itemsError) throw itemsError;
      }

      const { error: notifyError } = await supabase.functions.invoke("notify-admin-registration", {
        body: {
          fullName: contactPerson,
          email,
          phoneNumber: phone,
          userId: user.id,
          registrationType: "print_partner",
          companyName,
          businessAddress,
          capabilities,
        },
      });
      if (notifyError) console.error("Notification failed:", notifyError);

      await supabase.auth.signOut();
      setIsSuccess(true);
      toast.success("Media partner application submitted!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      console.error("Media partner registration error:", error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Application Submitted</CardTitle>
            <CardDescription>
              Your media partner application is now pending review. We'll email you once your profile is approved
              and published in the TrioTag partner directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate("/partners")}>Browse partner directory</Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/admin")}>Back to login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-10 px-4">
      <div className="w-full max-w-3xl mx-auto">
        <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
        </Link>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Media Partner Registration</CardTitle>
                <CardDescription>
                  Join TrioTag as a Production, Print or Talent partner.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
                  <p className={`text-xs mt-1.5 ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {i + 1}. {label}
                  </p>
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company / Brand Name *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="TrioTag Studios" />
                </div>
                <div className="space-y-2">
                  <Label>Business Registration Name</Label>
                  <Input value={businessRegistrationName} onChange={(e) => setBusinessRegistrationName(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Person *</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Juan Dela Cruz" />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Managing Director" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63..." />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password *</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Social Media Links</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {SOCIAL_PLATFORMS.map((p) => (
                      <Input
                        key={p}
                        value={socials[p] ?? ""}
                        onChange={(e) => setSocials({ ...socials, [p]: e.target.value })}
                        placeholder={`${p} URL`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Primary Partner Category *</Label>
                  {!taxonomy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {taxonomy?.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCategory(c.slug); setSpecializations([]); setCapabilities([]); }}
                        className={`text-left rounded-lg border p-4 transition-colors ${
                          category === c.slug ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {category && (
                  <>
                    <div className="space-y-3">
                      <Label>Specializations * <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
                      <div className="grid gap-2 sm:grid-cols-2 bg-muted/30 p-4 rounded-lg">
                        {categorySpecializations.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={specializations.includes(s.slug)}
                              onCheckedChange={() => toggle(specializations, setSpecializations, s.slug)}
                            />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Service Capabilities</Label>
                      <div className="grid gap-2 sm:grid-cols-2 bg-muted/30 p-4 rounded-lg">
                        {categoryCapabilities.map((s) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={capabilities.includes(s.slug)}
                              onCheckedChange={() => toggle(capabilities, setCapabilities, s.slug)}
                            />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Description *</Label>
                  <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell advertisers what you do best..." />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Years in Operation</Label>
                    <Input type="number" min={0} value={yearsInOperation} onChange={(e) => setYearsInOperation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Team Size</Label>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {TEAM_SIZE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Service Coverage *</Label>
                    <Select value={serviceCoverage} onValueChange={setServiceCoverage}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_COVERAGE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Address</Label>
                  <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Regions Served</Label>
                    <Input value={regions} onChange={(e) => setRegions(e.target.value)} placeholder="NCR, Region IV-A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provinces Served</Label>
                    <Input value={provinces} onChange={(e) => setProvinces(e.target.value)} placeholder="Cavite, Laguna" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cities Served</Label>
                    <Input value={cities} onChange={(e) => setCities(e.target.value)} placeholder="Makati, Quezon City" />
                  </div>
                  <div className="space-y-2">
                    <Label>Countries Served</Label>
                    <Input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Philippines, Singapore" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Separate multiple entries with commas.</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Portfolio Links</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setLinks([...links, { ...emptyLink }])}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  {links.map((link, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                      <Select
                        value={link.platform}
                        onValueChange={(v) => setLinks(links.map((l, idx) => (idx === i ? { ...l, platform: v } : l)))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PORTFOLIO_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.url}
                        onChange={(e) => setLinks(links.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))}
                        placeholder="https://"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Sample Works</Label>
                  <label className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload images, PDF portfolios, videos or audio files</span>
                    <input
                      type="file"
                      multiple
                      accept={PARTNER_MEDIA_ACCEPT}
                      className="hidden"
                      onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])}
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {f.name}
                          <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Certifications</Label>
                  <div className="grid gap-2 sm:grid-cols-2 bg-muted/30 p-4 rounded-lg">
                    {CERTIFICATION_TYPES.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={certifications.includes(c)} onCheckedChange={() => toggle(certifications, setCertifications, c)} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Notable Clients</Label>
                    <Textarea rows={3} value={notableClients} onChange={(e) => setNotableClients(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Industries Served</Label>
                    <Textarea rows={3} value={industriesServed} onChange={(e) => setIndustriesServed(e.target.value)} placeholder="Retail, F&B, Real Estate" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Years of Experience</Label>
                    <Input type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    <Label>Availability</Label>
                    <div className="space-y-2 bg-muted/30 p-4 rounded-lg">
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={availability.includes(a)} onCheckedChange={() => toggle(availability, setAvailability, a)} />
                          {a}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isLoading}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
