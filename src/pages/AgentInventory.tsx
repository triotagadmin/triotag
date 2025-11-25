import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Eye, Users, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

interface ServiceFile {
  id: string;
  file_url: string;
  file_type: string;
  file_path: string;
  uploaded_at: string;
}

interface PublisherProfile {
  id: string;
  business_name: string;
  agent_role: string | null;
  verification_status: string;
  description: string | null;
}

const AgentInventory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serviceFiles, setServiceFiles] = useState<ServiceFile[]>([]);
  const [profile, setProfile] = useState<PublisherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("publisher_type", "agent")
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        toast({
          title: "Profile not found",
          description: "Please complete your agent profile first.",
          variant: "destructive",
        });
        navigate("/agent-registration");
        return;
      }

      setProfile(profileData);

      // Fetch service files
      const { data: filesData, error: filesError } = await supabase
        .from("agent_service_files")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("uploaded_at", { ascending: false });

      if (filesError) throw filesError;
      setServiceFiles(filesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agent Services Inventory</h1>
            <p className="text-muted-foreground">Manage your service portfolio</p>
          </div>
          <Button onClick={() => navigate("/agent-registration")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Service Photos
          </Button>
        </div>

        {/* Profile Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {profile?.business_name}
                </CardTitle>
                <CardDescription>
                  {profile?.agent_role && `Role: ${profile.agent_role}`}
                </CardDescription>
              </div>
              {profile && getStatusBadge(profile.verification_status)}
            </div>
          </CardHeader>
          {profile?.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{profile.description}</p>
            </CardContent>
          )}
        </Card>

        {/* Service Files Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Portfolio</CardTitle>
                <CardDescription>
                  {serviceFiles.length} of 30 photos uploaded
                </CardDescription>
              </div>
              <Button
                onClick={() => navigate("/agent-registration")}
                disabled={serviceFiles.length >= 30}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload More
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {serviceFiles.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No service photos uploaded yet</p>
                <Button onClick={() => navigate("/agent-registration")}>
                  Upload Your First Photo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {serviceFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img
                        src={file.file_url}
                        alt="Service photo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="flex-1 h-8">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-destructive hover:text-destructive">
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Profile Management</CardTitle>
            <CardDescription>Update your agent profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/agent-registration")} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" disabled>
                View Public Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentInventory;
