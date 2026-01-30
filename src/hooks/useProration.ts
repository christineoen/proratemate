import { useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, getDate, isBefore, differenceInSeconds, startOfDay } from 'date-fns';
import type {
  BillingCycle,
  Plan,
  PlanChangeResult,
  Invoice,
  MultiPeriodResult,
  ProrationScenario,
  ServiceEndResult,
  ServiceStartResult,
} from '../types/billing';
import {
  calculatePeriodEnd,
  calculatePlanChange,
  generatePlanChangeInvoice,
  calculateMultiPeriodAdjustment,
  generateMultiPeriodInvoice,
  validateMultiPeriodInput,
  calculateSecondsInPeriod,
  calculateSecondlyRate,
  secondsToDays,
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

const DEFAULT_CURRENT_PLAN: Plan = { name: 'Basic', price: 29, cycle: 'monthly' };
const DEFAULT_NEW_PLAN: Plan = { name: 'Pro', price: 99, cycle: 'monthly' };

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

    // Common date validation
    if (isBefore(state.changeDate, state.periodStart)) {
      // Multi-period mode - use multi-period validation
      if (scenario === 'planChange') {
        return validateMultiPeriodInput({
          effectiveChangeDate: state.changeDate,
          currentDate: state.periodEnd,
          billingCycle: state.billingCycle,
          billingAnchorDay: state.billingAnchorDay,
          oldPlan: state.plan,
          newPlan: state.newPlan,
        });
      }
      // For single plan scenarios, date before period is an error
      errors.push('Date must be within the billing period');
      return errors;
    }

    // Single period validation
    if (isBefore(state.periodEnd, state.changeDate)) {
      errors.push('Date must be within the billing period');
    }

    return errors;
  }, [state, scenario]);

  // Calculate service end result (current plan only - cancellation credit)
  const serviceEndResult: ServiceEndResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'serviceEnd') return null;

    const totalSecondsInPeriod = calculateSecondsInPeriod(state.periodStart, state.periodEnd);
    const secondsUsed = differenceInSeconds(state.changeDate, state.periodStart);
    const secondsRemaining = totalSecondsInPeriod - secondsUsed;
    const secondlyRate = calculateSecondlyRate(state.plan.price, totalSecondsInPeriod);
    const credit = Math.round(secondlyRate * secondsRemaining * 100) / 100;
    const percentageUsed = (secondsUsed / totalSecondsInPeriod) * 100;

    return {
      credit,
      daysUsed: Math.round(secondsToDays(secondsUsed) * 100) / 100,
      daysRemaining: Math.round(secondsToDays(secondsRemaining) * 100) / 100,
      totalDaysInPeriod: Math.round(secondsToDays(totalSecondsInPeriod) * 100) / 100,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
    };
  }, [state, validationErrors, scenario]);

  // Calculate service start result (new plan only - prorated charge)
  const serviceStartResult: ServiceStartResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'serviceStart') return null;

    const totalSecondsInPeriod = calculateSecondsInPeriod(state.periodStart, state.periodEnd);
    const secondsInactive = differenceInSeconds(state.changeDate, state.periodStart);
    const secondsActive = totalSecondsInPeriod - secondsInactive;
    const secondlyRate = calculateSecondlyRate(state.newPlan.price, totalSecondsInPeriod);
    const charge = Math.round(secondlyRate * secondsActive * 100) / 100;
    const percentageActive = (secondsActive / totalSecondsInPeriod) * 100;

    return {
      charge,
      daysActive: Math.round(secondsToDays(secondsActive) * 100) / 100,
      daysInactive: Math.round(secondsToDays(secondsInactive) * 100) / 100,
      totalDaysInPeriod: Math.round(secondsToDays(totalSecondsInPeriod) * 100) / 100,
      percentageActive: Math.round(percentageActive * 100) / 100,
    };
  }, [state, validationErrors, scenario]);

  // Calculate plan change result (single period only)
  const planChangeResult: PlanChangeResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'planChange') return null;

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
  }, [state, validationErrors, isMultiPeriod, scenario]);

  // Calculate multi-period result (when plan change date is before current period)
  const multiPeriodResult: MultiPeriodResult | null = useMemo(() => {
    if (validationErrors.length > 0 || scenario !== 'planChange') return null;

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
  }, [state, validationErrors, isMultiPeriod, scenario]);

  // Generate invoice
  const invoice: Invoice | null = useMemo(() => {
    if (validationErrors.length > 0) return null;

    // Service End: Credit for unused portion
    if (scenario === 'serviceEnd' && serviceEndResult) {
      return {
        lines: [
          {
            description: `${state.plan.name} - Credit for unused portion (${serviceEndResult.daysRemaining} days)`,
            quantity: 1,
            unitPrice: -serviceEndResult.credit,
            amount: -serviceEndResult.credit,
            isCredit: true,
          },
        ],
        subtotal: 0,
        credits: serviceEndResult.credit,
        total: -serviceEndResult.credit,
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
      };
    }

    // Service Start: Prorated charge
    if (scenario === 'serviceStart' && serviceStartResult) {
      return {
        lines: [
          {
            description: `${state.newPlan.name} - Prorated charge (${serviceStartResult.daysActive} days)`,
            quantity: 1,
            unitPrice: serviceStartResult.charge,
            amount: serviceStartResult.charge,
            isCredit: false,
          },
        ],
        subtotal: serviceStartResult.charge,
        credits: 0,
        total: serviceStartResult.charge,
        periodStart: state.periodStart,
        periodEnd: state.periodEnd,
      };
    }

    // Plan Change: Multi-period
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
    }

    // Plan Change: Single period
    if (planChangeResult) {
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
  }, [state, planChangeResult, multiPeriodResult, serviceEndResult, serviceStartResult, validationErrors, isMultiPeriod, scenario]);

  return {
    ...state,
    scenario,
    isMultiPeriod,
    showPreviousPlan,
    showNextPlan,
    serviceEndResult,
    serviceStartResult,
    planChangeResult,
    multiPeriodResult,
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
