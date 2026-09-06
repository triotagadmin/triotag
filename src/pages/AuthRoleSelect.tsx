import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ArrowLeft } from "lucide-react";

const AuthRoleSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-6">
      <div className="w-full max-w-2xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-white hover:bg-white/5 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        <Card className="border-green-500/20 bg-black/60 backdrop-blur">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl text-white">Welcome to TrioTag</CardTitle>
            <CardDescription className="text-zinc-400">
              Choose how you want to use the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="h-auto flex-col items-start gap-4 p-6 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-500/50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-lg font-semibold text-white">Brand</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                I am a Brand looking for advertising
              </p>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              className="h-auto flex-col items-start gap-4 p-6 border-green-500/30 bg-black/40 hover:bg-green-500/10 hover:border-green-500/50 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-lg font-semibold text-white">Publisher</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                I am an Publisher looking for partnership
              </p>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthRoleSelect;
