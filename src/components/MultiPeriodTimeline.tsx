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
            {isUpgrade ? 'Upgrade' : 'Downgrade'}
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

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-gray-600">{oldPlan.name} ({formatCurrency(oldPlan.price)}/period)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${isUpgrade ? 'bg-green-500' : 'bg-purple-500'}`}></div>
          <span className="text-sm text-gray-600">{newPlan.name} ({formatCurrency(newPlan.price)}/period)</span>
        </div>
      </div>

      {/* Period bars */}
      <div className="space-y-4">
        {periods.map((period) => {
          const usedPercentage = (period.daysAffected / period.daysInPeriod) * 100;

          return (
            <div key={period.periodNumber} className="border border-gray-200 rounded-lg p-4">
              {/* Period header */}
              <div className="flex items-center justify-between mb-2">
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
                <span className="text-sm text-gray-500">
                  {format(period.periodStart, 'MMM d')} - {format(period.periodEnd, 'MMM d, yyyy')}
                </span>
              </div>

              {/* Timeline bar */}
              <div className="h-8 rounded-lg overflow-hidden flex bg-gray-100 mb-3">
                {/* Render unaffected portion first if partialPosition is 'start' (first period) */}
                {period.partialPosition === 'start' && (
                  <div
                    className="bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500"
                    style={{ width: `${100 - usedPercentage}%` }}
                  >
                    {100 - usedPercentage > 20 && 'Not affected'}
                  </div>
                )}
                {/* Affected portion (colored bar) */}
                {period.daysAffected > 0 && (
                  <div
                    className={`flex items-center justify-center text-xs font-medium text-white ${
                      isUpgrade
                        ? 'bg-gradient-to-r from-amber-400 via-green-400 to-green-500'
                        : 'bg-gradient-to-r from-amber-400 via-purple-400 to-purple-500'
                    }`}
                    style={{ width: `${usedPercentage}%` }}
                  >
                    {usedPercentage > 20 && `${period.daysAffected} days`}
                  </div>
                )}
                {/* Render unaffected portion last if partialPosition is 'end' (last period) */}
                {period.partialPosition === 'end' && (
                  <div
                    className="bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500"
                    style={{ width: `${100 - usedPercentage}%` }}
                  >
                    {100 - usedPercentage > 20 && 'Not affected'}
                  </div>
                )}
              </div>

              {/* Period details */}
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-amber-600 font-medium">-{formatCurrency(period.creditFromOldPlan)}</div>
                  <div className="text-xs text-gray-500">Credit ({oldPlan.name})</div>
                </div>
                <div>
                  <div className="text-blue-600 font-medium">+{formatCurrency(period.chargeForNewPlan)}</div>
                  <div className="text-xs text-gray-500">Charge ({newPlan.name})</div>
                </div>
                <div>
                  <div className={`font-medium ${period.netAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {period.netAdjustment >= 0 ? '+' : ''}{formatCurrency(period.netAdjustment)}
                  </div>
                  <div className="text-xs text-gray-500">Net</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-700">{formatCurrency(totalCredits)}</div>
            <div className="text-xs text-amber-600">Total Credits from {oldPlan.name}</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{formatCurrency(totalCharges)}</div>
            <div className="text-xs text-blue-600">Total Charges for {newPlan.name}</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            netAdjustment >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`text-lg font-bold ${netAdjustment >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netAdjustment))}
            </div>
            <div className={`text-xs ${netAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netAdjustment >= 0 ? 'Total Amount Due' : 'Total Refund Due'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
