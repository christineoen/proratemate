import {
  differenceInDays,
  addMonths,
  startOfDay,
  isAfter,
  isBefore,
} from 'date-fns';
import type {
  BillingCycle,
  Plan,
  ProrationInput,
  ProrationResult,
  PlanChangeResult,
  InvoiceLine,
  Invoice,
} from '../types/billing';
import { CYCLE_MONTHS } from '../types/billing';

/**
 * Calculate the end date of a billing period given the start date and cycle
 */
export function calculatePeriodEnd(periodStart: Date, cycle: BillingCycle): Date {
  const months = CYCLE_MONTHS[cycle];
  return startOfDay(addMonths(periodStart, months));
}

/**
 * Calculate the total number of days in a billing period
 */
export function calculateDaysInPeriod(periodStart: Date, periodEnd: Date): number {
  return differenceInDays(periodEnd, periodStart);
}

/**
 * Calculate daily rate from a plan price and period length
 */
export function calculateDailyRate(price: number, daysInPeriod: number): number {
  return price / daysInPeriod;
}

/**
 * Main proration calculation for late start billing
 */
export function calculateProration(input: ProrationInput): ProrationResult {
  const { periodStart, periodEnd, serviceStart, plan } = input;

  const totalDaysInPeriod = calculateDaysInPeriod(periodStart, periodEnd);

  // Ensure service start is within the period
  const effectiveServiceStart = isBefore(serviceStart, periodStart)
    ? periodStart
    : serviceStart;

  const effectiveServiceEnd = input.serviceEnd && isBefore(input.serviceEnd, periodEnd)
    ? input.serviceEnd
    : periodEnd;

  const proratedDays = differenceInDays(effectiveServiceEnd, effectiveServiceStart);
  const dailyRate = calculateDailyRate(plan.price, totalDaysInPeriod);
  const proratedAmount = Math.round(dailyRate * proratedDays * 100) / 100;
  const percentageUsed = (proratedDays / totalDaysInPeriod) * 100;
  const credit = Math.round((plan.price - proratedAmount) * 100) / 100;

  return {
    totalDaysInPeriod,
    proratedDays,
    dailyRate: Math.round(dailyRate * 100) / 100,
    proratedAmount,
    fullAmount: plan.price,
    credit,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
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
  const totalDaysInPeriod = calculateDaysInPeriod(periodStart, periodEnd);

  // Days used on old plan (from period start to change date)
  const oldPlanDaysUsed = differenceInDays(changeDate, periodStart);

  // Days remaining on new plan (from change date to period end)
  const newPlanDaysRemaining = differenceInDays(periodEnd, changeDate);

  // Calculate daily rates
  const oldDailyRate = calculateDailyRate(oldPlan.price, totalDaysInPeriod);
  const newDailyRate = calculateDailyRate(newPlan.price, totalDaysInPeriod);

  // Old plan: credit for unused portion
  const oldPlanUsedAmount = oldDailyRate * oldPlanDaysUsed;
  const oldPlanCredit = Math.round((oldPlan.price - oldPlanUsedAmount) * 100) / 100;

  // New plan: charge for remaining portion
  const newPlanCharge = Math.round(newDailyRate * newPlanDaysRemaining * 100) / 100;

  // Net amount (positive = charge, negative = refund)
  const netAmount = Math.round((newPlanCharge - oldPlanCredit) * 100) / 100;

  const isUpgrade = newPlan.price > oldPlan.price;

  return {
    oldPlanCredit,
    oldPlanDaysUsed,
    newPlanCharge,
    newPlanDaysRemaining,
    netAmount,
    isUpgrade,
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
      errors.push('Change date must be after period start date');
    }
    if (isAfter(input.changeDate, input.periodEnd)) {
      errors.push('Change date must be before period end date');
    }
  }

  return errors;
}
