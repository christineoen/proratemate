export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export type ProrationScenario = 'serviceEnd' | 'serviceStart' | 'planChange' | 'none';

export interface Plan {
  name: string;
  price: number;
  cycle: BillingCycle;
}

// Unified period for service end (cancellation credit)
export interface ServiceEndPeriod {
  periodNumber: number;
  periodStart: Date;
  periodEnd: Date;
  daysInPeriod: number;
  daysUsed: number;
  daysCredited: number;
  credit: number;
  isPartialPeriod: boolean;
  partialPosition: 'start' | 'end' | 'none';
}

export interface ServiceEndResult {
  periods: ServiceEndPeriod[];
  totalPeriodsAffected: number;
  totalCredit: number;
}

// Unified period for service start (prorated charge)
export interface ServiceStartPeriod {
  periodNumber: number;
  periodStart: Date;
  periodEnd: Date;
  daysInPeriod: number;
  daysInactive: number;
  daysCharged: number;
  charge: number;
  isPartialPeriod: boolean;
  partialPosition: 'start' | 'end' | 'none';
}

export interface ServiceStartResult {
  periods: ServiceStartPeriod[];
  totalPeriodsAffected: number;
  totalCharge: number;
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

// Unified period for plan change (credit + charge)
export interface PlanChangePeriod {
  periodNumber: number;
  periodStart: Date;
  periodEnd: Date;
  isPartialPeriod: boolean;
  partialPosition: 'start' | 'end' | 'none';
  daysInPeriod: number;
  daysOnOldPlan: number;
  daysAffected: number;
  creditFromOldPlan: number;
  chargeForNewPlan: number;
  netAdjustment: number;
}

export interface PlanChangeResult {
  periods: PlanChangePeriod[];
  totalPeriodsAffected: number;
  totalCredits: number;
  totalCharges: number;
  netAdjustment: number;
  isUpgrade: boolean;
}
