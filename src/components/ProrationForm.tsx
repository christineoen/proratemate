import type { BillingCycle } from '../types/billing';
import { CYCLE_LABELS } from '../types/billing';
import { DateRangePicker } from './DateRangePicker';

interface ProrationFormProps {
  periodStart: Date;
  billingCycle: BillingCycle;
  planName: string;
  planPrice: number;
  changeDate: Date;
  newPlanName: string;
  newPlanPrice: number;
  validationErrors: string[];
  billingAnchorDay: number;
  isMultiPeriod: boolean;
  onPeriodStartChange: (date: Date) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onPlanNameChange: (name: string) => void;
  onPlanPriceChange: (price: number) => void;
  onChangeDateChange: (date: Date) => void;
  onNewPlanNameChange: (name: string) => void;
  onNewPlanPriceChange: (price: number) => void;
  onBillingAnchorDayChange: (day: number) => void;
}

export function ProrationForm({
  periodStart,
  billingCycle,
  planName,
  planPrice,
  changeDate,
  newPlanName,
  newPlanPrice,
  validationErrors,
  billingAnchorDay,
  isMultiPeriod,
  onPeriodStartChange,
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Plan Change Calculator</h3>

      {/* Billing config in one row */}
      <div className="mb-6 grid grid-cols-4 gap-4">
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
          <label className="text-sm font-medium text-gray-700 block mb-2">Anchor Day</label>
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
        <div>
          <DateRangePicker
            label="Plan Change Date"
            value={changeDate}
            onChange={onChangeDateChange}
          />
          {isMultiPeriod && (
            <p className="mt-1 text-xs text-indigo-600">Retroactive</p>
          )}
        </div>
      </div>

      {/* Current Plan and New Plan in one row */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Current Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => onPlanNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g., Basic"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Current Plan Price</label>
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
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">New Plan Name</label>
          <input
            type="text"
            value={newPlanName}
            onChange={(e) => onNewPlanNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g., Pro"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">New Plan Price</label>
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
