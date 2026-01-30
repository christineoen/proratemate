import {
  differenceInSeconds,
  addMonths,
  startOfDay,
  isAfter,
  isBefore,
  getDaysInMonth,
} from 'date-fns';
import type {
  BillingCycle,
  Plan,
  ProrationInput,
  ProrationResult,
  PlanChangeResult,
  InvoiceLine,
  Invoice,
  MultiPeriodInput,
  MultiPeriodResult,
  PeriodAdjustment,
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
 * Main proration calculation for late start billing
 */
export function calculateProration(input: ProrationInput): ProrationResult {
  const { periodStart, periodEnd, serviceStart, plan } = input;

  const totalSecondsInPeriod = calculateSecondsInPeriod(periodStart, periodEnd);

  // Ensure service start is within the period
  const effectiveServiceStart = isBefore(serviceStart, periodStart)
    ? periodStart
    : serviceStart;

  const effectiveServiceEnd = input.serviceEnd && isBefore(input.serviceEnd, periodEnd)
    ? input.serviceEnd
    : periodEnd;

  const proratedSeconds = differenceInSeconds(effectiveServiceEnd, effectiveServiceStart);
  const secondlyRate = calculateSecondlyRate(plan.price, totalSecondsInPeriod);
  const proratedAmount = Math.round(secondlyRate * proratedSeconds * 100) / 100;
  const percentageUsed = (proratedSeconds / totalSecondsInPeriod) * 100;
  const credit = Math.round((plan.price - proratedAmount) * 100) / 100;

  // Calculate display values
  const totalDaysInPeriod = secondsToDays(totalSecondsInPeriod);
  const proratedDays = secondsToDays(proratedSeconds);
  const dailyRate = plan.price / totalDaysInPeriod;

  return {
    totalSecondsInPeriod,
    proratedSeconds,
    secondlyRate,
    proratedAmount,
    fullAmount: plan.price,
    credit,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    // Display values
    totalDaysInPeriod: Math.round(totalDaysInPeriod * 100) / 100,
    proratedDays: Math.round(proratedDays * 100) / 100,
    dailyRate: Math.round(dailyRate * 100) / 100,
  };
}

/**
 * Calculate proration for plan changes (upgrades/downgrades)
 */
export function calculatePlanChange(
  periodStart: Date,
  periodEnd: Date,
  changeDate: Date,
  oldPlan: Plan,
  newPlan: Plan
): PlanChangeResult {
  const totalSecondsInPeriod = calculateSecondsInPeriod(periodStart, periodEnd);

  // Seconds used on old plan (from period start to plan change date)
  const oldPlanSecondsUsed = differenceInSeconds(changeDate, periodStart);

  // Seconds remaining on new plan (from plan change date to period end)
  const newPlanSecondsRemaining = differenceInSeconds(periodEnd, changeDate);

  // Calculate per-second rates
  const oldSecondlyRate = calculateSecondlyRate(oldPlan.price, totalSecondsInPeriod);
  const newSecondlyRate = calculateSecondlyRate(newPlan.price, totalSecondsInPeriod);

  // Old plan: credit for unused portion
  const oldPlanUsedAmount = oldSecondlyRate * oldPlanSecondsUsed;
  const oldPlanCredit = Math.round((oldPlan.price - oldPlanUsedAmount) * 100) / 100;

  // New plan: charge for remaining portion
  const newPlanCharge = Math.round(newSecondlyRate * newPlanSecondsRemaining * 100) / 100;

  // Net amount (positive = charge, negative = refund)
  const netAmount = Math.round((newPlanCharge - oldPlanCredit) * 100) / 100;

  const isUpgrade = newPlan.price > oldPlan.price;

  // Calculate display values
  const oldPlanDaysUsed = secondsToDays(oldPlanSecondsUsed);
  const newPlanDaysRemaining = secondsToDays(newPlanSecondsRemaining);

  return {
    oldPlanCredit,
    oldPlanSecondsUsed,
    newPlanCharge,
    newPlanSecondsRemaining,
    netAmount,
    isUpgrade,
    // Display values
    oldPlanDaysUsed: Math.round(oldPlanDaysUsed * 100) / 100,
    newPlanDaysRemaining: Math.round(newPlanDaysRemaining * 100) / 100,
  };
}

/**
 * Generate invoice line items based on proration type
 */
export function generateInvoiceLines(
  prorationResult: ProrationResult,
  plan: Plan,
  isLateStart: boolean = true
): InvoiceLine[] {
  const lines: InvoiceLine[] = [];

  if (isLateStart) {
    lines.push({
      description: `${plan.name} - Prorated (${prorationResult.proratedDays} of ${prorationResult.totalDaysInPeriod} days)`,
      quantity: 1,
      unitPrice: prorationResult.proratedAmount,
      amount: prorationResult.proratedAmount,
      isCredit: false,
    });
  } else {
    lines.push({
      description: `${plan.name} - Full Period`,
      quantity: 1,
      unitPrice: plan.price,
      amount: plan.price,
      isCredit: false,
    });
  }

  return lines;
}

/**
 * Generate invoice for plan change scenario
 */
export function generatePlanChangeInvoice(
  periodStart: Date,
  periodEnd: Date,
  _changeDate: Date,
  oldPlan: Plan,
  newPlan: Plan,
  planChangeResult: PlanChangeResult
): Invoice {
  const lines: InvoiceLine[] = [];

  // Credit for unused portion of old plan
  lines.push({
    description: `${oldPlan.name} - Credit for unused portion (${planChangeResult.newPlanDaysRemaining} days)`,
    quantity: 1,
    unitPrice: -planChangeResult.oldPlanCredit,
    amount: -planChangeResult.oldPlanCredit,
    isCredit: true,
  });

  // Charge for remaining portion of new plan
  lines.push({
    description: `${newPlan.name} - Prorated charge (${planChangeResult.newPlanDaysRemaining} days)`,
    quantity: 1,
    unitPrice: planChangeResult.newPlanCharge,
    amount: planChangeResult.newPlanCharge,
    isCredit: false,
  });

  const credits = planChangeResult.oldPlanCredit;
  const subtotal = planChangeResult.newPlanCharge;
  const total = planChangeResult.netAmount;

  return {
    lines,
    subtotal,
    credits,
    total,
    periodStart,
    periodEnd,
  };
}

/**
 * Generate invoice for late start scenario
 */
export function generateLateStartInvoice(
  input: ProrationInput,
  prorationResult: ProrationResult
): Invoice {
  const lines = generateInvoiceLines(prorationResult, input.plan, true);

  return {
    lines,
    subtotal: prorationResult.proratedAmount,
    credits: 0,
    total: prorationResult.proratedAmount,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  };
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
 * Validate proration input dates
 */
export function validateDates(input: ProrationInput): string[] {
  const errors: string[] = [];

  if (isAfter(input.periodStart, input.periodEnd)) {
    errors.push('Period start date must be before period end date');
  }

  if (isAfter(input.serviceStart, input.periodEnd)) {
    errors.push('Service start date must be before period end date');
  }

  if (input.serviceEnd && isAfter(input.serviceStart, input.serviceEnd)) {
    errors.push('Service start date must be before service end date');
  }

  if (input.changeDate) {
    if (isBefore(input.changeDate, input.periodStart)) {
      errors.push('Plan change date must be after period start date');
    }
    if (isAfter(input.changeDate, input.periodEnd)) {
      errors.push('Plan change date must be before period end date');
    }
  }

  return errors;
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
 * Generate all billing periods between effective plan change date and current date
 */
export function generateBillingPeriods(
  effectiveChangeDate: Date,
  currentDate: Date,
  billingCycle: BillingCycle,
  billingAnchorDay: number
): { periodStart: Date; periodEnd: Date }[] {
  const periods: { periodStart: Date; periodEnd: Date }[] = [];
  const cycleMonths = CYCLE_MONTHS[billingCycle];

  // Find the billing period that contains the effective plan change date
  const effectiveYear = effectiveChangeDate.getFullYear();
  const effectiveMonth = effectiveChangeDate.getMonth();

  // Start from a period that definitely contains or precedes the effective date
  let searchYear = effectiveYear;
  let searchMonth = effectiveMonth;

  // Find the period start that's on or before the effective date
  let periodStart = getBillingAnchorDate(searchYear, searchMonth, billingAnchorDay);

  // If period start is after effective date, go back one cycle
  while (isAfter(periodStart, effectiveChangeDate)) {
    searchMonth -= cycleMonths;
    if (searchMonth < 0) {
      searchYear -= 1;
      searchMonth += 12;
    }
    periodStart = getBillingAnchorDate(searchYear, searchMonth, billingAnchorDay);
  }

  // Now iterate forward from this period
  // Stop when periodStart reaches or passes currentDate (which is the current period's end)
  while (isBefore(periodStart, currentDate)) {
    const periodEnd = calculatePeriodEnd(periodStart, billingCycle);

    // Only include periods that overlap with the affected range
    if (isAfter(periodEnd, effectiveChangeDate) || periodEnd.getTime() === effectiveChangeDate.getTime()) {
      periods.push({ periodStart, periodEnd });
    }

    // Move to next period
    periodStart = periodEnd;

    // Safety check to prevent infinite loops
    if (periods.length > 100) break;
  }

  return periods;
}

/**
 * Calculate adjustment for a single billing period
 */
export function calculatePeriodAdjustment(
  periodStart: Date,
  periodEnd: Date,
  effectiveChangeDate: Date,
  _currentDate: Date,
  oldPlan: Plan,
  newPlan: Plan,
  periodNumber: number
): PeriodAdjustment {
  const secondsInPeriod = calculateSecondsInPeriod(periodStart, periodEnd);

  // Determine the affected portion of this period
  // For advance billing, the full period is affected once it's included (customer already paid for it)
  const effectiveStart = isAfter(effectiveChangeDate, periodStart) ? effectiveChangeDate : periodStart;
  const effectiveEnd = periodEnd; // Always go to period end for advance billing

  const secondsAffected = Math.max(0, differenceInSeconds(effectiveEnd, effectiveStart));
  const isPartialPeriod = secondsAffected < secondsInPeriod;

  // Determine where the unaffected portion falls
  // For advance billing, partial periods only occur at the start (first period with effectiveChangeDate mid-period)
  let partialPosition: 'start' | 'end' | 'none' = 'none';
  if (isPartialPeriod && isAfter(effectiveChangeDate, periodStart)) {
    partialPosition = 'start';
  }

  // Calculate per-second rates
  const oldSecondlyRate = calculateSecondlyRate(oldPlan.price, secondsInPeriod);
  const newSecondlyRate = calculateSecondlyRate(newPlan.price, secondsInPeriod);

  // Old plan: what was charged for the affected seconds
  const oldPlanCharge = Math.round(oldSecondlyRate * secondsAffected * 100) / 100;

  // Credit from old plan (the amount they paid but shouldn't have)
  const creditFromOldPlan = oldPlanCharge;

  // New plan: what should have been charged for the affected seconds
  const chargeForNewPlan = Math.round(newSecondlyRate * secondsAffected * 100) / 100;

  // Net adjustment for this period (positive = customer owes, negative = refund)
  const netAdjustment = Math.round((chargeForNewPlan - creditFromOldPlan) * 100) / 100;

  // Calculate display values
  const daysInPeriod = secondsToDays(secondsInPeriod);
  const daysAffected = secondsToDays(secondsAffected);

  return {
    periodNumber,
    periodStart,
    periodEnd,
    isPartialPeriod,
    partialPosition,
    secondsInPeriod,
    secondsAffected,
    oldPlanCharge,
    creditFromOldPlan,
    chargeForNewPlan,
    netAdjustment,
    // Display values
    daysInPeriod: Math.round(daysInPeriod * 100) / 100,
    daysAffected: Math.round(daysAffected * 100) / 100,
  };
}

/**
 * Main multi-period adjustment calculation
 */
export function calculateMultiPeriodAdjustment(input: MultiPeriodInput): MultiPeriodResult {
  const { effectiveChangeDate, currentDate, billingCycle, billingAnchorDay, oldPlan, newPlan } = input;

  const billingPeriods = generateBillingPeriods(
    effectiveChangeDate,
    currentDate,
    billingCycle,
    billingAnchorDay
  );

  const periods: PeriodAdjustment[] = billingPeriods.map((period, index) =>
    calculatePeriodAdjustment(
      period.periodStart,
      period.periodEnd,
      effectiveChangeDate,
      currentDate,
      oldPlan,
      newPlan,
      index + 1
    )
  );

  const totalCredits = periods.reduce((sum, p) => sum + p.creditFromOldPlan, 0);
  const totalCharges = periods.reduce((sum, p) => sum + p.chargeForNewPlan, 0);
  const netAdjustment = Math.round((totalCharges - totalCredits) * 100) / 100;

  return {
    periods,
    totalPeriodsAffected: periods.length,
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    netAdjustment,
    isUpgrade: newPlan.price > oldPlan.price,
  };
}

/**
 * Generate invoice with per-period line items for multi-period adjustment
 */
export function generateMultiPeriodInvoice(
  input: MultiPeriodInput,
  result: MultiPeriodResult
): Invoice {
  const lines: InvoiceLine[] = [];

  // Add line items for each period
  result.periods.forEach((period) => {
    // Credit line for old plan
    lines.push({
      description: `${input.oldPlan.name} - Credit for Period ${period.periodNumber} (${period.daysAffected} days)`,
      quantity: 1,
      unitPrice: -period.creditFromOldPlan,
      amount: -period.creditFromOldPlan,
      isCredit: true,
    });

    // Charge line for new plan
    lines.push({
      description: `${input.newPlan.name} - Charge for Period ${period.periodNumber} (${period.daysAffected} days)`,
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
    periodStart: result.periods[0]?.periodStart || input.effectiveChangeDate,
    periodEnd: result.periods[result.periods.length - 1]?.periodEnd || input.currentDate,
  };
}

/**
 * Validate multi-period input
 */
export function validateMultiPeriodInput(input: MultiPeriodInput): string[] {
  const errors: string[] = [];

  if (isAfter(input.effectiveChangeDate, input.currentDate)) {
    errors.push('Effective plan change date must be before or equal to current date');
  }

  if (input.billingAnchorDay < 1 || input.billingAnchorDay > 31) {
    errors.push('Billing anchor day must be between 1 and 31');
  }

  if (input.oldPlan.price < 0) {
    errors.push('Old plan price must be non-negative');
  }

  if (input.newPlan.price < 0) {
    errors.push('New plan price must be non-negative');
  }

  return errors;
}
