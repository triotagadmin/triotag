import { addDays, isWeekend, isBefore, startOfDay } from "date-fns";

/**
 * Adds business days (excluding weekends) to a given date
 */
export function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result)) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Gets the minimum selectable date (5 business days from today)
 */
export function getMinimumBookingDate(): Date {
  return addBusinessDays(new Date(), 5);
}

/**
 * Checks if a date is before the minimum booking date
 */
export function isBeforeMinimumBookingDate(date: Date): boolean {
  const minDate = getMinimumBookingDate();
  return isBefore(startOfDay(date), startOfDay(minDate));
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 */
export function isWeekendDay(date: Date): boolean {
  return isWeekend(date);
}

/**
 * Checks if a date should be disabled in the calendar
 * (either a weekend or before the 5 business day leeway)
 */
export function shouldDisableDate(date: Date): boolean {
  return isBeforeMinimumBookingDate(date);
}
