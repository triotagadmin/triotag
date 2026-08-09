import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, QrCode, Smartphone, ExternalLink } from "lucide-react";
import { statusBadgeClass, trackingUrl } from "@/lib/mobileQr";

type Row = {
  id: string;
  name: string | null;
  short_code: string | null;
  qr_ref: string | null;
  qr_type: string;
  status: string | null;
  destination_url: string | null;
  is_active: boolean | null;
  created_at: string;
};

export default function AdminQRCodes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("qr_codes")
        .select("id, name, short_code, qr_ref, qr_type, status, destination_url, is_active, created_at")
        .order("created_at", { ascending: false });
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.qr_ref, r.short_code, r.destination_url].some((v) => v?.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">All QR Codes</h1>
          <p className="text-sm text-muted-foreground">Every QR code across the TrioTag platform.</p>
        </div>
        <Button onClick={() => navigate("/admin/mobile-qr")}>
          <Smartphone className="mr-2 h-4 w-4" /> Mobile QR
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{filtered.length} QR codes</CardTitle>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || "Untitled"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {r.qr_type === "MOBILE_QR" ? <Smartphone className="h-3 w-3" /> : <QrCode className="h-3 w-3" />}
                          {r.qr_type === "MOBILE_QR" ? "Mobile QR" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.qr_ref || r.short_code || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(r.qr_type === "MOBILE_QR" ? r.status : r.is_active ? "active" : "paused")}>
                          {r.qr_type === "MOBILE_QR" ? r.status : r.is_active ? "active" : "paused"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.qr_type === "MOBILE_QR" && r.qr_ref && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={trackingUrl(r.qr_ref)} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No QR codes yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
