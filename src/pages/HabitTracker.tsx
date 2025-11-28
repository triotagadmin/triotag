import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, TrendingUp } from "lucide-react";
import screen1 from "@/assets/habit-tracker-screen-1.png";
import screen2 from "@/assets/habit-tracker-screen-2.png";
import screen3 from "@/assets/habit-tracker-screen-3.png";
import heroBg from "@/assets/habit-tracker-hero-bg.jpg";

const HabitTracker = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transform Your Day,<br />One Habit at a Time
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Stop letting another day slip by. Join thousands who've already taken control of their lives. 
            Your future self will thank you for starting today.
          </p>
          <Button size="lg" className="text-lg px-8 py-6 group">
            Download Now
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Feature 1: Track with Ease */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src={screen1} 
                alt="Habit tracking interface" 
                className="w-full max-w-sm mx-auto drop-shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Track Your Habits Effortlessly
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                No more forgotten promises to yourself. Our intuitive interface makes it impossible to 
                ignore your goals. Every tap brings you closer to the person you've always wanted to become. 
                Simple. Powerful. Life-changing.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  One-tap check-ins that respect your time
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Beautiful interface that motivates action
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Works offline—no excuses, anywhere
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Visualize Progress */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Watch Your Progress Soar
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                There's nothing quite like seeing your success in living color. Our analytics don't just 
                track numbers—they tell the story of your transformation. Watch your streaks grow. 
                Celebrate every milestone. Feel the momentum building.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Streak counters that fuel your fire
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Beautiful charts that show real progress
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Achievement badges you'll actually be proud of
                </li>
              </ul>
            </div>
            <div>
              <img 
                src={screen2} 
                alt="Progress analytics and charts" 
                className="w-full max-w-sm mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Never Miss a Beat */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src={screen3} 
                alt="Smart reminders and notifications" 
                className="w-full max-w-sm mx-auto drop-shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Never Forget, Never Fail
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Life gets busy. We get it. That's why our smart reminders feel like a friend checking in, 
                not another notification to dismiss. Gentle nudges at just the right time. 
                Motivational quotes when you need them most. Your personal accountability partner, 24/7.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Smart timing that fits your schedule
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Motivational messages that actually inspire
                </li>
                <li className="flex items-center text-foreground">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Customizable to match your style
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Change Your Life?
          </h2>
          <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Every moment you wait is another moment lost. The best time to start was yesterday. 
            The second best time is right now. Download the app and take the first step toward 
            the life you deserve.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6 mb-12 group"
          >
            Download Now - It's Free
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Trust Elements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-primary-foreground/20">
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-primary-foreground/90 font-semibold">4.9/5 Rating</p>
              <p className="text-primary-foreground/70 text-sm">Based on 50,000+ reviews</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-primary-foreground mb-2" />
              <p className="text-primary-foreground/90 font-semibold">2M+ Users</p>
              <p className="text-primary-foreground/70 text-sm">Building better habits daily</p>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8 text-primary-foreground mb-2" />
              <p className="text-primary-foreground/90 font-semibold">85% Success Rate</p>
              <p className="text-primary-foreground/70 text-sm">Achieve their habit goals</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 text-left">
              <p className="text-primary-foreground/90 italic mb-3">
                "This app changed my life. I finally have the discipline I always wanted. 
                6 months in and I've never felt better."
              </p>
              <p className="text-primary-foreground/70 text-sm font-semibold">- Sarah M., Marathon Runner</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-6 text-left">
              <p className="text-primary-foreground/90 italic mb-3">
                "Simple, effective, and actually works. No gimmicks, just results. 
                Worth every second I spend on it."
              </p>
              <p className="text-primary-foreground/70 text-sm font-semibold">- James T., Entrepreneur</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HabitTracker;
