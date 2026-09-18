import re

content = ""
with open('src/components/workshop/WorkshopCaseDetail.tsx', 'r') as f:
    content = f.read()

# Add states
state_addition = """  // --- Store Out Verification State ---
  const [verifyingOut, setVerifyingOut] = useState(false);"""

new_states = """  // --- Dispatch & Out State ---
  const [outgoingChecklist, setOutgoingChecklist] = useState<WorkshopChecklistItem[]>(workshopCase.outgoingChecklist.length > 0 ? workshopCase.outgoingChecklist : workshopCase.incomingChecklist);
  const [dispatchRemarks, setDispatchRemarks] = useState('');
  const [finalResult, setFinalResult] = useState('Repair Completed');
  
  const [verifyingOut, setVerifyingOut] = useState(false);
  const [storeOutRemarks, setStoreOutRemarks] = useState('');"""

content = content.replace(state_addition, new_states)

# Add methods
methods_insertion_point = """  const updateInVerifyChecklist = (id: string, field: string, value: any) => {
    setInVerificationChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };"""

new_methods = """  const updateInVerifyChecklist = (id: string, field: string, value: any) => {
    setInVerificationChecklist(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateOutChecklist = (id: string, condition: any) => {
    setOutgoingChecklist(prev => prev.map(item => item.id === id ? { ...item, outgoingCondition: condition } : item));
  };

  const handleMarkReady = async () => {
    setVerifyingOut(true);
    try {
      const auditEntry = {
        id: generateId(),
        uid: currentUser.userId,
        userName: currentUser.fullName,
        action: 'READY_FOR_DISPATCH',
        details: 'Engineer marked machine ready for dispatch.',
        timestamp: Date.now()
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'Awaiting Out Verification',
        outgoingChecklist,
        readyForDispatchAt: Date.now(),
        takenByUid: currentUser.userId,
        takenByName: currentUser.fullName,
        dispatchRemarks: dispatchRemarks.trim(),
        finalResult,
        auditLog: arrayUnion(auditEntry)
      });
    } catch (e) {
      console.error(e);
      alert('Failed to mark ready');
    }
    setVerifyingOut(false);
  };

  const handleStoreVerifyOut = async () => {
    // Check missing items validation
    const hasMissingWarning = outgoingChecklist.some(item => {
       const inCondition = item.storeVerifiedCondition || item.condition;
       const outCondition = item.outgoingCondition || item.storeVerifiedCondition || item.condition;
       return inCondition === 'OK / Present' && outCondition === 'Missing';
    });
    
    if (hasMissingWarning && !storeOutRemarks.trim()) {
      alert('You must provide Store Remarks explaining why previously present items are now missing at dispatch.');
      return;
    }

    setVerifyingOut(true);
    try {
      const auditEntry = {
        id: generateId(),
        uid: currentUser.userId,
        userName: currentUser.fullName,
        action: 'STORE_OUT_VERIFIED',
        details: 'Store verified outgoing machine condition and dispatched.',
        timestamp: Date.now()
      };
      
      await updateDoc(doc(db, 'workshopCases', workshopCase.id), {
        status: 'Returned to Customer',
        storeOutApprovedBy: currentUser.userId,
        storeOutApprovedByName: currentUser.fullName,
        storeOutApprovedAt: Date.now(),
        storeOutRemarks: storeOutRemarks.trim(),
        closedAt: Date.now(),
        auditLog: arrayUnion(auditEntry)
      });
    } catch (e) {
      console.error(e);
      alert('Failed to verify out');
    }
    setVerifyingOut(false);
  };"""

content = content.replace(methods_insertion_point, new_methods)


# Replace Dispatch Tab View
dispatch_tab = """      {/* TAB: DISPATCH */}
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

new_dispatch_tab = """      {/* TAB: DISPATCH */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center">
              <Truck className="w-4 h-4 mr-2 text-orange-500" /> Dispatch & Store Out Verification
            </h3>

            {/* Engineer Prepares for Dispatch */}
            {workshopCase.status !== 'Awaiting Out Verification' && workshopCase.status !== 'Returned to Customer' && isEngineer && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Prepare machine for dispatch. Review outgoing checklist.</p>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3 bg-purple-50/50">Incoming Verified</th>
                        <th className="p-3 bg-orange-50/50">Outgoing Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {outgoingChecklist.map((item, i) => {
                        const inCondition = item.storeVerifiedCondition || item.condition;
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-900">{item.name}</td>
                            <td className="p-3 bg-purple-50/30 font-bold text-gray-600">{inCondition}</td>
                            <td className="p-3 bg-orange-50/30">
                              <select
                                value={item.outgoingCondition || inCondition}
                                onChange={e => updateOutChecklist(item.id, e.target.value)}
                                className="w-full p-1 border rounded text-[10px] font-bold"
                              >
                                <option value="OK / Present">OK / Present</option>
                                <option value="Missing">Missing</option>
                                <option value="Damaged / Faulty">Damaged / Faulty</option>
                                <option value="N/A">N/A</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Final Result</label>
                    <select
                      value={finalResult}
                      onChange={e => setFinalResult(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 font-medium"
                    >
                      <option value="Repair Completed">Repair Completed</option>
                      <option value="Tested OK">Tested OK</option>
                      <option value="Partially Repaired">Partially Repaired</option>
                      <option value="Returned Unrepaired">Returned Unrepaired</option>
                      <option value="Customer Approval Required">Customer Approval Required</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Dispatch Remarks</label>
                    <input 
                      type="text" 
                      value={dispatchRemarks}
                      onChange={e => setDispatchRemarks(e.target.value)}
                      placeholder="e.g. Taking to customer site..."
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleMarkReady}
                    disabled={verifyingOut}
                    className="px-6 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {verifyingOut ? 'Processing...' : 'Mark Ready for Dispatch'}
                  </button>
                </div>
              </div>
            )}

            {/* Store Out Verification */}
            {(workshopCase.status === 'Awaiting Out Verification' || workshopCase.status === 'Returned to Customer') && (
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
                  <h4 className="font-bold text-orange-900 text-sm mb-2">Final Dispatch Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-orange-800">
                    <p><strong>Taken By:</strong> {workshopCase.takenByName}</p>
                    <p><strong>Result:</strong> {workshopCase.finalResult}</p>
                    <p className="col-span-2"><strong>Remarks:</strong> {workshopCase.dispatchRemarks || 'None'}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3 bg-purple-50/50">Incoming Verified</th>
                        <th className="p-3 bg-orange-50/50">Outgoing Condition</th>
                        <th className="p-3 bg-red-50/50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workshopCase.outgoingChecklist.map((item, i) => {
                        const inCondition = item.storeVerifiedCondition || item.condition;
                        const outCondition = item.outgoingCondition || inCondition;
                        const isMissingNow = inCondition === 'OK / Present' && outCondition === 'Missing';
                        const isImproved = inCondition !== 'OK / Present' && outCondition === 'OK / Present';
                        
                        return (
                          <tr key={i} className={`hover:bg-gray-50/50 ${isMissingNow ? 'bg-red-50/50' : ''}`}>
                            <td className="p-3 font-medium text-gray-900">{item.name}</td>
                            <td className="p-3 font-bold text-gray-600">{inCondition}</td>
                            <td className="p-3 font-bold text-gray-800">{outCondition}</td>
                            <td className="p-3">
                              {isMissingNow && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">Warning: Missing</span>}
                              {isImproved && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase">Replaced/Fixed</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {workshopCase.status === 'Awaiting Out Verification' && isStore && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <label className="block text-xs font-bold text-orange-900 mb-1">Store Dispatch Remarks (Mandatory if missing warnings exist)</label>
                    <input 
                      type="text" 
                      value={storeOutRemarks}
                      onChange={e => setStoreOutRemarks(e.target.value)}
                      placeholder="Any observations on dispatch..."
                      className="w-full p-2 text-sm border border-orange-200 rounded bg-white mb-3"
                    />
                    <button 
                      onClick={handleStoreVerifyOut}
                      disabled={verifyingOut}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded shadow-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      {verifyingOut ? 'Verifying...' : 'Approve Machine Out'}
                    </button>
                  </div>
                )}
                
                {workshopCase.status === 'Returned to Customer' && (
                  <div className="mt-3 text-[10px] text-gray-500 font-bold uppercase p-3 bg-green-50 rounded border border-green-100">
                    Dispatched / Out Verified By: {workshopCase.storeOutApprovedByName} on {new Date(workshopCase.storeOutApprovedAt!).toLocaleString()}
                    {workshopCase.storeOutRemarks && <p className="text-green-700 mt-1">Remarks: {workshopCase.storeOutRemarks}</p>}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}"""

content = content.replace(dispatch_tab, new_dispatch_tab)

with open('src/components/workshop/WorkshopCaseDetail.tsx', 'w') as f:
    f.write(content)
print("Updated successfully")
