import {
  differenceInSeconds,
  addMonths,
  startOfDay,
  isAfter,
  isBefore,
  getDaysInMonth,
  isSameDay,
} from 'date-fns';
import type {
  BillingCycle,
  Plan,
  InvoiceLine,
  Invoice,
  ServiceEndPeriod,
  ServiceEndResult,
  ServiceStartPeriod,
  ServiceStartResult,
  PlanChangePeriod,
  PlanChangeResult,
} from '../types/billing';
import { CYCLE_MONTHS, SECONDS_PER_DAY } from '../types/billing';

/**
 * Calculate the end date of a billing period given the start date and cycle
 */
export function calculatePeriodEnd(periodStart: Date, cycle: BillingCycle): Date {
  const months = CYCLE_MONTHS[cycle];
  return startOfDay(addMonths(periodStart, months));
}

/**
 * Calculate the total number of seconds in a billing period
 */
export function calculateSecondsInPeriod(periodStart: Date, periodEnd: Date): number {
  return differenceInSeconds(periodEnd, periodStart);
}

/**
 * Convert seconds to days (for display purposes)
 */
export function secondsToDays(seconds: number): number {
  return seconds / SECONDS_PER_DAY;
}

/**
 * Calculate per-second rate from a plan price and period length in seconds
 */
export function calculateSecondlyRate(price: number, secondsInPeriod: number): number {
  return price / secondsInPeriod;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get the billing anchor date for a given month, handling months with fewer days
 */
function getBillingAnchorDate(year: number, month: number, anchorDay: number): Date {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const actualDay = Math.min(anchorDay, daysInMonth);
  return startOfDay(new Date(year, month, actualDay));
}

/**
 * Generate all billing periods that contain or follow the effective date up to and including the current period
 */
export function generateBillingPeriods(
  effectiveDate: Date,
  currentPeriodEnd: Date,
  billingCycle: BillingCycle,
  billingAnchorDay: number
): { periodStart: Date; periodEnd: Date }[] {
  const periods: { periodStart: Date; periodEnd: Date }[] = [];
  const cycleMonths = CYCLE_MONTHS[billingCycle];

  // Find the billing period that contains the effective date
  const effectiveYear = effectiveDate.getFullYear();
  const effectiveMonth = effectiveDate.getMonth();

  // Start from a period that definitely contains or precedes the effective date
  let searchYear = effectiveYear;
  let searchMonth = effectiveMonth;

  // Find the period start that's on or before the effective date
  let periodStart = getBillingAnchorDate(searchYear, searchMonth, billingAnchorDay);

  // If period start is after effective date, go back one cycle
  while (isAfter(periodStart, effectiveDate)) {
    searchMonth -= cycleMonths;
    if (searchMonth < 0) {
      searchYear -= 1;
      searchMonth += 12;
    }
    periodStart = getBillingAnchorDate(searchYear, searchMonth, billingAnchorDay);
  }

  // Now iterate forward from this period
  // Include periods up to and including the one that contains currentPeriodEnd
  while (isBefore(periodStart, currentPeriodEnd) || isSameDay(periodStart, currentPeriodEnd)) {
    const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

    // Only include periods that overlap with the affected range
    if (isAfter(periodEnd, effectiveDate) || isSameDay(periodEnd, effectiveDate)) {
      periods.push({ periodStart, periodEnd });
    }

    // Move to next period
    periodStart = periodEnd;

    // Stop if we've passed the current period end
    if (isAfter(periodStart, currentPeriodEnd)) break;

    // Safety check to prevent infinite loops
    if (periods.length > 100) break;
  }

  return periods;
}

/**
 * Calculate service end (cancellation) for all affected periods
 */
export function calculateServiceEnd(
  effectiveEndDate: Date,
  currentPeriodEnd: Date,
  billingCycle: BillingCycle,
  billingAnchorDay: number,
  plan: Plan
): ServiceEndResult {
  const billingPeriods = generateBillingPeriods(
    effectiveEndDate,
    currentPeriodEnd,
    billingCycle,
    billingAnchorDay
  );

  const periods: ServiceEndPeriod[] = billingPeriods.map((period, index) => {
    const secondsInPeriod = calculateSecondsInPeriod(period.periodStart, period.periodEnd);
    const daysInPeriod = Math.round(secondsToDays(secondsInPeriod) * 100) / 100;

    // Determine the effective end within this period
    const isFirstPeriod = index === 0;
    const effectiveEndInPeriod = isAfter(effectiveEndDate, period.periodStart) ? effectiveEndDate : period.periodStart;

    const secondsUsed = differenceInSeconds(effectiveEndInPeriod, period.periodStart);
    const secondsCredited = secondsInPeriod - secondsUsed;

    const daysUsed = Math.round(secondsToDays(secondsUsed) * 100) / 100;
    const daysCredited = Math.round(secondsToDays(secondsCredited) * 100) / 100;

    const secondlyRate = calculateSecondlyRate(plan.price, secondsInPeriod);
    const credit = Math.round(secondlyRate * secondsCredited * 100) / 100;

    const isPartialPeriod = secondsUsed > 0 && secondsCredited > 0;
    const partialPosition: 'start' | 'end' | 'none' = isPartialPeriod && isFirstPeriod ? 'start' : 'none';

    return {
      periodNumber: index + 1,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      daysInPeriod,
      daysUsed,
      daysCredited,
      credit,
      isPartialPeriod,
      partialPosition,
    };
  });

  const totalCredit = Math.round(periods.reduce((sum, p) => sum + p.credit, 0) * 100) / 100;

  return {
    periods,
    totalPeriodsAffected: periods.length,
    totalCredit,
  };
}

/**
 * Calculate service start for all affected periods
 */
export function calculateServiceStart(
  effectiveStartDate: Date,
  currentPeriodEnd: Date,
  billingCycle: BillingCycle,
  billingAnchorDay: number,
  plan: Plan
): ServiceStartResult {
  const billingPeriods = generateBillingPeriods(
    effectiveStartDate,
    currentPeriodEnd,
    billingCycle,
    billingAnchorDay
  );

  const periods: ServiceStartPeriod[] = billingPeriods.map((period, index) => {
    const secondsInPeriod = calculateSecondsInPeriod(period.periodStart, period.periodEnd);
    const daysInPeriod = Math.round(secondsToDays(secondsInPeriod) * 100) / 100;

    // Determine the effective start within this period
    const isFirstPeriod = index === 0;
    const effectiveStartInPeriod = isAfter(effectiveStartDate, period.periodStart) ? effectiveStartDate : period.periodStart;

    const secondsInactive = differenceInSeconds(effectiveStartInPeriod, period.periodStart);
    const secondsCharged = secondsInPeriod - secondsInactive;

    const daysInactive = Math.round(secondsToDays(secondsInactive) * 100) / 100;
    const daysCharged = Math.round(secondsToDays(secondsCharged) * 100) / 100;

    const secondlyRate = calculateSecondlyRate(plan.price, secondsInPeriod);
    const charge = Math.round(secondlyRate * secondsCharged * 100) / 100;

    const isPartialPeriod = secondsInactive > 0 && secondsCharged > 0;
    const partialPosition: 'start' | 'end' | 'none' = isPartialPeriod && isFirstPeriod ? 'start' : 'none';

    return {
      periodNumber: index + 1,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      daysInPeriod,
      daysInactive,
      daysCharged,
      charge,
      isPartialPeriod,
      partialPosition,
    };
  });

  const totalCharge = Math.round(periods.reduce((sum, p) => sum + p.charge, 0) * 100) / 100;

  return {
    periods,
    totalPeriodsAffected: periods.length,
    totalCharge,
  };
}

/**
 * Calculate plan change for all affected periods
 */
export function calculatePlanChange(
  effectiveChangeDate: Date,
  currentPeriodEnd: Date,
  billingCycle: BillingCycle,
  billingAnchorDay: number,
  oldPlan: Plan,
  newPlan: Plan
): PlanChangeResult {
  const billingPeriods = generateBillingPeriods(
    effectiveChangeDate,
    currentPeriodEnd,
    billingCycle,
    billingAnchorDay
  );

  const periods: PlanChangePeriod[] = billingPeriods.map((period, index) => {
    const secondsInPeriod = calculateSecondsInPeriod(period.periodStart, period.periodEnd);
    const daysInPeriod = Math.round(secondsToDays(secondsInPeriod) * 100) / 100;

    // Determine the effective change within this period
    const isFirstPeriod = index === 0;
    const effectiveChangeInPeriod = isAfter(effectiveChangeDate, period.periodStart) ? effectiveChangeDate : period.periodStart;

    const secondsOnOldPlan = differenceInSeconds(effectiveChangeInPeriod, period.periodStart);
    const secondsAffected = secondsInPeriod - secondsOnOldPlan;

    const daysOnOldPlan = Math.round(secondsToDays(secondsOnOldPlan) * 100) / 100;
    const daysAffected = Math.round(secondsToDays(secondsAffected) * 100) / 100;

    // Calculate per-second rates
    const oldSecondlyRate = calculateSecondlyRate(oldPlan.price, secondsInPeriod);
    const newSecondlyRate = calculateSecondlyRate(newPlan.price, secondsInPeriod);

    // Credit from old plan for affected portion
    const creditFromOldPlan = Math.round(oldSecondlyRate * secondsAffected * 100) / 100;

    // Charge for new plan for affected portion
    const chargeForNewPlan = Math.round(newSecondlyRate * secondsAffected * 100) / 100;

    // Net adjustment (positive = customer owes, negative = refund)
    const netAdjustment = Math.round((chargeForNewPlan - creditFromOldPlan) * 100) / 100;

    const isPartialPeriod = secondsOnOldPlan > 0 && secondsAffected > 0;
    const partialPosition: 'start' | 'end' | 'none' = isPartialPeriod && isFirstPeriod ? 'start' : 'none';

    return {
      periodNumber: index + 1,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      isPartialPeriod,
      partialPosition,
      daysInPeriod,
      daysOnOldPlan,
      daysAffected,
      creditFromOldPlan,
      chargeForNewPlan,
      netAdjustment,
    };
  });

  const totalCredits = Math.round(periods.reduce((sum, p) => sum + p.creditFromOldPlan, 0) * 100) / 100;
  const totalCharges = Math.round(periods.reduce((sum, p) => sum + p.chargeForNewPlan, 0) * 100) / 100;
  const netAdjustment = Math.round((totalCharges - totalCredits) * 100) / 100;

  return {
    periods,
    totalPeriodsAffected: periods.length,
    totalCredits,
    totalCharges,
    netAdjustment,
    isUpgrade: newPlan.price > oldPlan.price,
  };
}

/**
 * Generate invoice for service end (cancellation)
 */
export function generateServiceEndInvoice(
  result: ServiceEndResult,
  plan: Plan
): Invoice {
  const lines: InvoiceLine[] = result.periods.map((period) => ({
    description: `${plan.name} - Credit for ${period.isPartialPeriod ? 'Period ' + period.periodNumber : 'Period ' + period.periodNumber} (${period.daysCredited} days)`,
    quantity: 1,
    unitPrice: -period.credit,
    amount: -period.credit,
    isCredit: true,
  }));

  return {
    lines,
    subtotal: 0,
    credits: result.totalCredit,
    total: -result.totalCredit,
    periodStart: result.periods[0]?.periodStart || new Date(),
    periodEnd: result.periods[result.periods.length - 1]?.periodEnd || new Date(),
  };
}

/**
 * Generate invoice for service start
 */
export function generateServiceStartInvoice(
  result: ServiceStartResult,
  plan: Plan
): Invoice {
  const lines: InvoiceLine[] = result.periods.map((period) => ({
    description: `${plan.name} - Charge for Period ${period.periodNumber} (${period.daysCharged} days)`,
    quantity: 1,
    unitPrice: period.charge,
    amount: period.charge,
    isCredit: false,
  }));

  return {
    lines,
    subtotal: result.totalCharge,
    credits: 0,
    total: result.totalCharge,
    periodStart: result.periods[0]?.periodStart || new Date(),
    periodEnd: result.periods[result.periods.length - 1]?.periodEnd || new Date(),
  };
}

/**
 * Generate invoice for plan change
 */
export function generatePlanChangeInvoice(
  result: PlanChangeResult,
  oldPlan: Plan,
  newPlan: Plan
): Invoice {
  const lines: InvoiceLine[] = [];

  // Add line items for each period
  result.periods.forEach((period) => {
    // Credit line for old plan
    lines.push({
      description: `${oldPlan.name} - Credit for Period ${period.periodNumber} (${period.daysAffected} days)`,
      quantity: 1,
      unitPrice: -period.creditFromOldPlan,
      amount: -period.creditFromOldPlan,
      isCredit: true,
    });

    // Charge line for new plan
    lines.push({
      description: `${newPlan.name} - Charge for Period ${period.periodNumber} (${period.daysAffected} days)`,
      quantity: 1,
      unitPrice: period.chargeForNewPlan,
      amount: period.chargeForNewPlan,
      isCredit: false,
    });
  });

  return {
    lines,
    subtotal: result.totalCharges,
    credits: result.totalCredits,
    total: result.netAdjustment,
    periodStart: result.periods[0]?.periodStart || new Date(),
    periodEnd: result.periods[result.periods.length - 1]?.periodEnd || new Date(),
  };
}
