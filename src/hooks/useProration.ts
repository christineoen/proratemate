import { useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, getDate, startOfDay } from 'date-fns';
import type {
  BillingCycle,
  Plan,
  Invoice,
  ProrationScenario,
  ServiceEndResult,
  ServiceStartResult,
  PlanChangeResult,
} from '../types/billing';
import {
  calculatePeriodEnd,
  calculateServiceEnd,
  calculateServiceStart,
  calculatePlanChange,
  generateServiceEndInvoice,
  generateServiceStartInvoice,
  generatePlanChangeInvoice,
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

const DEFAULT_CURRENT_PLAN: Plan = { name: 'Basic', price: 50, cycle: 'monthly' };
const DEFAULT_NEW_PLAN: Plan = { name: 'Pro', price: 200, cycle: 'monthly' };

function detectScenario(showPreviousPlan: boolean, showNextPlan: boolean): ProrationScenario {
  if (showPreviousPlan && showNextPlan) return 'planChange';
  if (showPreviousPlan && !showNextPlan) return 'serviceEnd';
  if (!showPreviousPlan && showNextPlan) return 'serviceStart';
  return 'none';
}

export function useProration() {
  const today = startOfDay(new Date());
  const defaultPeriodStart = startOfMonth(today);

  const [state, setState] = useState<UseProrationState>({
    periodStart: defaultPeriodStart,
    periodEnd: endOfMonth(defaultPeriodStart),
    billingCycle: 'monthly',
    plan: DEFAULT_CURRENT_PLAN,
    changeDate: today,
    newPlan: DEFAULT_NEW_PLAN,
    billingAnchorDay: getDate(defaultPeriodStart),
  });

  // Track visibility of plan sections
  const [showPreviousPlan, setShowPreviousPlan] = useState(true);
  const [showNextPlan, setShowNextPlan] = useState(true);

  // Detect scenario based on which plan sections are visible
  const scenario = useMemo<ProrationScenario>(() => {
    return detectScenario(showPreviousPlan, showNextPlan);
  }, [showPreviousPlan, showNextPlan]);

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
    const normalizedDate = startOfDay(date);
    const newPeriodEnd = calculatePeriodEnd(normalizedDate, state.billingCycle);
    setState(prev => ({
      ...prev,
      periodStart: normalizedDate,
      periodEnd: newPeriodEnd,
      billingAnchorDay: getDate(normalizedDate),
    }));
  }, [state.billingCycle]);

  const updatePlan = useCallback((plan: Plan) => {
    setState(prev => ({ ...prev, plan }));
  }, []);

  const updateNewPlan = useCallback((plan: Plan) => {
    setState(prev => ({ ...prev, newPlan: plan }));
  }, []);

  const updateChangeDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, changeDate: startOfDay(date) }));
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

  // Validate dates based on scenario
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // No validation needed if no scenario
    if (scenario === 'none') {
      errors.push('Please fill in at least one plan (current or new) to calculate proration');
      return errors;
    }

    // Basic validation for billing anchor day
    if (state.billingAnchorDay < 1 || state.billingAnchorDay > 31) {
      errors.push('Billing anchor day must be between 1 and 31');
    }

    return errors;
  }, [state, scenario]);

  // Calculate service end result (cancellation credit)
  const serviceEndResult: ServiceEndResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'serviceEnd') return null;

    return calculateServiceEnd(
      state.changeDate,
      state.periodEnd,
      state.billingCycle,
      state.billingAnchorDay,
      state.plan
    );
  }, [state, validationErrors, scenario]);

  // Calculate service start result (prorated charge)
  const serviceStartResult: ServiceStartResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'serviceStart') return null;

    return calculateServiceStart(
      state.changeDate,
      state.periodEnd,
      state.billingCycle,
      state.billingAnchorDay,
      state.newPlan
    );
  }, [state, validationErrors, scenario]);

  // Calculate plan change result
  const planChangeResult: PlanChangeResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'planChange') return null;

    return calculatePlanChange(
      state.changeDate,
      state.periodEnd,
      state.billingCycle,
      state.billingAnchorDay,
      state.plan,
      state.newPlan
    );
  }, [state, validationErrors, scenario]);

  // Generate invoice
  const invoice: Invoice | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    if (scenario === 'serviceEnd' && serviceEndResult) {
      return generateServiceEndInvoice(serviceEndResult, state.plan);
    }

    if (scenario === 'serviceStart' && serviceStartResult) {
      return generateServiceStartInvoice(serviceStartResult, state.newPlan);
    }

    if (scenario === 'planChange' && planChangeResult) {
      return generatePlanChangeInvoice(planChangeResult, state.plan, state.newPlan);
    }

    return null;
  }, [state, serviceEndResult, serviceStartResult, planChangeResult, validationErrors, scenario]);

  return {
    ...state,
    scenario,
    showPreviousPlan,
    showNextPlan,
    serviceEndResult,
    serviceStartResult,
    planChangeResult,
    invoice,
    validationErrors,
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
    setShowPreviousPlan,
    setShowNextPlan,
  };
}
