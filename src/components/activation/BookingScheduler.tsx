import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { CalendarIcon, Clock, Calculator, DollarSign, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { shouldDisableDate, getMinimumBookingDate } from "@/lib/businessDays";
import { getCurrencySymbol } from "@/hooks/useCurrencyConversion";

export interface BranchLocation {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface BookingSchedulerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDatesChange: (start: Date | undefined, end: Date | undefined) => void;
  pricing: any;
  adUnitType?: string;
  quantity?: number;
  onEstimatedPayoutChange?: (payout: number) => void;
  currency?: string;
  branches?: BranchLocation[];
  selectedBranchIds?: Set<string>;
  onSelectedBranchIdsChange?: (ids: Set<string>) => void;
}

export function BookingScheduler({
  startDate,
  endDate,
  onDatesChange,
  pricing,
  adUnitType,
  quantity = 1,
  onEstimatedPayoutChange,
  currency,
  branches = [],
  selectedBranchIds = new Set(),
  onSelectedBranchIdsChange,
}: BookingSchedulerProps) {
  const minDate = getMinimumBookingDate();
  const sym = getCurrencySymbol(currency);

  const handleStartDateSelect = (date: Date | undefined) => {
    onDatesChange(date, endDate);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onDatesChange(startDate, date);
  };

  const toggleBranch = (branchId: string) => {
    const next = new Set(selectedBranchIds);
    if (next.has(branchId)) next.delete(branchId);
    else next.add(branchId);
    onSelectedBranchIdsChange?.(next);
  };

  const selectAllBranches = () => {
    onSelectedBranchIdsChange?.(new Set(branches.map((b) => b.id)));
  };

  const deselectAllBranches = () => {
    onSelectedBranchIdsChange?.(new Set());
  };

  // Calculate duration
  const duration = useMemo(() => {
    if (!startDate || !endDate) return null;
    const days = differenceInDays(endDate, startDate) + 1;
    const hours = differenceInHours(endDate, startDate);
    const weeks = Math.ceil(days / 7);
    return { days, hours, weeks };
  }, [startDate, endDate]);

  // Per-location fee (for 1 location)
  const perLocationFee = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const days = differenceInDays(endDate, startDate) + 1;
    const weeks = Math.ceil(days / 7);

    const adUnits = pricing?.ad_units || [];
    const selectedAdUnit = adUnits.find((unit: any) => unit.type === adUnitType) || adUnits[0];

    const weeklyRate =
      selectedAdUnit?.pricePerWeek ||
      selectedAdUnit?.weekly_subscription_fee ||
      pricing?.weekly ||
      pricing?.pricePerWeek ||
      pricing?.weekly_lease_price ||
      0;

    const monthlyRate =
      selectedAdUnit?.pricePerMonth ||
      selectedAdUnit?.monthly_subscription_fee ||
      pricing?.monthly ||
      pricing?.pricePerMonth ||
      pricing?.monthly_subscription_fee ||
      pricing?.monthly_lease_price ||
      0;

    const dailyRate = pricing?.daily || (weeklyRate > 0 ? weeklyRate / 7 : 0);

    if (weeklyRate === 0 && monthlyRate === 0 && dailyRate === 0) return 0;

    let total = 0;
    if (weeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(weeks / 4);
      const remainingWeeks = weeks % 4;
      total = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
    } else if (weeks >= 1 && weeklyRate > 0) {
      total = weeks * weeklyRate;
    } else if (dailyRate > 0) {
      total = days * dailyRate;
    }
    return total;
  }, [startDate, endDate, pricing, adUnitType]);

  // Total fee = selected locations × per-location fee
  const selectedCount = branches.length > 0 ? selectedBranchIds.size : 1;
  const totalFee = perLocationFee * selectedCount;

  // Notify parent of payout changes
  useEffect(() => {
    if (onEstimatedPayoutChange) {
      onEstimatedPayoutChange(totalFee);
    }
  }, [totalFee, onEstimatedPayoutChange]);

  const hasBranches = branches.length > 0;

  return (
    <div className="space-y-6">
      {/* Branch Location Selection */}
      {hasBranches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select Branch Locations
            </CardTitle>
            <CardDescription>
              Choose the locations you want to advertise at. The total ad space fee is calculated per selected location.
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={selectAllBranches}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllBranches}>
                Deselect All
              </Button>
              <Badge variant="secondary" className="ml-auto">
                {selectedBranchIds.size} / {branches.length} selected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {branches.map((branch) => {
              const isSelected = selectedBranchIds.has(branch.id);
              return (
                <div
                  key={branch.id}
                  className={cn(
                    "p-3 rounded-[14px] border-2 cursor-pointer transition-all flex items-center gap-3",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                  onClick={() => toggleBranch(branch.id)}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleBranch(branch.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{branch.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {branch.city || branch.address}
                    </p>
                  </div>
                  {perLocationFee > 0 && (
                    <Badge variant="outline" className="shrink-0">
                      {sym}{perLocationFee.toLocaleString()}
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Booking Schedule & Duration
          </CardTitle>
          <CardDescription>
            Select your campaign dates. A 5 business day leeway is required for printing and delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Earliest available date info */}
          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Earliest available date: <span className="font-medium text-foreground">{format(minDate, "PPP")}</span>
            </p>
          </div>

          {/* Date pickers */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    disabled={shouldDisableDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => shouldDisableDate(date) || (startDate ? date < startDate : false)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration display */}
          {duration && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium">Total Duration (Auto-calculated)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-lg py-1 px-3">
                    {duration.days} day{duration.days !== 1 ? 's' : ''}
                  </Badge>
                  {duration.weeks > 0 && (
                    <Badge variant="secondary" className="text-lg py-1 px-3">
                      {duration.weeks} week{duration.weeks !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-lg py-1 px-3">
                    ~{duration.hours.toLocaleString()} hours
                  </Badge>
                </div>
              </div>

              {/* Preview of active campaign dates */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Preview of Active Campaign Dates
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    {format(startDate!, "MMM d, yyyy")}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="default">
                    {format(endDate!, "MMM d, yyyy")}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Cost Calculation */}
          {totalFee > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Ad Space Lease Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const adUnits = pricing?.ad_units || [];
                  const selectedUnit = adUnits.find((u: any) => u.type === adUnitType) || adUnits[0];
                  const weeklyRate = selectedUnit?.pricePerWeek || selectedUnit?.weekly_subscription_fee || pricing?.weekly || pricing?.pricePerWeek || pricing?.weekly_lease_price || 0;
                  const monthlyRate = selectedUnit?.pricePerMonth || selectedUnit?.monthly_subscription_fee || pricing?.monthly || pricing?.pricePerMonth || pricing?.monthly_lease_price || 0;
                  const weeks = duration?.weeks || 0;
                  const useMonthly = weeks >= 4 && monthlyRate > 0;
                  const fullMonths = Math.floor(weeks / 4);
                  const remainingWeeks = weeks % 4;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rate per location</span>
                        <span>
                          {useMonthly
                            ? `${sym}${monthlyRate.toLocaleString()}/month`
                            : `${sym}${weeklyRate.toLocaleString()}/week`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{weeks} week{weeks !== 1 ? 's' : ''}</span>
                      </div>
                      {hasBranches && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Selected locations</span>
                          <span>{selectedCount} location{selectedCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t font-medium text-base">
                        <span className="text-muted-foreground">Breakdown</span>
                        <span>
                          {hasBranches
                            ? `${sym}${perLocationFee.toLocaleString()} × ${selectedCount} location${selectedCount !== 1 ? 's' : ''}`
                            : useMonthly
                              ? `${sym}${monthlyRate.toLocaleString()} × ${fullMonths} mo${remainingWeeks > 0 ? ` + ${sym}${weeklyRate.toLocaleString()} × ${remainingWeeks} wk` : ''}`
                              : `${sym}${weeklyRate.toLocaleString()} × ${weeks} wk`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Ad Space Lease Fee</span>
                    <span className="text-2xl font-bold text-primary">
                      {sym}{totalFee.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This value will be stored with your campaign record
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
