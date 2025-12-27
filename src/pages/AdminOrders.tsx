import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Package, 
  Loader2, 
  Eye, 
  CheckCircle, 
  Truck, 
  Clock,
  FileImage,
  MapPin,
  DollarSign,
  Bell,
  Download,
  Building,
  Phone,
  Mail,
  ExternalLink,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";

type PrintOrderStatus = "pending_admin" | "in_production" | "shipped" | "delivered" | "rejected";

interface PrintOrder {
  id: string;
  activation_id: string | null;
  advertiser_id: string;
  order_status: PrintOrderStatus;
  product_sku: string;
  product_name: string;
  product_specs: any;
  quantity: number;
  design_url: string;
  shipping_address: any;
  shipping_country: string;
  total_price: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

interface ListingDetails {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
}

interface PublisherContact {
  id: string;
  business_name: string;
  contact_email: string;
  contact_phone: string | null;
  location: string | null;
}

const STATUS_CONFIG: Record<PrintOrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_admin: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-4 w-4" /> },
  in_production: { label: "In Production", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Package className="h-4 w-4" /> },
  shipped: { label: "Shipped", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Delivered", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <XCircle className="h-4 w-4" /> },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<PrintOrderStatus>("pending_admin");
  const [newPrice, setNewPrice] = useState("");
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [listingDetails, setListingDetails] = useState<ListingDetails | null>(null);
  const [publisherContact, setPublisherContact] = useState<PublisherContact | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      subscribeToNewOrders();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("print_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewOrders = () => {
    const channel = supabase
      .channel("print-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "print_orders",
        },
        (payload) => {
          setNewOrderCount((prev) => prev + 1);
          setOrders((prev) => [payload.new as PrintOrder, ...prev]);
          toast({
            title: "New Order Received!",
            description: `Order for ${(payload.new as PrintOrder).product_name}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const openOrderDetails = async (order: PrintOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    setNewStatus(order.order_status);
    setNewPrice(order.total_price?.toString() || "");
    setListingDetails(null);
    setPublisherContact(null);
    setShowOrderDialog(true);

    // Fetch listing and publisher details if activation_id exists
    if (order.activation_id) {
      setLoadingDetails(true);
      try {
        // Get activation to find ad_space_id
        const { data: activation } = await supabase
          .from("activations")
          .select("ad_space_id, publisher_id")
          .eq("id", order.activation_id)
          .single();

        if (activation?.ad_space_id) {
          // Fetch listing details
          const { data: adSpace } = await supabase
            .from("ad_spaces")
            .select("id, title, location, description")
            .eq("id", activation.ad_space_id)
            .single();

          if (adSpace) {
            setListingDetails(adSpace);
          }
        }

        if (activation?.publisher_id) {
          // Fetch publisher contact info - using publisher_id which is user_id
          const { data: publisher } = await supabase
            .from("publisher_profiles")
            .select("id, business_name, contact_email, contact_phone, location")
            .eq("user_id", activation.publisher_id)
            .single();

          if (publisher) {
            setPublisherContact(publisher);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("print_orders")
        .update({
          order_status: "rejected" as any,
          admin_notes: adminNotes || "Order rejected by admin",
          rejected_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Update activation status to rejected
      if (selectedOrder.activation_id) {
        await supabase
          .from("activations")
          .update({ 
            status: "rejected",
            rejection_reason: adminNotes || "Print order rejected by admin"
          })
          .eq("id", selectedOrder.activation_id);
      }

      await fetchOrders();
      setShowOrderDialog(false);

      toast({
        title: "Order Rejected",
        description: "The order has been rejected and moved to Rejected tab",
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Error rejecting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject order",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDesign = (url: string) => {
    window.open(url, "_blank");
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const updates: any = {
        order_status: newStatus,
        admin_notes: adminNotes,
      };

      if (newPrice) {
        updates.total_price = parseFloat(newPrice);
      }

      // Set approved_at when approving
      if (newStatus === "in_production" && selectedOrder.order_status === "pending_admin") {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("print_orders")
        .update(updates)
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Update activation status if moving to payment step and send notification
      if (newStatus === "in_production" && selectedOrder.activation_id) {
        await supabase
          .from("activations")
          .update({ status: "payment_pending" })
          .eq("id", selectedOrder.activation_id);

        // Send notification to advertiser
        await supabase
          .from("notifications")
          .insert({
            user_id: selectedOrder.advertiser_id,
            title: "Ad Order Approved!",
            message: `Your ad order (${selectedOrder.id.slice(0, 8).toUpperCase()}) has been approved. Please proceed to checkout to complete payment for your venue listing.`,
            type: "order_approved",
          });
      }

      // Refresh orders
      await fetchOrders();
      setShowOrderDialog(false);

      toast({
        title: "Order Updated",
        description: `Order status changed to ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveAndInvoice = async () => {
    if (!selectedOrder) return;
    setNewStatus("in_production");
    await handleUpdateOrder();
  };

  const pendingOrders = orders.filter(o => o.order_status === "pending_admin");
  const approvedOrders = orders.filter(o => ["in_production", "shipped", "delivered"].includes(o.order_status));
  const rejectedOrders = orders.filter(o => o.order_status === "rejected");

  const renderOrdersTable = (ordersList: PrintOrder[], showApprovedDate = false, showRejectedDate = false) => {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No orders in this category</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>{showApprovedDate ? "Approved" : showRejectedDate ? "Rejected" : "Created"}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersList.map((order) => (
            <TableRow 
              key={order.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => openOrderDetails(order)}
            >
              <TableCell className="font-mono text-sm">
                {order.id.slice(0, 8).toUpperCase()}
              </TableCell>
              <TableCell>{order.product_name}</TableCell>
              <TableCell>{order.quantity}</TableCell>
              <TableCell>{order.shipping_country}</TableCell>
              <TableCell>
                {order.total_price ? `₱${order.total_price.toLocaleString()}` : "—"}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_CONFIG[order.order_status]?.color || "bg-muted"}>
                  {STATUS_CONFIG[order.order_status]?.label || order.order_status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {showApprovedDate && order.approved_at 
                  ? format(new Date(order.approved_at), "MMM d, yyyy")
                  : showRejectedDate && order.rejected_at
                  ? format(new Date(order.rejected_at), "MMM d, yyyy")
                  : format(new Date(order.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Print Orders</h1>
              <p className="text-muted-foreground">Manage incoming print orders</p>
            </div>
          </div>

          {pendingOrders.length > 0 && (
            <Badge className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2">
              <Bell className="h-4 w-4" />
              {pendingOrders.length} Pending Review
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = orders.filter(o => o.order_status === status).length;
            return (
              <Card key={status} className={`${config.color} border`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{config.label}</p>
                      <p className="text-3xl font-bold">{count}</p>
                    </div>
                    {config.icon}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Orders Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Management</CardTitle>
            <CardDescription>
              Click on an order to view details and manage status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approved ({approvedOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Rejected ({rejectedOrders.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {renderOrdersTable(pendingOrders)}
                </TabsContent>

                <TabsContent value="approved">
                  {renderOrdersTable(approvedOrders, true, false)}
                </TabsContent>

                <TabsContent value="rejected">
                  {renderOrdersTable(rejectedOrders, false, true)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </DialogTitle>
              <DialogDescription>
                Order ID: {selectedOrder?.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Design Preview with Download */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Design File
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadDesign(selectedOrder.design_url)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <img 
                      src={selectedOrder.design_url} 
                      alt="Order design" 
                      className="max-h-48 mx-auto rounded object-contain"
                    />
                  </div>
                </div>

                {/* Listing Details */}
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : listingDetails && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Venue Listing
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="font-medium text-lg">{listingDetails.title}</p>
                      {listingDetails.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listingDetails.location}
                        </p>
                      )}
                      {listingDetails.description && (
                        <p className="text-sm text-muted-foreground">{listingDetails.description}</p>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => window.open(`/venue/${listingDetails.id}`, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Listing
                      </Button>
                    </div>
                  </div>
                )}

                {/* Publisher Contact */}
                {publisherContact && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Publisher Contact
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="font-medium">{publisherContact.business_name}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${publisherContact.contact_email}`} className="text-primary hover:underline">
                          {publisherContact.contact_email}
                        </a>
                      </div>
                      {publisherContact.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${publisherContact.contact_phone}`} className="text-primary hover:underline">
                            {publisherContact.contact_phone}
                          </a>
                        </div>
                      )}
                      {publisherContact.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {publisherContact.location}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Product Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Product</h4>
                    <p className="text-lg">{selectedOrder.product_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.product_sku}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Quantity</h4>
                    <p className="text-lg">{selectedOrder.quantity} units</p>
                  </div>
                </div>

                {/* Specs */}
                {selectedOrder.product_specs && (
                  <div>
                    <h4 className="font-medium mb-2">Specifications</h4>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      {Object.entries(selectedOrder.product_specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{selectedOrder.shipping_address.recipientName}</p>
                    <p>{selectedOrder.shipping_address.line1}</p>
                    {selectedOrder.shipping_address.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                    <p>
                      {selectedOrder.shipping_address.city}
                      {selectedOrder.shipping_address.state && `, ${selectedOrder.shipping_address.state}`}
                      {" "}{selectedOrder.shipping_address.postalCode}
                    </p>
                    <p>{selectedOrder.shipping_country}</p>
                    {selectedOrder.shipping_address.email && (
                      <p className="mt-2 text-muted-foreground">{selectedOrder.shipping_address.email}</p>
                    )}
                    {selectedOrder.shipping_address.phone && (
                      <p className="text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                    )}
                  </div>
                </div>

                {/* Admin Controls */}
                <div className="border-t pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PrintOrderStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_admin">Pending Review</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Final Price (₱)
                      </label>
                      <Input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="Enter final price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about this order..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    {selectedOrder.order_status === "pending_admin" && (
                      <>
                        <Button 
                          onClick={handleApproveAndInvoice}
                          disabled={updating || !newPrice}
                          className="flex-1"
                        >
                          {updating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve & Invoice
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleRejectOrder}
                          disabled={updating}
                        >
                          {updating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline"
                      onClick={handleUpdateOrder}
                      disabled={updating}
                      className={selectedOrder.order_status === "pending_admin" ? "" : "flex-1"}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminOrders;
