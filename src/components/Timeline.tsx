import { format } from 'date-fns';
import { formatCurrency } from '../utils/proration';
import { DateRangePicker } from './DateRangePicker';
import type {
  Plan,
  ProrationScenario,
  ServiceEndResult,
  ServiceStartResult,
  PlanChangeResult,
} from '../types/billing';

interface TimelineProps {
  scenario: ProrationScenario;
  serviceEndResult: ServiceEndResult | null;
  serviceStartResult: ServiceStartResult | null;
  planChangeResult: PlanChangeResult | null;
  oldPlan: Plan;
  newPlan: Plan;
  changeDate: Date;
  onChangeDateChange: (date: Date) => void;
  showPreviousPlan: boolean;
  showNextPlan: boolean;
}

function getDateLabel(scenario: ProrationScenario, showPreviousPlan: boolean, showNextPlan: boolean): string {
  if (showPreviousPlan && showNextPlan) return 'Effective Date';
  switch (scenario) {
    case 'serviceEnd':
      return 'Cancellation Date';
    case 'serviceStart':
      return 'Start Date';
    case 'planChange':
      return 'Change Date';
    default:
      return 'Effective Date';
  }
}

// Check if the effective date label would overlap with start/end labels
// Returns true if label should be on a second row
function shouldLabelBeOnSecondRow(percentage: number): boolean {
  const EDGE_THRESHOLD = 18; // percentage from edge where overlap occurs
  return percentage < EDGE_THRESHOLD || percentage > (100 - EDGE_THRESHOLD);
}

export function Timeline({
  scenario,
  serviceEndResult,
  serviceStartResult,
  planChangeResult,
  oldPlan,
  newPlan,
  changeDate,
  onChangeDateChange,
  showPreviousPlan,
  showNextPlan,
}: TimelineProps) {
  if (scenario === 'none') {
    return null;
  }

  const dateLabel = getDateLabel(scenario, showPreviousPlan, showNextPlan);

  // Service End (Cancellation)
  if (scenario === 'serviceEnd' && serviceEndResult) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-40">
                <DateRangePicker
                  label={dateLabel}
                  value={changeDate}
                  onChange={onChangeDateChange}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Service Cancellation</h3>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
              Cancellation
            </div>
          </div>
          <p className="text-sm text-gray-500 ml-44">
            {serviceEndResult.totalPeriodsAffected} billing period{serviceEndResult.totalPeriodsAffected !== 1 ? 's' : ''} affected
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{serviceEndResult.totalPeriodsAffected}</div>
              <div className="text-xs text-gray-500">Periods Affected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(serviceEndResult.totalCredit)}</div>
              <div className="text-xs text-gray-500">Total Credit</div>
            </div>
          </div>
        </div>

        {/* Period cards */}
        <div className="space-y-4">
          {serviceEndResult.periods.map((period, index) => {
            const creditPercentage = (period.daysCredited / period.daysInPeriod) * 100;
            const usedPercentage = 100 - creditPercentage;
            const isFirstPeriod = index === 0;

            return (
              <div key={period.periodNumber} className="border border-gray-200 rounded-lg p-4">
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
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(period.credit)}
                    <span className="text-gray-500 font-normal ml-1">credit</span>
                  </div>
                </div>

                {/* Info line */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-amber-700">{period.daysUsed} days</span>
                      <span className="text-xs text-gray-400">used</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-700">{period.daysCredited} days</span>
                      <span className="text-xs text-gray-400">credited</span>
                    </div>
                  </div>
                </div>

                {/* Stacked timeline bars */}
                <div className="space-y-1">
                  {/* Used bar */}
                  <div className="h-5 rounded overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 inline-flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${usedPercentage}%` }}
                    >
                      {usedPercentage > 30 && `${oldPlan.name} used`}
                    </div>
                  </div>

                  {/* Credit bar */}
                  <div className="h-5 rounded overflow-hidden bg-gray-100">
                    {period.partialPosition === 'start' && usedPercentage > 0 && (
                      <div className="h-full inline-block" style={{ width: `${usedPercentage}%` }}></div>
                    )}
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 inline-flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${creditPercentage}%` }}
                    >
                      {creditPercentage > 30 && `${oldPlan.name} credit`}
                    </div>
                  </div>

                  {/* Date timeline bar */}
                  {(() => {
                    const showEffectiveLabel = isFirstPeriod && period.partialPosition === 'start';
                    const labelOnSecondRow = showEffectiveLabel && shouldLabelBeOnSecondRow(usedPercentage);

                    return (
                      <>
                        <div className="relative h-1 rounded bg-gray-200 mt-2">
                          {showEffectiveLabel && (
                            <div
                              className="absolute top-0 w-0.5 h-2 bg-red-500 -translate-y-0.5"
                              style={{ left: `${usedPercentage}%` }}
                            ></div>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 relative">
                          <span>{format(period.periodStart, 'MMM d')}</span>
                          {showEffectiveLabel && !labelOnSecondRow && (
                            <span
                              className="absolute text-red-600 font-medium"
                              style={{ left: `${usedPercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Canceled
                            </span>
                          )}
                          <span>{format(period.periodEnd, 'MMM d, yyyy')}</span>
                        </div>
                        {labelOnSecondRow && (
                          <div className="relative text-xs h-4">
                            <span
                              className="absolute text-red-600 font-medium whitespace-nowrap"
                              style={{ left: `${usedPercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Canceled
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals summary */}
        {serviceEndResult.totalPeriodsAffected > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-700">{formatCurrency(serviceEndResult.totalCredit)}</div>
              <div className="text-xs text-green-600">Total Credit Due</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Service Start
  if (scenario === 'serviceStart' && serviceStartResult) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-40">
                <DateRangePicker
                  label={dateLabel}
                  value={changeDate}
                  onChange={onChangeDateChange}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Service Start</h3>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
              New Service
            </div>
          </div>
          <p className="text-sm text-gray-500 ml-44">
            {serviceStartResult.totalPeriodsAffected} billing period{serviceStartResult.totalPeriodsAffected !== 1 ? 's' : ''} affected
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{serviceStartResult.totalPeriodsAffected}</div>
              <div className="text-xs text-gray-500">Periods Affected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(serviceStartResult.totalCharge)}</div>
              <div className="text-xs text-gray-500">Total Charge</div>
            </div>
          </div>
        </div>

        {/* Period cards */}
        <div className="space-y-4">
          {serviceStartResult.periods.map((period, index) => {
            const chargePercentage = (period.daysCharged / period.daysInPeriod) * 100;
            const inactivePercentage = 100 - chargePercentage;
            const isFirstPeriod = index === 0;

            return (
              <div key={period.periodNumber} className="border border-gray-200 rounded-lg p-4">
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
                  <div className="text-sm font-medium text-amber-600">
                    {formatCurrency(period.charge)}
                    <span className="text-gray-500 font-normal ml-1">charge</span>
                  </div>
                </div>

                {/* Info line */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-sm text-gray-600">{period.daysInactive} days</span>
                      <span className="text-xs text-gray-400">inactive</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-sm text-amber-700">{period.daysCharged} days</span>
                      <span className="text-xs text-gray-400">charged</span>
                    </div>
                  </div>
                </div>

                {/* Stacked timeline bars */}
                <div className="space-y-1">
                  {/* Inactive bar */}
                  <div className="h-5 rounded overflow-hidden bg-gray-100">
                    <div
                      className="h-full bg-gradient-to-r from-gray-300 to-gray-400 inline-flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${inactivePercentage}%` }}
                    >
                      {inactivePercentage > 30 && 'Not active'}
                    </div>
                  </div>

                  {/* Charge bar */}
                  <div className="h-5 rounded overflow-hidden bg-gray-100">
                    {period.partialPosition === 'start' && inactivePercentage > 0 && (
                      <div className="h-full inline-block" style={{ width: `${inactivePercentage}%` }}></div>
                    )}
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 inline-flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${chargePercentage}%` }}
                    >
                      {chargePercentage > 30 && `${newPlan.name} charge`}
                    </div>
                  </div>

                  {/* Date timeline bar */}
                  {(() => {
                    const showEffectiveLabel = isFirstPeriod && period.partialPosition === 'start';
                    const labelOnSecondRow = showEffectiveLabel && shouldLabelBeOnSecondRow(inactivePercentage);

                    return (
                      <>
                        <div className="relative h-1 rounded bg-gray-200 mt-2">
                          {showEffectiveLabel && (
                            <div
                              className="absolute top-0 w-0.5 h-2 bg-amber-500 -translate-y-0.5"
                              style={{ left: `${inactivePercentage}%` }}
                            ></div>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 relative">
                          <span>{format(period.periodStart, 'MMM d')}</span>
                          {showEffectiveLabel && !labelOnSecondRow && (
                            <span
                              className="absolute text-amber-600 font-medium"
                              style={{ left: `${inactivePercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Started
                            </span>
                          )}
                          <span>{format(period.periodEnd, 'MMM d, yyyy')}</span>
                        </div>
                        {labelOnSecondRow && (
                          <div className="relative text-xs h-4">
                            <span
                              className="absolute text-amber-600 font-medium whitespace-nowrap"
                              style={{ left: `${inactivePercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Started
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals summary */}
        {serviceStartResult.totalPeriodsAffected > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-lg font-bold text-amber-700">{formatCurrency(serviceStartResult.totalCharge)}</div>
              <div className="text-xs text-amber-600">Total Amount Due</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Plan Change
  if (scenario === 'planChange' && planChangeResult) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="w-40">
                <DateRangePicker
                  label={dateLabel}
                  value={changeDate}
                  onChange={onChangeDateChange}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Plan Change</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              planChangeResult.isUpgrade
                ? 'bg-green-100 text-green-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {planChangeResult.isUpgrade ? 'Plan Upgrade' : 'Plan Downgrade'}
            </div>
          </div>
          <p className="text-sm text-gray-500 ml-44">
            {planChangeResult.totalPeriodsAffected} billing period{planChangeResult.totalPeriodsAffected !== 1 ? 's' : ''} affected
          </p>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{planChangeResult.totalPeriodsAffected}</div>
              <div className="text-xs text-gray-500">Periods Affected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(planChangeResult.totalCredits)}</div>
              <div className="text-xs text-gray-500">Total Credits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(planChangeResult.totalCharges)}</div>
              <div className="text-xs text-gray-500">Total Charges</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${planChangeResult.netAdjustment >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(planChangeResult.netAdjustment))}
              </div>
              <div className="text-xs text-gray-500">
                {planChangeResult.netAdjustment >= 0 ? 'Amount Due' : 'Refund Due'}
              </div>
            </div>
          </div>
        </div>

        {/* Period cards */}
        <div className="space-y-4">
          {planChangeResult.periods.map((period, index) => {
            const affectedPercentage = (period.daysAffected / period.daysInPeriod) * 100;
            const unaffectedPercentage = 100 - affectedPercentage;
            const isFirstPeriod = index === 0;

            return (
              <div key={period.periodNumber} className="border border-gray-200 rounded-lg p-4">
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
                  {(() => {
                    const showEffectiveLabel = isFirstPeriod && period.partialPosition === 'start';
                    const labelOnSecondRow = showEffectiveLabel && shouldLabelBeOnSecondRow(unaffectedPercentage);

                    return (
                      <>
                        <div className="relative h-1 rounded bg-gray-200 mt-2">
                          {showEffectiveLabel && (
                            <div
                              className="absolute top-0 w-0.5 h-2 bg-blue-500 -translate-y-0.5"
                              style={{ left: `${unaffectedPercentage}%` }}
                            ></div>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 relative">
                          <span>{format(period.periodStart, 'MMM d')}</span>
                          {showEffectiveLabel && !labelOnSecondRow && (
                            <span
                              className="absolute text-blue-600 font-medium"
                              style={{ left: `${unaffectedPercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Effective
                            </span>
                          )}
                          <span>{format(period.periodEnd, 'MMM d, yyyy')}</span>
                        </div>
                        {labelOnSecondRow && (
                          <div className="relative text-xs h-4">
                            <span
                              className="absolute text-blue-600 font-medium whitespace-nowrap"
                              style={{ left: `${unaffectedPercentage}%`, transform: 'translateX(-50%)' }}
                            >
                              Effective
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals summary */}
        {planChangeResult.totalPeriodsAffected > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">{formatCurrency(planChangeResult.totalCredits)}</div>
                <div className="text-xs text-green-600">Total Credits</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-lg font-bold text-amber-700">{formatCurrency(planChangeResult.totalCharges)}</div>
                <div className="text-xs text-amber-600">Total Charges</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                planChangeResult.netAdjustment >= 0 ? 'bg-amber-50' : 'bg-green-50'
              }`}>
                <div className={`text-lg font-bold ${planChangeResult.netAdjustment >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {formatCurrency(Math.abs(planChangeResult.netAdjustment))}
                </div>
                <div className={`text-xs ${planChangeResult.netAdjustment >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {planChangeResult.netAdjustment >= 0 ? 'Amount Due' : 'Credit Due'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
