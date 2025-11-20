import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, LogOut, Users, FileText, CheckCircle, XCircle, Clock, Filter, Bell, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Submission {
  id: string;
  type: "publisher" | "admin" | "advertiser" | "campaign" | "ad_space";
  name: string;
  email?: string;
  location?: string;
  status: string;
  createdAt: string;
  publisherType?: string;
  userId?: string;
  details?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "info" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    loadSubmissions();
    loadNotifications();
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

      // Load admin profiles
      const { data: admins } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Load advertiser profiles
      const { data: advertisers } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Load campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select(`
          *,
          advertiser_profiles (
            company_name,
            contact_email,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      // Load ad spaces
      const { data: adSpaces } = await supabase
        .from("ad_spaces")
        .select(`
          *,
          publisher_profiles (
            business_name,
            contact_email,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      const allSubmissions: Submission[] = [
        ...(publishers || []).map((p) => ({
          id: p.id,
          type: "publisher" as const,
          name: p.business_name,
          email: p.contact_email,
          publisherType: p.publisher_type,
          status: p.verification_status,
          createdAt: p.created_at,
          location: p.location,
          userId: p.user_id,
          details: p,
        })),
        ...(admins || []).map((a) => ({
          id: a.id,
          type: "admin" as const,
          name: a.full_name,
          status: a.status,
          createdAt: a.created_at,
          userId: a.user_id,
          details: a,
        })),
        ...(advertisers || []).map((a) => ({
          id: a.id,
          type: "advertiser" as const,
          name: a.company_name,
          email: a.contact_email,
          status: a.status,
          createdAt: a.created_at,
          userId: a.user_id,
          details: a,
        })),
        ...(campaigns || []).map((c) => ({
          id: c.id,
          type: "campaign" as const,
          name: c.campaign_name,
          email: c.advertiser_profiles?.contact_email,
          status: c.status,
          createdAt: c.created_at,
          userId: c.advertiser_profiles?.user_id,
          details: c,
        })),
        ...(adSpaces || []).map((a) => ({
          id: a.id,
          type: "ad_space" as const,
          name: a.title,
          email: a.publisher_profiles?.contact_email,
          location: a.location,
          status: a.approval_status,
          createdAt: a.created_at,
          userId: a.publisher_profiles?.user_id,
          details: a,
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

  const loadNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
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

  const openActionDialog = (submission: Submission, action: "approve" | "reject" | "info") => {
    setSelectedSubmission(submission);
    setActionType(action);
    setActionNote("");
    setIsDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedSubmission || !actionType) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newStatus = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : selectedSubmission.status;
      const updateData: any = {
        ...(actionType === "approve" && {
          approved_at: new Date().toISOString(),
          approved_by: session.user.id,
        }),
        ...(actionType === "reject" && {
          rejection_reason: actionNote,
        }),
      };

      // Update status in appropriate table based on type
      let error = null;

      if (selectedSubmission.type === "publisher") {
        const { error: updateError } = await supabase
          .from("publisher_profiles")
          .update({
            ...updateData,
            verification_status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "admin") {
        const { error: updateError } = await supabase
          .from("admin_profiles")
          .update({
            ...updateData,
            status: newStatus === "approved" ? "verified" : newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "advertiser") {
        const { error: updateError } = await supabase
          .from("advertiser_profiles")
          .update({
            ...updateData,
            status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "campaign") {
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            ...updateData,
            status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "ad_space") {
        const { error: updateError } = await supabase
          .from("ad_spaces")
          .update({
            ...updateData,
            approval_status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      }

      if (error) throw error;

      // Send notification
      if (selectedSubmission.userId && selectedSubmission.email) {
        await supabase.functions.invoke("send-status-notification", {
          body: {
            userId: selectedSubmission.userId,
            recipientEmail: selectedSubmission.email,
            recipientName: selectedSubmission.name,
            submissionType: selectedSubmission.type,
            status: newStatus,
            rejectionReason: actionType === "reject" ? actionNote : undefined,
            requestedInfo: actionType === "info" ? actionNote : undefined,
          },
        });
      }

      toast.success(`Submission ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "updated"} successfully`);
      setIsDialogOpen(false);
      loadSubmissions();
    } catch (error) {
      console.error("Action error:", error);
      toast.error("Failed to process action");
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

  const getTypeBadge = (type: string, publisherType?: string) => {
    const displayType = type === "publisher" && publisherType ? publisherType : type;
    return (
      <Badge variant="outline" className="capitalize">
        {displayType.replace("_", " ")}
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
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">
              <FileText className="w-4 h-4 mr-2" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Card>
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
                    <SelectItem value="advertiser">Advertisers</SelectItem>
                    <SelectItem value="campaign">Campaigns</SelectItem>
                    <SelectItem value="ad_space">Ad Spaces</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>Review and manage all platform submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
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
                            {getTypeBadge(submission.type, submission.publisherType)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {submission.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {submission.email || submission.location || "-"}
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
                                    onClick={() => openActionDialog(submission, "approve")}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openActionDialog(submission, "reject")}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openActionDialog(submission, "info")}
                                  >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Info
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
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>System notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notifications</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${!notification.read ? "bg-muted/50" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="ml-4">New</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Submission"}
              {actionType === "reject" && "Reject Submission"}
              {actionType === "info" && "Request More Information"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "This will approve the submission and notify the user."}
              {actionType === "reject" && "Please provide a reason for rejection."}
              {actionType === "info" && "Specify what additional information is needed."}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "reject" || actionType === "info") && (
            <div className="space-y-2">
              <Label htmlFor="note">
                {actionType === "reject" ? "Rejection Reason" : "Information Needed"}
              </Label>
              <Textarea
                id="note"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "reject"
                    ? "Please explain why this submission is being rejected..."
                    : "Please describe what information is needed..."
                }
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={(actionType === "reject" || actionType === "info") && !actionNote.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
