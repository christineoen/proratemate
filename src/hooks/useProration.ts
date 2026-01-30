import { useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, getDate, isBefore } from 'date-fns';
import type {
  BillingCycle,
  Plan,
  PlanChangeResult,
  Invoice,
  MultiPeriodResult,
} from '../types/billing';
import {
  calculatePeriodEnd,
  calculatePlanChange,
  generatePlanChangeInvoice,
  validateDates,
  calculateMultiPeriodAdjustment,
  generateMultiPeriodInvoice,
  validateMultiPeriodInput,
} from '../utils/proration';

interface UseProrationState {
  periodStart: Date;
  periodEnd: Date;
  billingCycle: BillingCycle;
  plan: Plan;
  changeDate: Date;
  newPlan: Plan;
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

  const [state, setState] = useState<UseProrationState>({
    periodStart: defaultPeriodStart,
    periodEnd: endOfMonth(defaultPeriodStart),
    billingCycle: 'monthly',
    plan: DEFAULT_PLANS[0],
    changeDate: today,
    newPlan: DEFAULT_PLANS[1],
    billingAnchorDay: getDate(defaultPeriodStart),
  });

  // Determine if this is a multi-period scenario (plan change date is before current period)
  const isMultiPeriod = useMemo(() => {
    return isBefore(state.changeDate, state.periodStart);
  }, [state.changeDate, state.periodStart]);

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
      billingAnchorDay: getDate(date),
    }));
  }, [state.billingCycle]);

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

  const updateBillingAnchorDay = useCallback((day: number) => {
    setState(prev => ({ ...prev, billingAnchorDay: day }));
  }, []);

  // Validate dates
  const validationErrors = useMemo(() => {
    if (isMultiPeriod) {
      return validateMultiPeriodInput({
        effectiveChangeDate: state.changeDate,
        currentDate: state.periodEnd,
        billingCycle: state.billingCycle,
        billingAnchorDay: state.billingAnchorDay,
        oldPlan: state.plan,
        newPlan: state.newPlan,
      });
    } else {
      return validateDates({
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
        serviceStart: state.periodStart,
        plan: state.plan,
        changeDate: state.changeDate,
        newPlan: state.newPlan,
      });
    }
  }, [state, isMultiPeriod]);

  // Calculate plan change result (single period only)
  const planChangeResult: PlanChangeResult | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (!isMultiPeriod) {
      return calculatePlanChange(
        state.periodStart,
        state.periodEnd,
        state.changeDate,
        state.plan,
        state.newPlan
      );
    }
    return null;
  }, [state, validationErrors, isMultiPeriod]);

  // Calculate multi-period result (when plan change date is before current period)
  const multiPeriodResult: MultiPeriodResult | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (isMultiPeriod) {
      return calculateMultiPeriodAdjustment({
        effectiveChangeDate: state.changeDate,
        currentDate: state.periodEnd,
        billingCycle: state.billingCycle,
        billingAnchorDay: state.billingAnchorDay,
        oldPlan: state.plan,
        newPlan: state.newPlan,
      });
    }
    return null;
  }, [state, validationErrors, isMultiPeriod]);

  // Generate invoice
  const invoice: Invoice | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (isMultiPeriod && multiPeriodResult) {
      return generateMultiPeriodInvoice(
        {
          effectiveChangeDate: state.changeDate,
          currentDate: state.periodEnd,
          billingCycle: state.billingCycle,
          billingAnchorDay: state.billingAnchorDay,
          oldPlan: state.plan,
          newPlan: state.newPlan,
        },
        multiPeriodResult
      );
    } else if (planChangeResult) {
      return generatePlanChangeInvoice(
        state.periodStart,
        state.periodEnd,
        state.changeDate,
        state.plan,
        state.newPlan,
        planChangeResult
      );
    }
    return null;
  }, [state, planChangeResult, multiPeriodResult, validationErrors, isMultiPeriod]);

  return {
    ...state,
    isMultiPeriod,
    planChangeResult,
    multiPeriodResult,
    invoice,
    validationErrors,
    availablePlans: DEFAULT_PLANS,
    updateBillingCycle,
    updatePeriodStart,
    updatePlan,
    updateNewPlan,
    updateChangeDate,
    updatePlanPrice,
    updateNewPlanPrice,
    updatePlanName,
    updateNewPlanName,
    updateBillingAnchorDay,
  };
}
