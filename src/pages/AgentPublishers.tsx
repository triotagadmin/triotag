import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Sparkles, UserCircle, Palette } from "lucide-react";

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
            Work with freelance placement agents who execute independent campaigns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Guerrilla Agents</CardTitle>
              <CardDescription>Freelance agents executing unconventional street placements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Active placements</p>
              <Button className="w-full mt-4">Explore</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Influencers</CardTitle>
              <CardDescription>Freelance influencers promoting brands through social platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Active partnerships</p>
              <Button className="w-full mt-4">Explore</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Models</CardTitle>
              <CardDescription>Independent brand ambassadors and promotional models</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Active campaigns</p>
              <Button className="w-full mt-4">Explore</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Artists</CardTitle>
              <CardDescription>Freelance artists creating branded creative installations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">Active projects</p>
              <Button className="w-full mt-4">Explore</Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started as a Freelance Agent</CardTitle>
              <CardDescription>Execute independent placement campaigns across multiple channels</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-medium">Choose your placement type</p>
                    <p className="text-sm text-muted-foreground">Work as a guerrilla agent, influencer, model, or artist executing campaigns independently</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-medium">Build your profile</p>
                    <p className="text-sm text-muted-foreground">Showcase your reach, style, and past campaign results as a freelance agent</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-medium">Execute placements</p>
                    <p className="text-sm text-muted-foreground">Connect with advertisers and execute creative independent campaigns</p>
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
