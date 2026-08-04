import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminAuditLog = () => {
  const navigate = useNavigate();

  // Placeholder - will be connected to database
  const mockAuditLogs = [
    {
      id: "1",
      action: "Payment gateway updated",
      details: "Stripe account changed",
      user: "admin@triotag.com",
      timestamp: new Date().toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payment Gateway Audit Log
            </CardTitle>
            <CardDescription>
              Track all changes made to payment gateway configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mockAuditLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs found</p>
            ) : (
              <div className="space-y-4">
                {mockAuditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{log.action}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">By: {log.user}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuditLog;
