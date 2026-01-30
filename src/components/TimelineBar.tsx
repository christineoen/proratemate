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

      {/* Plan Lines */}
      <div className="mb-4 space-y-2">
        {/* Old Plan Line */}
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div>
              <span className="font-medium text-amber-700">{plan.name}</span>
              <span className="text-amber-600 text-sm ml-2">
                {format(periodStart, 'MMM d')} - {format(changeDate, 'MMM d, yyyy')}
              </span>
              <span className="text-amber-500 text-sm ml-2">({daysOnOldPlan} days)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-amber-600">Credit</div>
            <div className="font-semibold text-amber-700">{formatCurrency(planChangeResult.oldPlanCredit)}</div>
          </div>
        </div>

        {/* New Plan Line */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          planChangeResult.isUpgrade
            ? 'bg-green-50 border-green-200'
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${planChangeResult.isUpgrade ? 'bg-green-500' : 'bg-purple-500'}`}></div>
            <div>
              <span className={`font-medium ${planChangeResult.isUpgrade ? 'text-green-700' : 'text-purple-700'}`}>
                {newPlan.name}
              </span>
              <span className={`text-sm ml-2 ${planChangeResult.isUpgrade ? 'text-green-600' : 'text-purple-600'}`}>
                {format(changeDate, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')}
              </span>
              <span className={`text-sm ml-2 ${planChangeResult.isUpgrade ? 'text-green-500' : 'text-purple-500'}`}>
                ({daysOnNewPlan} days)
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm ${planChangeResult.isUpgrade ? 'text-green-600' : 'text-purple-600'}`}>Charge</div>
            <div className={`font-semibold ${planChangeResult.isUpgrade ? 'text-green-700' : 'text-purple-700'}`}>
              {formatCurrency(planChangeResult.newPlanCharge)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="relative mb-6">
        <div className="h-8 rounded-lg overflow-hidden flex">
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

      {/* Net Result */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Net Result</span>
          <div className={`text-xl font-bold ${planChangeResult.netAmount >= 0 ? 'text-blue-600' : 'text-green-600'}`}>
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
