import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, LogOut, Users, FileText, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Submission {
  id: string;
  type: "publisher" | "admin";
  businessName?: string;
  fullName?: string;
  email: string;
  publisherType?: string;
  status: string;
  createdAt: string;
  location?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    checkAdminAccess();
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, typeFilter]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to access admin dashboard");
        navigate("/admin");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("status, full_name")
        .eq("user_id", session.user.id)
        .single();

      if (!adminProfile || adminProfile.status !== "verified") {
        toast.error("Access denied. Verified admin credentials required.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      setAdminName(adminProfile.full_name);
    } catch (error) {
      console.error("Access check error:", error);
      navigate("/admin");
    }
  };

  const loadSubmissions = async () => {
    try {
      // Load publisher profiles
      const { data: publishers } = await supabase
        .from("publisher_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Load pending admin profiles
      const { data: admins } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const allSubmissions: Submission[] = [
        ...(publishers || []).map((p) => ({
          id: p.id,
          type: "publisher" as const,
          businessName: p.business_name,
          email: p.contact_email,
          publisherType: p.publisher_type,
          status: p.verification_status,
          createdAt: p.created_at,
          location: p.location,
        })),
        ...(admins || []).map((a) => ({
          id: a.id,
          type: "admin" as const,
          fullName: a.full_name,
          email: "", // Email is in auth.users, not exposed here
          status: a.status,
          createdAt: a.created_at,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const handleApprove = async (submission: Submission) => {
    try {
      if (submission.type === "publisher") {
        const { error } = await supabase
          .from("publisher_profiles")
          .update({
            verification_status: "approved",
            approved_at: new Date().toISOString(),
          })
          .eq("id", submission.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_profiles")
          .update({
            status: "verified",
            verified_at: new Date().toISOString(),
          })
          .eq("id", submission.id);

        if (error) throw error;
      }

      toast.success("Submission approved successfully");
      loadSubmissions();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve submission");
    }
  };

  const handleReject = async (submission: Submission) => {
    const reason = prompt("Please provide a rejection reason:");
    if (!reason) return;

    try {
      if (submission.type === "publisher") {
        const { error } = await supabase
          .from("publisher_profiles")
          .update({
            verification_status: "rejected",
            rejection_reason: reason,
          })
          .eq("id", submission.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_profiles")
          .update({
            status: "rejected",
            rejection_reason: reason,
          })
          .eq("id", submission.id);

        if (error) throw error;
      }

      toast.success("Submission rejected");
      loadSubmissions();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject submission");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      verified: "default",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => ["approved", "verified"].includes(s.status)).length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {adminName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Submissions</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
            </CardHeader>
            <CardContent>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
            </CardHeader>
            <CardContent>
              <XCircle className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="publisher">Publishers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Submissions</CardTitle>
            <CardDescription>Review and manage publisher and admin registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name/Business</TableHead>
                  <TableHead>Email/Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {submission.type === "publisher" ? submission.publisherType : "admin"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {submission.businessName || submission.fullName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {submission.email || submission.location}
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {submission.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(submission)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(submission)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
