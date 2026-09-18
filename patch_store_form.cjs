const fs = require('fs');
const storePath = './src/components/StoreInventory.tsx';
let code = fs.readFileSync(storePath, 'utf8');

const newFormHtml = `
            <form onSubmit={handleIssuePart} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Issue For / Destination Type <span className="text-red-500">*</span></label>
                <select
                  value={issueFor}
                  onChange={e => {
                    setIssueFor(e.target.value as any);
                    if (e.target.value === 'CUSTOMER') setIssuePurpose('Customer Replacement');
                    if (e.target.value === 'ENGINEER_BAG') setIssuePurpose('Engineer Bag Stock');
                    if (e.target.value === 'WORKSHOP') setIssuePurpose('Workshop/Other');
                  }}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                >
                  <option value="ENGINEER_BAG">Engineer Bag Stock (Van Stock)</option>
                  <option value="CUSTOMER">Customer Site</option>
                  <option value="WORKSHOP">Workshop</option>
                </select>
              </div>

              {issueFor === 'CUSTOMER' && (
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Customer <span className="text-red-500">*</span></label>
                    <select
                      value={issueClientId}
                      onChange={e => setIssueClientId(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Select Customer --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Machine <span className="text-red-500">*</span></label>
                    <select
                      value={issueMachineId}
                      onChange={e => setIssueMachineId(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Select Machine --</option>
                      {machines.filter(m => m.customerId === issueClientId).map(m => (
                        <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.serialNumber})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {issueFor === 'WORKSHOP' && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="block font-bold text-gray-600 mb-1">Workshop Case <span className="text-red-500">*</span></label>
                  <select
                    value={issueWorkshopCaseId}
                    onChange={e => setIssueWorkshopCaseId(e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">-- Select Active Workshop Case --</option>
                    {workshopCases.map(wk => (
                      <option key={wk.id} value={wk.id}>
                        {wk.caseNumber} - {wk.customerName} ({wk.brand} {wk.model} - {wk.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-600 mb-1">Engineer / Issued To <span className="text-red-500">*</span></label>
                <select
                  value={issueEngineerId}
                  onChange={e => setIssueEngineerId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                >
                  {engineers.map(eng => (
                    <option key={eng.userId} value={eng.userId}>
                      {eng.fullName} ({eng.userId})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-bold text-gray-600 mb-1">Select Part from Store <span className="text-red-500">*</span></label>
                <select
                  value={issuePartId}
                  onChange={e => setIssuePartId(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm font-mono"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {inventory.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.partNumber} - {inv.description} (Store Qty: {inv.quantity}, {inv.condition})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={issueQuantity}
                    onChange={e => setIssueQuantity(Number(e.target.value))}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Condition <span className="text-red-500">*</span></label>
                  <select
                    value={issueCondition}
                    onChange={e => setIssueCondition(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Issuance Purpose</label>
                <select
                  value={issuePurpose}
                  onChange={e => setIssuePurpose(e.target.value as any)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold"
                >
                  <option value="Engineer Bag Stock">Engineer Bag Stock (Van Stock)</option>
                  <option value="Customer Replacement">Customer Site Replacement</option>
                  <option value="Testing">Testing / Fault Diagnosis</option>
                  <option value="Backup">Backup Unit for Customer Site</option>
                  <option value="Workshop/Other">Workshop Repair Machine</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  value={issueRemarks}
                  onChange={e => setIssueRemarks(e.target.value)}
                  placeholder="Special instructions or job reference..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIssuePartModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E61C24] hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Issue Part Now
                </button>
              </div>
            </form>
`;

code = code.replace(/<form onSubmit=\{handleIssuePart\} className="space-y-4 text-xs">[\s\S]*?<\/form>/, newFormHtml);
fs.writeFileSync(storePath, code);
console.log('Patched StoreInventory.tsx Form successfully');
