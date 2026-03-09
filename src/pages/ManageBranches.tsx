import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BranchManager } from "@/components/franchise/BranchManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ManageBranches = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!listingId) return;
    supabase
      .from("ad_spaces")
      .select("title")
      .eq("id", listingId)
      .single()
      .then(({ data }) => {
        if (data) setTitle(data.title);
      });
  }, [listingId]);

  if (!listingId) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-[1200px]">
        <Button variant="ghost" onClick={() => navigate("/venue-publishers")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <BranchManager franchiseId={listingId} franchiseName={title || "Ad Space"} />
      </div>
    </div>
  );
};

export default ManageBranches;
