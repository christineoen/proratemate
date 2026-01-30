import type { BillingCycle } from '../types/billing';
import { CYCLE_LABELS } from '../types/billing';
import { DateRangePicker } from './DateRangePicker';
import type { CalculationType } from '../hooks/useProration';

interface ProrationFormProps {
  calculationType: CalculationType;
  periodStart: Date;
  serviceStart: Date;
  billingCycle: BillingCycle;
  planName: string;
  planPrice: number;
  changeDate: Date;
  newPlanName: string;
  newPlanPrice: number;
  periodEnd: Date;
  validationErrors: string[];
  billingAnchorDay: number;
  isMultiPeriod: boolean;
  onCalculationTypeChange: (type: CalculationType) => void;
  onPeriodStartChange: (date: Date) => void;
  onServiceStartChange: (date: Date) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onPlanNameChange: (name: string) => void;
  onPlanPriceChange: (price: number) => void;
  onChangeDateChange: (date: Date) => void;
  onNewPlanNameChange: (name: string) => void;
  onNewPlanPriceChange: (price: number) => void;
  onBillingAnchorDayChange: (day: number) => void;
}

export function ProrationForm({
  calculationType,
  periodStart,
  serviceStart,
  billingCycle,
  planName,
  planPrice,
  changeDate,
  newPlanName,
  newPlanPrice,
  periodEnd,
  validationErrors,
  billingAnchorDay,
  isMultiPeriod,
  onCalculationTypeChange,
  onPeriodStartChange,
  onServiceStartChange,
  onBillingCycleChange,
  onPlanNameChange,
  onPlanPriceChange,
  onChangeDateChange,
  onNewPlanNameChange,
  onNewPlanPriceChange,
  onBillingAnchorDayChange,
}: ProrationFormProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Billing Configuration</h3>

      {/* Calculation Type Toggle */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">Calculation Type</label>
        <div className="flex gap-2">
          <button
            onClick={() => onCalculationTypeChange('lateStart')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              calculationType === 'lateStart'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Late Start
          </button>
          <button
            onClick={() => onCalculationTypeChange('planChange')}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              calculationType === 'planChange'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Plan Change
          </button>
        </div>
      </div>

      {/* Plan Change: Billing Cycle, Period Start, and Anchor Day on same line */}
      {calculationType === 'planChange' && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Billing Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => onBillingCycleChange(e.target.value as BillingCycle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {Object.entries(CYCLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <DateRangePicker
              label="Current Period Start"
              value={periodStart}
              onChange={onPeriodStartChange}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Billing Anchor Day</label>
            <select
              value={billingAnchorDay}
              onChange={(e) => onBillingAnchorDayChange(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}{day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Late Start: Billing Cycle only */}
      {calculationType === 'lateStart' && (
        <>
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">Billing Cycle</label>
            <select
              value={billingCycle}
              onChange={(e) => onBillingCycleChange(e.target.value as BillingCycle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              {Object.entries(CYCLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <DateRangePicker
              label="Period Start Date"
              value={periodStart}
              onChange={onPeriodStartChange}
            />
          </div>
        </>
      )}

      {/* Multi-period indicator */}
      {calculationType === 'planChange' && isMultiPeriod && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="text-sm font-semibold text-indigo-700 mb-1">Multi-Period Adjustment</h4>
          <p className="text-xs text-indigo-600">
            The change date is before the current period, so multiple billing periods will be adjusted.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          {calculationType === 'planChange' ? 'Current Plan' : 'Plan Details'}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Plan Name</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => onPlanNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g., Pro"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Price (per period)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={planPrice}
                onChange={(e) => onPlanPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Late Start: Service Start Date */}
      {calculationType === 'lateStart' && (
        <div className="mb-6">
          <DateRangePicker
            label="Service Start Date"
            value={serviceStart}
            onChange={onServiceStartChange}
            min={periodStart}
            max={periodEnd}
          />
          <p className="mt-1 text-xs text-gray-500">
            The date when the customer's service begins
          </p>
        </div>
      )}

      {/* Plan Change: New Plan + Change Date */}
      {calculationType === 'planChange' && (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-700 mb-3">New Plan</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => onNewPlanNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g., Enterprise"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Price (per period)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={newPlanPrice}
                    onChange={(e) => onNewPlanPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <DateRangePicker
              label="Change Date"
              value={changeDate}
              onChange={onChangeDateChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              The date when the plan change takes effect
              {isMultiPeriod && ' (retroactive - before current period)'}
            </p>
          </div>
        </>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-700 mb-2">Please fix the following:</h4>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-600">{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
