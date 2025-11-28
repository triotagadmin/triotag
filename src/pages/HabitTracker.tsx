import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
  completedDates: string[];
  createdAt: string;
}

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const stored = localStorage.getItem("habits");
    if (stored) {
      setHabits(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newHabitName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an ad preference",
        variant: "destructive",
      });
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    setHabits([...habits, newHabit]);
    setNewHabitName("");
    toast({
      title: "Preference Added",
      description: "Your ad preference has been saved",
    });
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
    toast({
      title: "Removed",
      description: "Ad preference removed",
    });
  };

  const toggleHabitCompletion = (id: string) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const isCompleted = habit.completedDates.includes(today);
          return {
            ...habit,
            completedDates: isCompleted
              ? habit.completedDates.filter((date) => date !== today)
              : [...habit.completedDates, today],
          };
        }
        return habit;
      })
    );
  };

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;

    const sortedDates = [...completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            AI Adstreem
          </h1>
          <p className="text-xl text-foreground font-medium">
            Choose Your Own Ads, Power Your Experience
          </p>
          <p className="text-muted-foreground mt-2 mb-6">
            Take control of your advertising experience with AI-powered personalization
          </p>
          
          {/* App Store Buttons */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <a 
              href="https://play.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                alt="Get it on Google Play" 
                className="h-14"
              />
            </a>
            <a 
              href="https://apps.apple.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block transition-transform hover:scale-105"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                alt="Download on the App Store" 
                className="h-14"
              />
            </a>
          </div>
        </div>

        {/* Add Ad Preference Section */}
        <Card className="p-6 mb-6 bg-card/95 backdrop-blur-xl border-primary/30 shadow-xl shadow-primary/10">
          <h3 className="text-2xl font-bold text-foreground mb-1 text-center">
            Ad Tracker
          </h3>
          <div className="flex gap-3 mb-3">
            <Input
              placeholder="Enter ad category or brand you want to see..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addHabit()}
              className="flex-1 border-accent/40 focus:border-primary"
            />
            <Button onClick={addHabit} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4 mr-2" />
              Choose Ad
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Track your advertising campaigns, one day at a time
          </p>
        </Card>

        {/* Ad Preferences List */}
        {habits.length === 0 ? (
          <Card className="p-12 text-center bg-card/95 backdrop-blur-xl border-accent/20">
            <div className="max-w-md mx-auto">
              <p className="text-foreground text-lg font-medium mb-2">
                No ad preferences yet
              </p>
              <p className="text-muted-foreground">
                Start choosing the ads you want to see! Add your favorite brands, products, or categories above.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(today);
              const streak = calculateStreak(habit.completedDates);

              return (
                <Card
                  key={habit.id}
                  className={`p-6 transition-all bg-card/95 backdrop-blur-xl ${
                    isCompletedToday
                      ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                      : "border-accent/20 hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={isCompletedToday}
                        onCheckedChange={() => toggleHabitCompletion(habit.id)}
                        className="w-6 h-6"
                      />
                      <div className="flex-1">
                        <h3
                          className={`text-lg font-semibold ${
                            isCompletedToday
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {habit.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Flame className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {streak} day engagement streak
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {habit.completedDates.length} times viewed
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats Section */}
        {habits.length > 0 && (
          <Card className="mt-8 p-6 bg-gradient-to-br from-card/95 to-primary/5 backdrop-blur-xl border-primary/30 shadow-xl">
            <h3 className="text-xl font-semibold text-primary mb-4">
              Today's Ad Engagement
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-4xl font-bold text-primary">
                  {habits.filter((h) => h.completedDates.includes(today)).length}
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Ads Viewed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-4xl font-bold text-accent">
                  {habits.length}
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Preferences</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {Math.round(
                    (habits.filter((h) => h.completedDates.includes(today))
                      .length /
                      habits.length) *
                      100
                  )}
                  %
                </p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Engagement Rate</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
