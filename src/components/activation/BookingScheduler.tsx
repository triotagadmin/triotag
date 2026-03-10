import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { CalendarIcon, Clock, Calculator, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { shouldDisableDate, getMinimumBookingDate } from "@/lib/businessDays";
import { getCurrencySymbol } from "@/hooks/useCurrencyConversion";

interface BookingSchedulerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDatesChange: (start: Date | undefined, end: Date | undefined) => void;
  pricing: any;
  adUnitType?: string;
  quantity?: number;
  onEstimatedPayoutChange?: (payout: number) => void;
  currency?: string;
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
}: BookingSchedulerProps) {
  const minDate = getMinimumBookingDate();
  const sym = getCurrencySymbol(currency);

  const handleStartDateSelect = (date: Date | undefined) => {
    onDatesChange(date, endDate);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onDatesChange(startDate, date);
  };

  // Calculate duration
  const duration = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    const days = differenceInDays(endDate, startDate) + 1;
    const hours = differenceInHours(endDate, startDate);
    const weeks = Math.ceil(days / 7);
    
    return { days, hours, weeks };
  }, [startDate, endDate]);

  // Calculate estimated payout based on ad unit pricing and duration
  const estimatedPayout = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const days = differenceInDays(endDate, startDate) + 1;
    const weeks = Math.ceil(days / 7);

    // Get pricing from multiple possible sources
    // 1. Check pricing.ad_units array (new format)
    // 2. Check pricing directly for weekly/monthly (legacy format)
    const adUnits = pricing?.ad_units || [];
    const selectedAdUnit = adUnits.find((unit: any) => unit.type === adUnitType) || adUnits[0];

    // Weekly rate: check ad unit first, then pricing object, then specs (venue/franchise registration)
    const weeklyRate = 
      selectedAdUnit?.pricePerWeek || 
      selectedAdUnit?.weekly_subscription_fee || 
      pricing?.weekly || 
      pricing?.pricePerWeek || 
      pricing?.weekly_lease_price ||
      0;
    
    // Monthly rate: check ad unit first, then pricing object, then specs, then top-level column
    const monthlyRate = 
      selectedAdUnit?.pricePerMonth || 
      selectedAdUnit?.monthly_subscription_fee || 
      pricing?.monthly || 
      pricing?.pricePerMonth || 
      pricing?.monthly_subscription_fee ||
      pricing?.monthly_lease_price ||
      0;
    
    // Daily rate fallback
    const dailyRate = pricing?.daily || (weeklyRate > 0 ? weeklyRate / 7 : 0);

    // If no valid rates found, return 0
    if (weeklyRate === 0 && monthlyRate === 0 && dailyRate === 0) return 0;

    let total = 0;

    // Pricing logic: months apply first, remaining weeks billed at weekly rate
    if (weeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(weeks / 4);
      const remainingWeeks = weeks % 4;
      total = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
    } else if (weeks >= 1 && weeklyRate > 0) {
      total = weeks * weeklyRate;
    } else if (dailyRate > 0) {
      total = days * dailyRate;
    }

    // Multiply by quantity if applicable
    total = total * quantity;

    return total;
  }, [startDate, endDate, pricing, adUnitType, quantity]);

  // Notify parent of payout changes
  useEffect(() => {
    if (onEstimatedPayoutChange) {
      onEstimatedPayoutChange(estimatedPayout);
    }
  }, [estimatedPayout, onEstimatedPayoutChange]);

  return (
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
        {estimatedPayout > 0 && (
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
                const weeklyRate = selectedUnit?.pricePerWeek || selectedUnit?.weekly_subscription_fee || pricing?.weekly || pricing?.pricePerWeek || 0;
                const monthlyRate = selectedUnit?.pricePerMonth || selectedUnit?.monthly_subscription_fee || pricing?.monthly || pricing?.pricePerMonth || 0;
                const weeks = duration?.weeks || 0;
                const useMonthly = weeks >= 4 && monthlyRate > 0;
                const fullMonths = Math.floor(weeks / 4);
                const remainingWeeks = weeks % 4;

                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span>
                        {useMonthly
                          ? `₱${monthlyRate.toLocaleString()}/month`
                          : `₱${weeklyRate.toLocaleString()}/week`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span>{weeks} week{weeks !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-medium text-base">
                      <span className="text-muted-foreground">Breakdown</span>
                      <span>
                        {useMonthly
                          ? `₱${monthlyRate.toLocaleString()} × ${fullMonths} mo${remainingWeeks > 0 ? ` + ₱${weeklyRate.toLocaleString()} × ${remainingWeeks} wk` : ''}`
                          : `₱${weeklyRate.toLocaleString()} × ${weeks} wk`}
                        {quantity > 1 ? ` × ${quantity}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Estimated Publisher Payout</span>
                  <span className="text-2xl font-bold text-primary">
                    ₱{estimatedPayout.toLocaleString()}
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
  );
}