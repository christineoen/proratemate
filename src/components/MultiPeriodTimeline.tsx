import { format } from 'date-fns';
import { formatCurrency } from '../utils/proration';
import type { MultiPeriodResult, Plan } from '../types/billing';

interface MultiPeriodTimelineProps {
  multiPeriodResult: MultiPeriodResult;
  oldPlan: Plan;
  newPlan: Plan;
}

export function MultiPeriodTimeline({
  multiPeriodResult,
  oldPlan,
  newPlan,
}: MultiPeriodTimelineProps) {
  const { periods, totalPeriodsAffected, totalCredits, totalCharges, netAdjustment, isUpgrade } = multiPeriodResult;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Multi-Period Adjustment</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isUpgrade
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {isUpgrade ? 'Plan Upgrade' : 'Plan Downgrade'}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          The plan change date is before the current period, so {totalPeriodsAffected} billing period{totalPeriodsAffected !== 1 ? 's are' : ' is'} being adjusted retroactively.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalPeriodsAffected}</div>
            <div className="text-xs text-gray-500">Periods Affected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalCredits)}</div>
            <div className="text-xs text-gray-500">Total Credits</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCharges)}</div>
            <div className="text-xs text-gray-500">Total Charges</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${netAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netAdjustment))}
            </div>
            <div className="text-xs text-gray-500">
              {netAdjustment >= 0 ? 'Amount Due' : 'Refund Due'}
            </div>
          </div>
        </div>
      </div>

      {/* Period cards */}
      <div className="space-y-4">
        {periods.map((period, index) => {
          const affectedPercentage = (period.daysAffected / period.daysInPeriod) * 100;
          const unaffectedPercentage = 100 - affectedPercentage;
          const isFirstPeriod = index === 0;

          return (
            <div key={period.periodNumber} className="border border-gray-200 rounded-lg p-4">
              {/* Period header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    Period {period.periodNumber}
                  </span>
                  {period.isPartialPeriod && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Partial
                    </span>
                  )}
                </div>
                <div className={`text-sm font-medium ${period.netAdjustment >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {period.netAdjustment >= 0 ? '' : '-'}{formatCurrency(Math.abs(period.netAdjustment))}
                  <span className="text-gray-500 font-normal ml-1">
                    {period.netAdjustment >= 0 ? 'due' : 'credit'}
                  </span>
                </div>
              </div>

              {/* Combined credit/charge line */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-green-700">{formatCurrency(period.creditFromOldPlan)}</span>
                    <span className="text-xs text-gray-400">credit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-amber-700">{formatCurrency(period.chargeForNewPlan)}</span>
                    <span className="text-xs text-gray-400">charge</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{period.daysAffected} days affected</span>
              </div>

              {/* Stacked timeline bars */}
              <div className="space-y-1">
                {/* Credit bar */}
                <div className="h-5 rounded overflow-hidden bg-gray-100">
                  {period.partialPosition === 'start' && unaffectedPercentage > 0 && (
                    <div className="h-full inline-block" style={{ width: `${unaffectedPercentage}%` }}></div>
                  )}
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 inline-flex items-center justify-center text-xs font-medium text-white"
                    style={{ width: `${affectedPercentage}%` }}
                  >
                    {affectedPercentage > 30 && `${oldPlan.name} credit`}
                  </div>
                </div>

                {/* Charge bar */}
                <div className="h-5 rounded overflow-hidden bg-gray-100">
                  {period.partialPosition === 'start' && unaffectedPercentage > 0 && (
                    <div className="h-full inline-block" style={{ width: `${unaffectedPercentage}%` }}></div>
                  )}
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 inline-flex items-center justify-center text-xs font-medium text-white"
                    style={{ width: `${affectedPercentage}%` }}
                  >
                    {affectedPercentage > 30 && `${newPlan.name} charge`}
                  </div>
                </div>

                {/* Date timeline bar */}
                <div className="relative h-1 rounded bg-gray-200 mt-2">
                  {/* Effective marker for first period */}
                  {isFirstPeriod && period.partialPosition === 'start' && (
                    <div
                      className="absolute top-0 w-0.5 h-2 bg-blue-500 -translate-y-0.5"
                      style={{ left: `${unaffectedPercentage}%` }}
                    ></div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 relative">
                  <span>{format(period.periodStart, 'MMM d')}</span>
                  {isFirstPeriod && period.partialPosition === 'start' && (
                    <span
                      className="absolute text-blue-600 font-medium"
                      style={{ left: `${unaffectedPercentage}%`, transform: 'translateX(-50%)' }}
                    >
                      Effective
                    </span>
                  )}
                  <span>{format(period.periodEnd, 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-700">{formatCurrency(totalCredits)}</div>
            <div className="text-xs text-green-600">Total Credits</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-700">{formatCurrency(totalCharges)}</div>
            <div className="text-xs text-amber-600">Total Charges</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            netAdjustment >= 0 ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <div className={`text-lg font-bold ${netAdjustment >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
              {formatCurrency(Math.abs(netAdjustment))}
            </div>
            <div className={`text-xs ${netAdjustment >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {netAdjustment >= 0 ? 'Amount Due' : 'Credit Due'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
