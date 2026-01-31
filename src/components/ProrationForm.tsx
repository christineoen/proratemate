import type { BillingCycle } from '../types/billing';
import { CYCLE_LABELS } from '../types/billing';
import { DateRangePicker } from './DateRangePicker';

interface ProrationFormProps {
  periodStart: Date;
  billingCycle: BillingCycle;
  planName: string;
  planPrice: number;
  newPlanName: string;
  newPlanPrice: number;
  validationErrors: string[];
  billingAnchorDay: number;
  showPreviousPlan: boolean;
  showNextPlan: boolean;
  onPeriodStartChange: (date: Date) => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onPlanNameChange: (name: string) => void;
  onPlanPriceChange: (price: number) => void;
  onNewPlanNameChange: (name: string) => void;
  onNewPlanPriceChange: (price: number) => void;
  onBillingAnchorDayChange: (day: number) => void;
  onShowPreviousPlanChange: (show: boolean) => void;
  onShowNextPlanChange: (show: boolean) => void;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ProrationForm({
  periodStart,
  billingCycle,
  planName,
  planPrice,
  newPlanName,
  newPlanPrice,
  validationErrors,
  billingAnchorDay,
  showPreviousPlan,
  showNextPlan,
  onPeriodStartChange,
  onBillingCycleChange,
  onPlanNameChange,
  onPlanPriceChange,
  onNewPlanNameChange,
  onNewPlanPriceChange,
  onBillingAnchorDayChange,
  onShowPreviousPlanChange,
  onShowNextPlanChange,
}: ProrationFormProps) {
  const handleRemovePreviousPlan = () => {
    onShowPreviousPlanChange(false);
  };

  const handleRemoveNextPlan = () => {
    onShowNextPlanChange(false);
  };

  const handleAddPreviousPlan = () => {
    onShowPreviousPlanChange(true);
  };

  const handleAddNextPlan = () => {
    onShowNextPlanChange(true);
  };

  return (
    <div className="space-y-4">
      {/* Billing Configuration */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Period</h3>
        <div className="grid grid-cols-3 gap-4">
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
              label="Period Start"
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
        </div>
      </div>

      {/* Plan Sections */}
      <div className="grid grid-cols-2 gap-4">
        {/* Previous Plan */}
        {showPreviousPlan ? (
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-amber-800">Previous Plan</h4>
              <button
                onClick={handleRemovePreviousPlan}
                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                title="Remove previous plan"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-amber-700 block mb-2">Name</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => onPlanNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                  placeholder="e.g., Basic"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-amber-700 block mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600">$</span>
                  <input
                    type="number"
                    value={planPrice}
                    onChange={(e) => onPlanPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddPreviousPlan}
            className="bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-colors flex flex-col items-center justify-center gap-2 min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">No Previous Plan</span>
            <span className="text-xs text-gray-400">Click to add</span>
          </button>
        )}

        {/* Next Plan */}
        {showNextPlan ? (
          <div className="bg-green-50 rounded-xl p-5 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-green-800">Next Plan</h4>
              <button
                onClick={handleRemoveNextPlan}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                title="Remove next plan"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-green-700 block mb-2">Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => onNewPlanNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                  placeholder="e.g., Pro"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green-700 block mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">$</span>
                  <input
                    type="number"
                    value={newPlanPrice}
                    onChange={(e) => onNewPlanPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddNextPlan}
            className="bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-2 min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-gray-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">No Next Plan</span>
            <span className="text-xs text-gray-400">Click to add</span>
          </button>
        )}
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
