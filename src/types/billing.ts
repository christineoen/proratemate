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
  totalDaysInPeriod: number;
  proratedDays: number;
  dailyRate: number;
  proratedAmount: number;
  fullAmount: number;
  credit: number;
  percentageUsed: number;
}

export interface PlanChangeResult {
  oldPlanCredit: number;
  oldPlanDaysUsed: number;
  newPlanCharge: number;
  newPlanDaysRemaining: number;
  netAmount: number;
  isUpgrade: boolean;
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

export interface PeriodAdjustment {
  periodNumber: number;
  periodStart: Date;
  periodEnd: Date;
  isPartialPeriod: boolean;
  partialPosition: 'start' | 'end' | 'none'; // where unaffected days are: 'start' = first period, 'end' = last period
  daysInPeriod: number;
  daysAffected: number;
  oldPlanCharge: number;
  creditFromOldPlan: number;
  chargeForNewPlan: number;
  netAdjustment: number;
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
