import re

content = ""
with open('src/components/workshop/WorkshopCaseDetail.tsx', 'r') as f:
    content = f.read()

dispatch_tab = """      {/* TAB: DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center">
              <Truck className="w-4 h-4 mr-2 text-orange-500" /> Dispatch Preparation
            </h3>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>
      )}"""

new_dispatch_tab = """      {/* TAB: DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide flex items-center">
              <Truck className="w-4 h-4 mr-2 text-orange-500" /> Dispatch & Store Out Verification
            </h3>
            <p className="text-sm text-gray-500 italic">This section handles marking the machine as ready, preparing the outgoing checklist, and Store Out approval. (Implementation pending next steps)</p>
          </div>
        </div>
      )}"""

if dispatch_tab in content:
    content = content.replace(dispatch_tab, new_dispatch_tab)
    with open('src/components/workshop/WorkshopCaseDetail.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Not found")
