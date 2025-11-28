import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/habit-tracker-hero-bg.jpg";

const HabitTracker = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Background Section */}
      <section 
        className="relative overflow-hidden py-32 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
      </section>

      {/* Main CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950/20 via-background to-blue-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Master the Markets with<br />AI-Powered Trading Philosophy
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop gambling with your capital. Join elite traders who leverage cutting-edge AI to develop 
            winning philosophies and execute with confidence. Your profitable trading journey starts here.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 group bg-blue-600 hover:bg-blue-700" asChild>
            <Link to="/trading-ai">
              Start Trading Smarter
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Link 
              to="/install"
              className="transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-14"
              />
            </Link>
            <Link 
              to="/install"
              className="transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="Download on the App Store" 
                className="h-14"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature 1: Real-Time Market Intelligence */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Real-Time AI Market Analysis
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Stop trading blind. Our AI analyzes thousands of data points every second, delivering 
            actionable insights directly to your fingertips. See what institutional traders see. 
            Make decisions backed by intelligence, not emotion.
          </p>
          <ul className="space-y-3 max-w-xl mx-auto text-left">
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Live market sentiment analysis across all assets
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              AI-powered pattern recognition in milliseconds
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Smart alerts for high-probability setups
            </li>
          </ul>
        </div>
      </section>

      {/* Feature 2: Philosophy-Driven Strategy */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Build Your Winning Philosophy
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Successful traders don't chase signals—they follow philosophy. Our AI helps you develop 
            and refine your trading approach based on proven principles, backtested strategies, and 
            your personal risk tolerance. Transform from reactive to strategic.
          </p>
          <ul className="space-y-3 max-w-xl mx-auto text-left">
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Performance analytics revealing your edge
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Risk management tailored to your goals
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Strategy optimization based on market conditions
            </li>
          </ul>
        </div>
      </section>

      {/* Feature 3: Your AI Trading Mentor */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your 24/7 AI Trading Mentor
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Questions about a trade? Market moving against you? Need validation on your analysis? 
            Our AI assistant is like having a seasoned trading mentor in your pocket. Get instant, 
            intelligent guidance without the emotional bias. Available whenever inspiration—or doubt—strikes.
          </p>
          <ul className="space-y-3 max-w-xl mx-auto text-left">
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Conversational AI trained on trading psychology
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Instant analysis of your trade setups
            </li>
            <li className="flex items-center text-foreground">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Personalized coaching based on your history
            </li>
          </ul>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Trade Like a Pro?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Every trade you place without AI is a trade at a disadvantage. The market doesn't wait. 
            Join elite traders who've discovered the edge that separates amateurs from professionals. 
            Your most profitable chapter starts now.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6 mb-8 group bg-white text-blue-900 hover:bg-gray-100"
            asChild
          >
            <Link to="/trading-ai">
              Get Early Access Now
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link 
              to="/install"
              className="transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-14"
              />
            </Link>
            <Link 
              to="/install"
              className="transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="Download on the App Store" 
                className="h-14"
              />
            </Link>
          </div>

          {/* Trust Elements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-white/20">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-white/90 font-semibold">4.9/5 Rating</p>
              <p className="text-white/70 text-sm">From verified traders</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-white mb-2" />
              <p className="text-white/90 font-semibold">50K+ Traders</p>
              <p className="text-white/70 text-sm">Using AI daily for edge</p>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8 text-white mb-2" />
              <p className="text-white/90 font-semibold">37% Avg. Improvement</p>
              <p className="text-white/70 text-sm">In trading performance</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-left">
              <p className="text-white/90 italic mb-3">
                "The AI caught patterns I never would have seen. My win rate jumped from 52% to 68% 
                in three months. This isn't just an app—it's a game changer."
              </p>
              <p className="text-white/70 text-sm font-semibold">- Michael R., Day Trader</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-left">
              <p className="text-white/90 italic mb-3">
                "Finally stopped revenge trading and emotional decisions. The AI mentor keeps me 
                disciplined. Best trading tool I've ever invested in."
              </p>
              <p className="text-white/70 text-sm font-semibold">- Jessica L., Swing Trader</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HabitTracker;
