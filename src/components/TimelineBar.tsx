import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '../utils/proration';
import type { PlanChangeResult, MultiPeriodResult, Plan } from '../types/billing';
import { MultiPeriodTimeline } from './MultiPeriodTimeline';

interface TimelineBarProps {
  periodStart: Date;
  periodEnd: Date;
  changeDate: Date;
  planChangeResult?: PlanChangeResult | null;
  multiPeriodResult?: MultiPeriodResult | null;
  planPrice: number;
  newPlanPrice: number;
  plan: Plan;
  newPlan: Plan;
  isMultiPeriod: boolean;
}

export function TimelineBar({
  periodStart,
  periodEnd,
  changeDate,
  planChangeResult,
  multiPeriodResult,
  planPrice,
  newPlanPrice,
  plan,
  newPlan,
  isMultiPeriod,
}: TimelineBarProps) {
  // Handle multi-period mode
  if (isMultiPeriod && multiPeriodResult) {
    return (
      <MultiPeriodTimeline
        multiPeriodResult={multiPeriodResult}
        oldPlan={plan}
        newPlan={newPlan}
      />
    );
  }

  // Single period plan change
  if (!planChangeResult) return null;

  const totalDays = differenceInDays(periodEnd, periodStart);
  const daysOnOldPlan = planChangeResult.oldPlanDaysUsed;
  const daysOnNewPlan = planChangeResult.newPlanDaysRemaining;
  const oldPlanPercentage = (daysOnOldPlan / totalDays) * 100;
  const newPlanPercentage = (daysOnNewPlan / totalDays) * 100;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Change Timeline</h3>

      {/* Timeline Bar */}
      <div className="relative mb-6">
        <div className="h-12 rounded-lg overflow-hidden flex">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${oldPlanPercentage}%` }}
          >
            {oldPlanPercentage > 15 && `${daysOnOldPlan} days`}
          </div>
          <div
            className={`bg-gradient-to-r ${planChangeResult.isUpgrade ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600'} flex items-center justify-center text-xs font-medium text-white`}
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
            <div className="w-0.5 h-3 bg-green-500 -mt-3 mb-1"></div>
            <span className={`font-medium ${planChangeResult.isUpgrade ? 'text-green-600' : 'text-purple-600'}`}>
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

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-gray-600">Old Plan ({formatCurrency(planPrice)}/period)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${planChangeResult.isUpgrade ? 'bg-green-500' : 'bg-purple-500'}`}></div>
          <span className="text-sm text-gray-600">New Plan ({formatCurrency(newPlanPrice)}/period)</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(planChangeResult.oldPlanCredit)}</div>
          <div className="text-xs text-gray-500">Credit from Old Plan</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(planChangeResult.newPlanCharge)}</div>
          <div className="text-xs text-gray-500">New Plan Charge</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${planChangeResult.netAmount >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(planChangeResult.netAmount))}
          </div>
          <div className="text-xs text-gray-500">
            {planChangeResult.netAmount >= 0 ? 'Amount Due' : 'Credit Due'}
          </div>
        </div>
      </div>
    </div>
  );
}
