import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '../utils/proration';
import type { PlanChangeResult, MultiPeriodResult, Plan, ProrationScenario, ServiceEndResult, ServiceStartResult } from '../types/billing';
import { MultiPeriodTimeline } from './MultiPeriodTimeline';

interface TimelineBarProps {
  periodStart: Date;
  periodEnd: Date;
  changeDate: Date;
  planChangeResult?: PlanChangeResult | null;
  multiPeriodResult?: MultiPeriodResult | null;
  serviceEndResult?: ServiceEndResult | null;
  serviceStartResult?: ServiceStartResult | null;
  plan: Plan;
  newPlan: Plan;
  isMultiPeriod: boolean;
  scenario: ProrationScenario;
}

export function TimelineBar({
  periodStart,
  periodEnd,
  changeDate,
  planChangeResult,
  multiPeriodResult,
  serviceEndResult,
  serviceStartResult,
  plan,
  newPlan,
  isMultiPeriod,
  scenario,
}: TimelineBarProps) {
  // Handle multi-period mode (only for plan change)
  if (isMultiPeriod && multiPeriodResult && scenario === 'planChange') {
    return (
      <MultiPeriodTimeline
        multiPeriodResult={multiPeriodResult}
        oldPlan={plan}
        newPlan={newPlan}
      />
    );
  }

  // Service End: Current plan only - cancellation credit
  if (scenario === 'serviceEnd' && serviceEndResult) {
    const activePercentage = serviceEndResult.percentageUsed;
    const canceledPercentage = 100 - activePercentage;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Cancellation Timeline</h3>

        {/* Plan Lines */}
        <div className="mb-4 space-y-2">
          {/* Active Service Line */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <span className="font-medium text-amber-700">{plan.name}</span>
                <span className="text-amber-600 text-sm ml-2">
                  {format(periodStart, 'MMM d')} - {format(changeDate, 'MMM d, yyyy')}
                </span>
                <span className="text-amber-500 text-sm ml-2">({serviceEndResult.daysUsed} days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-600">Used</div>
            </div>
          </div>

          {/* Credit Line */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <span className="font-medium text-green-700">Unused Portion</span>
                <span className="text-green-600 text-sm ml-2">
                  {format(changeDate, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')}
                </span>
                <span className="text-green-500 text-sm ml-2">({serviceEndResult.daysRemaining} days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600">Credit</div>
              <div className="font-semibold text-green-700">{formatCurrency(serviceEndResult.credit)}</div>
            </div>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="relative mb-6">
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${activePercentage}%` }}
            >
              {activePercentage > 15 && `${serviceEndResult.daysUsed} days`}
            </div>
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${canceledPercentage}%` }}
            >
              {canceledPercentage > 15 && `${serviceEndResult.daysRemaining} days`}
            </div>
          </div>

          {/* Date markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div className="flex flex-col items-start">
              <span className="font-medium">Period Start</span>
              <span>{format(periodStart, 'MMM d, yyyy')}</span>
            </div>
            <div
              className="flex flex-col items-center absolute"
              style={{ left: `${activePercentage}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-3 bg-red-500 -mt-3 mb-1"></div>
              <span className="font-medium text-red-600">Canceled</span>
              <span>{format(changeDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-medium">Period End</span>
              <span>{format(periodEnd, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Net Result */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Credit Due</span>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(serviceEndResult.credit)}
              <span className="text-sm font-normal text-gray-500 ml-2">refund</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Service Start: New plan only - prorated charge
  if (scenario === 'serviceStart' && serviceStartResult) {
    const inactivePercentage = 100 - serviceStartResult.percentageActive;
    const activePercentage = serviceStartResult.percentageActive;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Start Timeline</h3>

        {/* Plan Line */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <span className="font-medium text-amber-700">{newPlan.name}</span>
                <span className="text-amber-600 text-sm ml-2">
                  {format(changeDate, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')}
                </span>
                <span className="text-amber-500 text-sm ml-2">({serviceStartResult.daysActive} days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-600">Charge</div>
              <div className="font-semibold text-amber-700">{formatCurrency(serviceStartResult.charge)}</div>
            </div>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="relative mb-6">
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${inactivePercentage}%` }}
            >
              {inactivePercentage > 15 && `${serviceStartResult.daysInactive} days`}
            </div>
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${activePercentage}%` }}
            >
              {activePercentage > 15 && `${serviceStartResult.daysActive} days`}
            </div>
          </div>

          {/* Date markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div className="flex flex-col items-start">
              <span className="font-medium">Period Start</span>
              <span>{format(periodStart, 'MMM d, yyyy')}</span>
            </div>
            <div
              className="flex flex-col items-center absolute"
              style={{ left: `${inactivePercentage}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-3 bg-amber-500 -mt-3 mb-1"></div>
              <span className="font-medium text-amber-600">Started</span>
              <span>{format(changeDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-medium">Period End</span>
              <span>{format(periodEnd, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Net Result */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount Due</span>
            <div className="text-xl font-bold text-amber-600">
              {formatCurrency(serviceStartResult.charge)}
              <span className="text-sm font-normal text-gray-500 ml-2">prorated</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Plan Change: Single period
  if (scenario === 'planChange' && planChangeResult) {
    const totalDays = differenceInDays(periodEnd, periodStart);
    const daysOnOldPlan = planChangeResult.oldPlanDaysUsed;
    const daysOnNewPlan = planChangeResult.newPlanDaysRemaining;
    const oldPlanPercentage = (daysOnOldPlan / totalDays) * 100;
    const newPlanPercentage = (daysOnNewPlan / totalDays) * 100;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Change Timeline</h3>

        {/* Plan Lines */}
        <div className="mb-4 space-y-2">
          {/* Old Plan Line - Credit (green) */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <span className="font-medium text-green-700">{plan.name}</span>
                <span className="text-green-600 text-sm ml-2">
                  {format(periodStart, 'MMM d')} - {format(changeDate, 'MMM d, yyyy')}
                </span>
                <span className="text-green-500 text-sm ml-2">({daysOnOldPlan} days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600">Credit</div>
              <div className="font-semibold text-green-700">{formatCurrency(planChangeResult.oldPlanCredit)}</div>
            </div>
          </div>

          {/* New Plan Line - Charge (amber) */}
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <span className="font-medium text-amber-700">{newPlan.name}</span>
                <span className="text-amber-600 text-sm ml-2">
                  {format(changeDate, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')}
                </span>
                <span className="text-amber-500 text-sm ml-2">({daysOnNewPlan} days)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-600">Charge</div>
              <div className="font-semibold text-amber-700">{formatCurrency(planChangeResult.newPlanCharge)}</div>
            </div>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="relative mb-6">
          <div className="h-8 rounded-lg overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${oldPlanPercentage}%` }}
            >
              {oldPlanPercentage > 15 && `${daysOnOldPlan} days`}
            </div>
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${newPlanPercentage}%` }}
            >
              {newPlanPercentage > 15 && `${daysOnNewPlan} days`}
            </div>
          </div>

          {/* Date markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <div className="flex flex-col items-start">
              <span className="font-medium">Period Start</span>
              <span>{format(periodStart, 'MMM d, yyyy')}</span>
            </div>
            <div
              className="flex flex-col items-center absolute"
              style={{ left: `${oldPlanPercentage}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-3 bg-blue-500 -mt-3 mb-1"></div>
              <span className="font-medium text-blue-600">
                {planChangeResult.isUpgrade ? 'Upgrade' : 'Downgrade'}
              </span>
              <span>{format(changeDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-medium">Period End</span>
              <span>{format(periodEnd, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Net Result */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Net Result</span>
            <div className={`text-xl font-bold ${planChangeResult.netAmount >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {planChangeResult.netAmount >= 0 ? '' : '-'}{formatCurrency(Math.abs(planChangeResult.netAmount))}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {planChangeResult.netAmount >= 0 ? 'due' : 'credit'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No scenario or 'none' - return null
  return null;
}
