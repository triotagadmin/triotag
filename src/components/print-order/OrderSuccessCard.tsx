import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OrderSuccessCardProps {
  orderId: string;
  productName: string;
  quantity: number;
  onNewOrder?: () => void;
}

export const OrderSuccessCard = ({ orderId, productName, quantity, onNewOrder }: OrderSuccessCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-primary max-w-xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Order Received!</CardTitle>
        <CardDescription className="text-base">
          Our team is reviewing your design. You will be notified once we move to the Payment step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Product</span>
            <span className="font-medium">{productName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">{quantity} units</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-yellow-500">Pending Admin Review</span>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">What happens next?</p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>Our team reviews your design file</li>
                <li>We confirm print specifications</li>
                <li>You receive an invoice for payment</li>
                <li>Production begins after payment</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/retailer-dashboard")}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          {onNewOrder && (
            <Button variant="ghost" onClick={onNewOrder} className="w-full">
              Place Another Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
