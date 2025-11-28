import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-background to-blue-900/10 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Link to="/habit-tracker">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-blue-500/20 p-6 rounded-full mb-6">
              <Smartphone className="w-16 h-16 text-blue-500" />
            </div>

            <h1 className="text-3xl font-bold mb-4">Install Trading AI</h1>
            
            {isInstalled ? (
              <div className="space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg text-muted-foreground">
                  App is already installed! You can now use it from your home screen.
                </p>
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/trading-ai">Open App</Link>
                </Button>
              </div>
            ) : isInstallable ? (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground mb-6">
                  Install Trading AI on your device for quick access and offline functionality. 
                  Get instant access to your AI trading mentor anytime, anywhere.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleInstallClick}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground mb-6">
                  Trading AI can be installed on your device for the best experience.
                </p>
                
                <div className="text-left space-y-4 w-full">
                  <h3 className="font-semibold text-lg">How to install:</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 rounded-full p-2 mt-1">
                        <span className="text-blue-500 font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-medium">On iPhone (Safari):</p>
                        <p className="text-sm text-muted-foreground">
                          Tap the Share button, then "Add to Home Screen"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500/20 rounded-full p-2 mt-1">
                        <span className="text-blue-500 font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-medium">On Android (Chrome):</p>
                        <p className="text-sm text-muted-foreground">
                          Tap the menu (⋮), then "Install app" or "Add to Home screen"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 mt-6">
                  <Link to="/trading-ai">Continue to App</Link>
                </Button>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Works Offline</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Fast Loading</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Home Screen</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;
