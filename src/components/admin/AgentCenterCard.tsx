import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

/** Shortcut to the Agent Center — only rendered for active tenant Super Admins. */
export default function AgentCenterCard() {
  const [visible, setVisible] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: me } = await supabase
        .from("tenant_members")
        .select("tenant_id, member_role, status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!(me?.member_role === "super_admin" && me.status === "active")) return;

      const { count } = await supabase
        .from("tenant_members")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", me.tenant_id)
        .eq("member_role", "agent")
        .eq("status", "active");

      if (!cancelled) {
        setActiveCount(count ?? 0);
        setVisible(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!visible) return null;

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-500/15 border border-green-500/40 flex items-center justify-center text-green-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent Center</p>
            <p className="text-2xl font-bold">{activeCount} Active Agents</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/agents">Manage Agents <ArrowRight className="w-4 h-4 ml-2" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
