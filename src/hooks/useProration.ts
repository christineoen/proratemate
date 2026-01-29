import { useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, subMonths, getDate } from 'date-fns';
import type {
  BillingCycle,
  Plan,
  ProrationResult,
  PlanChangeResult,
  Invoice,
  MultiPeriodResult,
} from '../types/billing';
import {
  calculatePeriodEnd,
  calculateProration,
  calculatePlanChange,
  generateLateStartInvoice,
  generatePlanChangeInvoice,
  validateDates,
  calculateMultiPeriodAdjustment,
  generateMultiPeriodInvoice,
  validateMultiPeriodInput,
} from '../utils/proration';

export type CalculationType = 'lateStart' | 'planChange' | 'multiPeriod';

interface UseProrationState {
  calculationType: CalculationType;
  periodStart: Date;
  periodEnd: Date;
  serviceStart: Date;
  billingCycle: BillingCycle;
  plan: Plan;
  changeDate: Date;
  newPlan: Plan;
  effectiveChangeDate: Date;
  billingAnchorDay: number;
}

const DEFAULT_PLANS: Plan[] = [
  { name: 'Basic', price: 29, cycle: 'monthly' },
  { name: 'Pro', price: 99, cycle: 'monthly' },
  { name: 'Enterprise', price: 299, cycle: 'monthly' },
];

export function useProration() {
  const today = new Date();
  const defaultPeriodStart = startOfMonth(today);
  const defaultEffectiveChangeDate = subMonths(today, 2);

  const [state, setState] = useState<UseProrationState>({
    calculationType: 'lateStart',
    periodStart: defaultPeriodStart,
    periodEnd: endOfMonth(defaultPeriodStart),
    serviceStart: today,
    billingCycle: 'monthly',
    plan: DEFAULT_PLANS[0],
    changeDate: today,
    newPlan: DEFAULT_PLANS[1],
    effectiveChangeDate: defaultEffectiveChangeDate,
    billingAnchorDay: getDate(defaultPeriodStart),
  });

  // Update period end when billing cycle or period start changes
  const updateBillingCycle = useCallback((cycle: BillingCycle) => {
    const newPeriodEnd = calculatePeriodEnd(state.periodStart, cycle);
    setState(prev => ({
      ...prev,
      billingCycle: cycle,
      periodEnd: newPeriodEnd,
      plan: { ...prev.plan, cycle },
      newPlan: { ...prev.newPlan, cycle },
    }));
  }, [state.periodStart]);

  const updatePeriodStart = useCallback((date: Date) => {
    const newPeriodEnd = calculatePeriodEnd(date, state.billingCycle);
    setState(prev => ({
      ...prev,
      periodStart: date,
      periodEnd: newPeriodEnd,
    }));
  }, [state.billingCycle]);

  const updateServiceStart = useCallback((date: Date) => {
    setState(prev => ({ ...prev, serviceStart: date }));
  }, []);

  const updateCalculationType = useCallback((type: CalculationType) => {
    setState(prev => ({ ...prev, calculationType: type }));
  }, []);

  const updatePlan = useCallback((plan: Plan) => {
    setState(prev => ({ ...prev, plan }));
  }, []);

  const updateNewPlan = useCallback((plan: Plan) => {
    setState(prev => ({ ...prev, newPlan: plan }));
  }, []);

  const updateChangeDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, changeDate: date }));
  }, []);

  const updatePlanPrice = useCallback((price: number) => {
    setState(prev => ({
      ...prev,
      plan: { ...prev.plan, price },
    }));
  }, []);

  const updateNewPlanPrice = useCallback((price: number) => {
    setState(prev => ({
      ...prev,
      newPlan: { ...prev.newPlan, price },
    }));
  }, []);

  const updatePlanName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      plan: { ...prev.plan, name },
    }));
  }, []);

  const updateNewPlanName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      newPlan: { ...prev.newPlan, name },
    }));
  }, []);

  const updateEffectiveChangeDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, effectiveChangeDate: date }));
  }, []);

  const updateBillingAnchorDay = useCallback((day: number) => {
    setState(prev => ({ ...prev, billingAnchorDay: day }));
  }, []);

  // Validate dates
  const validationErrors = useMemo(() => {
    if (state.calculationType === 'lateStart') {
      return validateDates({
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        serviceStart: state.serviceStart,
        plan: state.plan,
      });
    } else if (state.calculationType === 'planChange') {
      return validateDates({
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        serviceStart: state.periodStart,
        plan: state.plan,
        changeDate: state.changeDate,
        newPlan: state.newPlan,
      });
    } else {
      return validateMultiPeriodInput({
        effectiveChangeDate: state.effectiveChangeDate,
        currentDate: new Date(),
        billingCycle: state.billingCycle,
        billingAnchorDay: state.billingAnchorDay,
        oldPlan: state.plan,
        newPlan: state.newPlan,
      });
    }
  }, [state]);

  // Calculate proration result
  const prorationResult: ProrationResult | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (state.calculationType === 'lateStart') {
      return calculateProration({
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        serviceStart: state.serviceStart,
        plan: state.plan,
      });
    }
    return null;
  }, [state, validationErrors]);

  // Calculate plan change result
  const planChangeResult: PlanChangeResult | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (state.calculationType === 'planChange') {
      return calculatePlanChange(
        state.periodStart,
        state.periodEnd,
        state.changeDate,
        state.plan,
        state.newPlan
      );
    }
    return null;
  }, [state, validationErrors]);

  // Calculate multi-period result
  const multiPeriodResult: MultiPeriodResult | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (state.calculationType === 'multiPeriod') {
      return calculateMultiPeriodAdjustment({
        effectiveChangeDate: state.effectiveChangeDate,
        currentDate: new Date(),
        billingCycle: state.billingCycle,
        billingAnchorDay: state.billingAnchorDay,
        oldPlan: state.plan,
        newPlan: state.newPlan,
      });
    }
    return null;
  }, [state, validationErrors]);

  // Generate invoice
  const invoice: Invoice | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (state.calculationType === 'lateStart' && prorationResult) {
      return generateLateStartInvoice(
        {
          periodStart: state.periodStart,
          periodEnd: state.periodEnd,
          serviceStart: state.serviceStart,
          plan: state.plan,
        },
        prorationResult
      );
    } else if (state.calculationType === 'planChange' && planChangeResult) {
      return generatePlanChangeInvoice(
        state.periodStart,
        state.periodEnd,
        state.changeDate,
        state.plan,
        state.newPlan,
        planChangeResult
      );
    } else if (state.calculationType === 'multiPeriod' && multiPeriodResult) {
      return generateMultiPeriodInvoice(
        {
          effectiveChangeDate: state.effectiveChangeDate,
          currentDate: new Date(),
          billingCycle: state.billingCycle,
          billingAnchorDay: state.billingAnchorDay,
          oldPlan: state.plan,
          newPlan: state.newPlan,
        },
        multiPeriodResult
      );
    }
    return null;
  }, [state, prorationResult, planChangeResult, multiPeriodResult, validationErrors]);

  return {
    ...state,
    prorationResult,
    planChangeResult,
    multiPeriodResult,
    invoice,
    validationErrors,
    availablePlans: DEFAULT_PLANS,
    updateBillingCycle,
    updatePeriodStart,
    updateServiceStart,
    updateCalculationType,
    updatePlan,
    updateNewPlan,
    updateChangeDate,
    updatePlanPrice,
    updateNewPlanPrice,
    updatePlanName,
    updateNewPlanName,
    updateEffectiveChangeDate,
    updateBillingAnchorDay,
  };
}
