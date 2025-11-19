import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Building2, BarChart3 } from "lucide-react";

const AgentPublishers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="font-bold text-xl">Agent Publishers</h1>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4">Agent Publishers</h2>
          <p className="text-xl text-muted-foreground">
            Manage multiple venues and maximize your network reach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Venue Network</CardTitle>
              <CardDescription>Manage your venue portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Venues in network</p>
              <Button className="w-full mt-4">Add Venue</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Monitor running campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Campaigns active</p>
              <Button variant="outline" className="w-full mt-4">View All</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Network Revenue</CardTitle>
              <CardDescription>Track total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground">This month</p>
              <Button variant="outline" className="w-full mt-4">View Breakdown</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started as an Agent</CardTitle>
              <CardDescription>Build and grow your venue network</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium">Build your network</p>
                    <p className="text-sm text-muted-foreground">Add multiple venues to your portfolio for maximum reach</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium">Create packages</p>
                    <p className="text-sm text-muted-foreground">Offer bundled advertising across multiple locations</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium">Connect with advertisers</p>
                    <p className="text-sm text-muted-foreground">Attract larger campaigns with your network reach</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentPublishers;
