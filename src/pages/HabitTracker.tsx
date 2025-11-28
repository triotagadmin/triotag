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
        description: "Please enter a habit name",
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
      title: "Success",
      description: "Habit added successfully",
    });
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((h) => h.id !== id));
    toast({
      title: "Deleted",
      description: "Habit removed",
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Habit Tracker
          </h1>
          <p className="text-muted-foreground">
            Build consistency, one day at a time
          </p>
        </div>

        {/* Add Habit Section */}
        <Card className="p-6 mb-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter new habit..."
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addHabit()}
              className="flex-1"
            />
            <Button onClick={addHabit} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </Card>

        {/* Habits List */}
        {habits.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No habits yet. Add your first habit to get started!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(today);
              const streak = calculateStreak(habit.completedDates);

              return (
                <Card
                  key={habit.id}
                  className={`p-6 transition-all ${
                    isCompletedToday
                      ? "bg-primary/10 border-primary"
                      : "hover:border-primary/50"
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
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-muted-foreground">
                            {streak} day streak
                          </span>
                          <span className="text-sm text-muted-foreground">
                            • {habit.completedDates.length} total completions
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
          <Card className="mt-8 p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Today's Progress
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {habits.filter((h) => h.completedDates.includes(today)).length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {habits.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Habits</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">
                  {Math.round(
                    (habits.filter((h) => h.completedDates.includes(today))
                      .length /
                      habits.length) *
                      100
                  )}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
