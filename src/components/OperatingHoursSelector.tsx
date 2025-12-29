import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Copy, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TimeRange {
  start: string;
  end: string;
}

interface DaySchedule {
  open: boolean;
  ranges: TimeRange[];
  overnight?: boolean;
}

export interface OperatingHoursData {
  [key: string]: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface OperatingHoursSelectorProps {
  value: OperatingHoursData | null;
  onChange: (data: OperatingHoursData) => void;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

// Generate time options in 30-minute intervals (24-hour format)
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

const defaultDaySchedule: DaySchedule = {
  open: false,
  ranges: [],
};

const defaultSchedule: OperatingHoursData = {
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { ...defaultDaySchedule },
  sunday: { ...defaultDaySchedule },
};

export const OperatingHoursSelector = ({ value, onChange }: OperatingHoursSelectorProps) => {
  const [schedule, setSchedule] = useState<OperatingHoursData>(value || defaultSchedule);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (value) {
      setSchedule(value);
    }
  }, [value]);

  const updateSchedule = (newSchedule: OperatingHoursData) => {
    setSchedule(newSchedule);
    onChange(newSchedule);
    validateSchedule(newSchedule);
  };

  const isOvernight = (start: string, end: string): boolean => {
    return end < start;
  };

  const rangesOverlap = (range1: TimeRange, range2: TimeRange): boolean => {
    const start1 = parseInt(range1.start.replace(":", ""));
    const end1 = parseInt(range1.end.replace(":", ""));
    const start2 = parseInt(range2.start.replace(":", ""));
    const end2 = parseInt(range2.end.replace(":", ""));

    // For same-day ranges (not overnight)
    if (!isOvernight(range1.start, range1.end) && !isOvernight(range2.start, range2.end)) {
      return !(end1 <= start2 || end2 <= start1);
    }
    
    // For overnight ranges, more complex overlap check needed
    return false; // Simplified - allow overnight ranges
  };

  const validateSchedule = (sched: OperatingHoursData) => {
    const errors: Record<string, string[]> = {};

    DAYS.forEach(({ key }) => {
      const day = sched[key];
      const dayErrors: string[] = [];

      if (day.open) {
        if (day.ranges.length === 0) {
          dayErrors.push("Please add at least one time range");
        }

        day.ranges.forEach((range, idx) => {
          if (!range.start || !range.end) {
            dayErrors.push(`Range ${idx + 1}: Please select both start and end times`);
          } else if (!isOvernight(range.start, range.end) && range.end <= range.start) {
            dayErrors.push(`Range ${idx + 1}: End time must be later than start time (or set overnight hours)`);
          }
        });

        // Check for overlapping ranges (same-day only)
        for (let i = 0; i < day.ranges.length; i++) {
          for (let j = i + 1; j < day.ranges.length; j++) {
            if (day.ranges[i].start && day.ranges[i].end && 
                day.ranges[j].start && day.ranges[j].end &&
                !isOvernight(day.ranges[i].start, day.ranges[i].end) &&
                !isOvernight(day.ranges[j].start, day.ranges[j].end)) {
              if (rangesOverlap(day.ranges[i], day.ranges[j])) {
                dayErrors.push(`Ranges ${i + 1} and ${j + 1} overlap`);
              }
            }
          }
        }
      }

      if (dayErrors.length > 0) {
        errors[key] = dayErrors;
      }
    });

    setValidationErrors(errors);
  };

  const toggleDayOpen = (dayKey: keyof OperatingHoursData) => {
    const newSchedule = { ...schedule };
    newSchedule[dayKey] = {
      ...newSchedule[dayKey],
      open: !newSchedule[dayKey].open,
      ranges: !newSchedule[dayKey].open ? [{ start: "09:00", end: "17:00" }] : [],
    };
    updateSchedule(newSchedule);
  };

  const addTimeRange = (dayKey: keyof OperatingHoursData) => {
    const newSchedule = { ...schedule };
    newSchedule[dayKey] = {
      ...newSchedule[dayKey],
      ranges: [...newSchedule[dayKey].ranges, { start: "", end: "" }],
    };
    updateSchedule(newSchedule);
  };

  const removeTimeRange = (dayKey: keyof OperatingHoursData, rangeIndex: number) => {
    const newSchedule = { ...schedule };
    newSchedule[dayKey] = {
      ...newSchedule[dayKey],
      ranges: newSchedule[dayKey].ranges.filter((_, i) => i !== rangeIndex),
    };
    updateSchedule(newSchedule);
  };

  const updateTimeRange = (
    dayKey: keyof OperatingHoursData,
    rangeIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    const newSchedule = { ...schedule };
    const newRanges = [...newSchedule[dayKey].ranges];
    newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: value };
    
    // Check if this creates an overnight range
    const range = newRanges[rangeIndex];
    const overnight = range.start && range.end && isOvernight(range.start, range.end);
    
    newSchedule[dayKey] = {
      ...newSchedule[dayKey],
      ranges: newRanges,
      overnight: overnight || newRanges.some(r => r.start && r.end && isOvernight(r.start, r.end)),
    };
    updateSchedule(newSchedule);
  };

  const copyToAllDays = (sourceDay: keyof OperatingHoursData) => {
    const sourceSchedule = schedule[sourceDay];
    const newSchedule = { ...schedule };
    DAYS.forEach(({ key }) => {
      newSchedule[key] = { ...sourceSchedule };
    });
    updateSchedule(newSchedule);
  };

  const copyToWeekdays = (sourceDay: keyof OperatingHoursData) => {
    const sourceSchedule = schedule[sourceDay];
    const newSchedule = { ...schedule };
    WEEKDAYS.forEach((key) => {
      newSchedule[key as keyof OperatingHoursData] = { ...sourceSchedule };
    });
    updateSchedule(newSchedule);
  };

  const formatTimeDisplay = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minutes} ${suffix}`;
  };

  const getDaySummary = (day: DaySchedule): string => {
    if (!day.open) return "Closed";
    if (day.ranges.length === 0) return "No hours set";
    
    return day.ranges
      .map((r) => {
        if (!r.start || !r.end) return "Incomplete";
        const overnight = isOvernight(r.start, r.end);
        return `${formatTimeDisplay(r.start)} - ${formatTimeDisplay(r.end)}${overnight ? " (overnight)" : ""}`;
      })
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">Operating Hours *</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set your venue's operating hours for each day of the week. Supports split shifts and overnight hours.
        </p>
      </div>

      {DAYS.map(({ key, label }) => {
        const daySchedule = schedule[key];
        const errors = validationErrors[key] || [];

        return (
          <Card key={key} className={errors.length > 0 ? "border-destructive" : ""}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Day header with toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={daySchedule.open}
                      onCheckedChange={() => toggleDayOpen(key)}
                    />
                    <Label className="font-medium text-base">{label}</Label>
                  </div>
                  
                  {/* Copy buttons */}
                  {daySchedule.open && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => copyToAllDays(key)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy to all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => copyToWeekdays(key)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Mon-Fri
                      </Button>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <p className="text-sm text-muted-foreground pl-11">
                  {getDaySummary(daySchedule)}
                </p>

                {/* Time ranges */}
                {daySchedule.open && (
                  <div className="space-y-3 pl-11">
                    {daySchedule.ranges.map((range, rangeIndex) => (
                      <div key={rangeIndex} className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={range.start}
                          onValueChange={(val) => updateTimeRange(key, rangeIndex, "start", val)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Start" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`start-${time}`} value={time}>
                                {formatTimeDisplay(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span className="text-muted-foreground">to</span>

                        <Select
                          value={range.end}
                          onValueChange={(val) => updateTimeRange(key, rangeIndex, "end", val)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="End" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={`end-${time}`} value={time}>
                                {formatTimeDisplay(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {range.start && range.end && isOvernight(range.start, range.end) && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-900/20 dark:text-amber-400">
                            Overnight
                          </span>
                        )}

                        {daySchedule.ranges.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeTimeRange(key, rangeIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addTimeRange(key)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add another time range
                    </Button>
                  </div>
                )}

                {/* Validation errors */}
                {errors.length > 0 && (
                  <div className="pl-11 space-y-1">
                    {errors.map((error, i) => (
                      <p key={i} className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> For overnight hours (e.g., 8 PM - 2 AM), select a start time later than the end time. 
          The system will automatically recognize this as extending to the next day.
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Helper to convert OperatingHoursData to string for display
export const formatOperatingHoursToString = (data: OperatingHoursData | null): string => {
  if (!data) return "";
  
  const days = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ] as const;

  return days
    .map(({ key, label }) => {
      const day = data[key];
      if (!day.open) return `${label}: Closed`;
      if (day.ranges.length === 0) return `${label}: Not set`;
      
      const rangeStr = day.ranges
        .map((r) => {
          if (!r.start || !r.end) return "Not set";
          return `${r.start}-${r.end}`;
        })
        .join(", ");
      
      return `${label}: ${rangeStr}`;
    })
    .join("; ");
};

// Validate if schedule has at least one open day with valid ranges
export const isValidOperatingHours = (data: OperatingHoursData | null): boolean => {
  if (!data) return false;
  
  const hasOpenDay = Object.values(data).some((day) => {
    if (!day.open) return false;
    if (day.ranges.length === 0) return false;
    return day.ranges.every((r) => r.start && r.end);
  });
  
  return hasOpenDay;
};
