import { useProration } from './hooks/useProration';
import { ProrationForm } from './components/ProrationForm';
import { Timeline } from './components/Timeline';
import { InvoicePreview } from './components/InvoicePreview';

function App() {
  const {
    periodStart,
    billingCycle,
    plan,
    changeDate,
    newPlan,
    scenario,
    showPreviousPlan,
    showNextPlan,
    serviceEndResult,
    serviceStartResult,
    planChangeResult,
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
    setShowPreviousPlan,
    setShowNextPlan,
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
            scenario={scenario}
            showPreviousPlan={showPreviousPlan}
            showNextPlan={showNextPlan}
            onPeriodStartChange={updatePeriodStart}
            onBillingCycleChange={updateBillingCycle}
            onPlanNameChange={updatePlanName}
            onPlanPriceChange={updatePlanPrice}
            onChangeDateChange={updateChangeDate}
            onNewPlanNameChange={updateNewPlanName}
            onNewPlanPriceChange={updateNewPlanPrice}
            onBillingAnchorDayChange={updateBillingAnchorDay}
            onShowPreviousPlanChange={setShowPreviousPlan}
            onShowNextPlanChange={setShowNextPlan}
          />
        </div>

        {/* Timeline */}
        <div className="mb-8">
          <Timeline
            scenario={scenario}
            serviceEndResult={serviceEndResult}
            serviceStartResult={serviceStartResult}
            planChangeResult={planChangeResult}
            oldPlan={plan}
            newPlan={newPlan}
          />
        </div>

        {/* Invoice */}
        <div className="mb-8">
          <InvoicePreview invoice={invoice} />
        </div>

        {/* Calculation Details */}
        {(serviceEndResult || serviceStartResult || planChangeResult) && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Breakdown</h3>

            {/* Service End */}
            {serviceEndResult && scenario === 'serviceEnd' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Periods Affected</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {serviceEndResult.totalPeriodsAffected}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    billing period{serviceEndResult.totalPeriodsAffected !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Plan Price</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${plan.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    per billing period
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Total Credit</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${serviceEndResult.totalCredit.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    for unused days
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Credit Due</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${serviceEndResult.totalCredit.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    total refund
                  </div>
                </div>
              </div>
            )}

            {/* Service Start */}
            {serviceStartResult && scenario === 'serviceStart' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Periods Affected</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {serviceStartResult.totalPeriodsAffected}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    billing period{serviceStartResult.totalPeriodsAffected !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Plan Price</div>
                  <div className="text-xl font-semibold text-blue-700">
                    ${newPlan.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    per billing period
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Total Charges</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${serviceStartResult.totalCharge.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    prorated charges
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Amount Due</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${serviceStartResult.totalCharge.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    total charge
                  </div>
                </div>
              </div>
            )}

            {/* Plan Change */}
            {planChangeResult && scenario === 'planChange' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Periods Affected</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {planChangeResult.totalPeriodsAffected}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    billing period{planChangeResult.totalPeriodsAffected !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Total Credits</div>
                  <div className="text-xl font-semibold text-green-700">
                    ${planChangeResult.totalCredits.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-400 mt-1">
                    from {plan.name}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="text-sm text-amber-600 mb-1">Total Charges</div>
                  <div className="text-xl font-semibold text-amber-700">
                    ${planChangeResult.totalCharges.toFixed(2)}
                  </div>
                  <div className="text-xs text-amber-400 mt-1">
                    for {newPlan.name}
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${planChangeResult.netAdjustment >= 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <div className={`text-sm mb-1 ${planChangeResult.netAdjustment >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {planChangeResult.netAdjustment >= 0 ? 'Net Amount Due' : 'Net Refund Due'}
                  </div>
                  <div className={`text-xl font-semibold ${planChangeResult.netAdjustment >= 0 ? 'text-amber-700' : 'text-green-700'}`}>
                    ${Math.abs(planChangeResult.netAdjustment).toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 ${planChangeResult.netAdjustment >= 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {planChangeResult.isUpgrade ? 'upgrade charge' : 'downgrade credit'}
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
