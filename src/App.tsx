import { useProration } from './hooks/useProration';
import { ProrationForm } from './components/ProrationForm';
import { TimelineBar } from './components/TimelineBar';
import { InvoicePreview } from './components/InvoicePreview';

function App() {
  const {
    periodStart,
    periodEnd,
    billingCycle,
    plan,
    changeDate,
    newPlan,
    scenario,
    isMultiPeriod,
    serviceEndResult,
    serviceStartResult,
    planChangeResult,
    multiPeriodResult,
    invoice,
    validationErrors,
    billingAnchorDay,
    updateBillingCycle,
    updatePeriodStart,
    updateChangeDate,
    updatePlanPrice,
    updateNewPlanPrice,
    updatePlanName,
    updateNewPlanName,
    updateBillingAnchorDay,
  } = useProration();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ProrateMate</h1>
              <p className="text-sm text-gray-500">Billing proration calculator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Billing Configuration */}
        <div className="mb-8">
          <ProrationForm
            periodStart={periodStart}
            billingCycle={billingCycle}
            planName={plan.name}
            planPrice={plan.price}
            changeDate={changeDate}
            newPlanName={newPlan.name}
            newPlanPrice={newPlan.price}
            validationErrors={validationErrors}
            billingAnchorDay={billingAnchorDay}
            isMultiPeriod={isMultiPeriod}
            scenario={scenario}
            onPeriodStartChange={updatePeriodStart}
            onBillingCycleChange={updateBillingCycle}
            onPlanNameChange={updatePlanName}
            onPlanPriceChange={updatePlanPrice}
            onChangeDateChange={updateChangeDate}
            onNewPlanNameChange={updateNewPlanName}
            onNewPlanPriceChange={updateNewPlanPrice}
            onBillingAnchorDayChange={updateBillingAnchorDay}
          />
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <TimelineBar
            periodStart={periodStart}
            periodEnd={periodEnd}
            changeDate={changeDate}
            planChangeResult={planChangeResult}
            multiPeriodResult={multiPeriodResult}
            serviceEndResult={serviceEndResult}
            serviceStartResult={serviceStartResult}
            plan={plan}
            newPlan={newPlan}
            isMultiPeriod={isMultiPeriod}
            scenario={scenario}
          />
        </div>

        {/* Invoice */}
        <div className="mb-8">
          <InvoicePreview invoice={invoice} />
        </div>

        {/* Calculation Details */}
        {(serviceEndResult || serviceStartResult || planChangeResult || multiPeriodResult) && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Breakdown</h3>

            {/* Service End: Cancellation credit */}
            {serviceEndResult && scenario === 'serviceEnd' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Service Usage</div>
                  <div className="text-xl font-semibold text-amber-700">
                    {serviceEndResult.daysUsed} days
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    of {serviceEndResult.totalDaysInPeriod} day period
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Unused Days</div>
                  <div className="text-xl font-semibold text-gray-700">
                    {serviceEndResult.daysRemaining} days
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    after cancellation
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Plan Price</div>
                  <div className="text-xl font-semibold text-blue-700">
                    ${plan.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    per billing period
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Credit Due</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${serviceEndResult.credit.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    refund for unused days
                  </div>
                </div>
              </div>
            )}

            {/* Service Start: Prorated charge */}
            {serviceStartResult && scenario === 'serviceStart' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Inactive Days</div>
                  <div className="text-xl font-semibold text-gray-700">
                    {serviceStartResult.daysInactive} days
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    before service start
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Active Days</div>
                  <div className="text-xl font-semibold text-green-700">
                    {serviceStartResult.daysActive} days
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    of {serviceStartResult.totalDaysInPeriod} day period
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Full Plan Price</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${newPlan.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    per billing period
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Prorated Charge</div>
                  <div className="text-xl font-semibold text-blue-700">
                    ${serviceStartResult.charge.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    {serviceStartResult.percentageActive.toFixed(0)}% of full price
                  </div>
                </div>
              </div>
            )}

            {/* Plan Change: Single period */}
            {planChangeResult && !isMultiPeriod && scenario === 'planChange' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Old Plan Usage</div>
                  <div className="text-xl font-semibold text-amber-700">
                    {planChangeResult.oldPlanDaysUsed} days
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    at ${plan.price}/period
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Credit Applied</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${planChangeResult.oldPlanCredit.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    unused portion refunded
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">New Plan Charge</div>
                  <div className="text-xl font-semibold text-blue-700">
                    ${planChangeResult.newPlanCharge.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    {planChangeResult.newPlanDaysRemaining} days remaining
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${planChangeResult.netAmount >= 0 ? 'bg-gray-50' : 'bg-green-50'}`}>
                  <div className={`text-sm mb-1 ${planChangeResult.netAmount >= 0 ? 'text-gray-600' : 'text-green-600'}`}>
                    {planChangeResult.netAmount >= 0 ? 'Net Amount Due' : 'Net Credit'}
                  </div>
                  <div className={`text-xl font-semibold ${planChangeResult.netAmount >= 0 ? 'text-gray-700' : 'text-green-700'}`}>
                    ${Math.abs(planChangeResult.netAmount).toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 ${planChangeResult.netAmount >= 0 ? 'text-gray-400' : 'text-green-400'}`}>
                    {planChangeResult.isUpgrade ? 'upgrade charge' : 'downgrade credit'}
                  </div>
                </div>
              </div>
            )}

            {/* Plan Change: Multi-period */}
            {multiPeriodResult && isMultiPeriod && scenario === 'planChange' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Periods Affected</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {multiPeriodResult.totalPeriodsAffected}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    billing periods
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Total Credits</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${multiPeriodResult.totalCredits.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    from {plan.name}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Total Charges</div>
                  <div className="text-xl font-semibold text-blue-700">
                    ${multiPeriodResult.totalCharges.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    for {newPlan.name}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${multiPeriodResult.netAdjustment >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className={`text-sm mb-1 ${multiPeriodResult.netAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {multiPeriodResult.netAdjustment >= 0 ? 'Net Amount Due' : 'Net Refund Due'}
                  </div>
                  <div className={`text-xl font-semibold ${multiPeriodResult.netAdjustment >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${Math.abs(multiPeriodResult.netAdjustment).toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 ${multiPeriodResult.netAdjustment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {multiPeriodResult.isUpgrade ? 'retroactive upgrade' : 'retroactive downgrade'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            ProrateMate - A simply complicated proration calculator
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
