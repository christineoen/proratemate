export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Plan {
  name: string;
  price: number;
  cycle: BillingCycle;
}

export interface ProrationInput {
  periodStart: Date;
  periodEnd: Date;
  serviceStart: Date;
  serviceEnd?: Date;
  plan: Plan;
  changeDate?: Date;
  newPlan?: Plan;
}

export interface ProrationResult {
  totalSecondsInPeriod: number;
  proratedSeconds: number;
  secondlyRate: number;
  proratedAmount: number;
  fullAmount: number;
  credit: number;
  percentageUsed: number;
  // Display values (derived from seconds)
  totalDaysInPeriod: number;
  proratedDays: number;
  dailyRate: number;
}

export interface PlanChangeResult {
  oldPlanCredit: number;
  oldPlanSecondsUsed: number;
  newPlanCharge: number;
  newPlanSecondsRemaining: number;
  netAmount: number;
  isUpgrade: boolean;
  // Display values (derived from seconds)
  oldPlanDaysUsed: number;
  newPlanDaysRemaining: number;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  isCredit: boolean;
}

export interface Invoice {
  lines: InvoiceLine[];
  subtotal: number;
  credits: number;
  total: number;
  periodStart: Date;
  periodEnd: Date;
}

export const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-Annual',
  annual: 'Annual',
};

export const SECONDS_PER_DAY = 86400;

export interface PeriodAdjustment {
  periodNumber: number;
  periodStart: Date;
  periodEnd: Date;
  isPartialPeriod: boolean;
  partialPosition: 'start' | 'end' | 'none';
  secondsInPeriod: number;
  secondsAffected: number;
  oldPlanCharge: number;
  creditFromOldPlan: number;
  chargeForNewPlan: number;
  netAdjustment: number;
  // Display values (derived from seconds)
  daysInPeriod: number;
  daysAffected: number;
}

export interface MultiPeriodInput {
  effectiveChangeDate: Date;
  currentDate: Date;
  billingCycle: BillingCycle;
  billingAnchorDay: number;
  oldPlan: Plan;
  newPlan: Plan;
}

export interface MultiPeriodResult {
  periods: PeriodAdjustment[];
  totalPeriodsAffected: number;
  totalCredits: number;
  totalCharges: number;
  netAdjustment: number;
  isUpgrade: boolean;
}
