import React, { useState, useEffect } from 'react';
import { WorkEntry, WorkType } from '../types';
import { format } from 'date-fns';
import { cn, calculateDuration, formatDuration } from '../utils';
import { ArrowLeft, Save, MapPin, Building, Clock, Briefcase, FileText, CheckCircle2, PlayCircle, StopCircle, Pencil } from 'lucide-react';

interface WorkEntryFormProps {
  initialData?: WorkEntry;
  onSave: (entry: Omit<WorkEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => void;
  onCancel: () => void;
  uniqueCustomers: string[];
  uniqueLocations: string[];
}

const JOB_CATEGORIES = [
  'Troubleshooting',
  'Preventive Maintenance',
  'Repair',
  'Installation',
  'Testing',
  'Inspection',
  'Spare Parts',
  'Workshop Testing',
  'Assembly',
  'Other'
];

export function WorkEntryForm({ initialData, onSave, onCancel, uniqueCustomers, uniqueLocations }: WorkEntryFormProps) {
  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
  const [workType, setWorkType] = useState<WorkType>(initialData?.workType || 'Customer');
  const [deliveryType, setDeliveryType] = useState<'Delivery of Consumables' | 'Delivery of Parts' | ''>(initialData?.deliveryType || '');
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [location, setLocation] = useState(initialData?.location || '');
  
  const [travelStart, setTravelStart] = useState(initialData?.travelStart || (initialData as any)?.travelToStart || '');
  const [travelStop, setTravelStop] = useState(initialData?.travelStop || (initialData as any)?.travelToEnd || '');
  const [isEditingTravel, setIsEditingTravel] = useState(false);
  
  const [jobStart, setJobStart] = useState(initialData?.jobStart || '');
  const [jobStop, setJobStop] = useState(initialData?.jobStop || (initialData as any)?.jobEnd || '');
  const [isEditingJob, setIsEditingJob] = useState(false);
  
  const [jobCategory, setJobCategory] = useState(initialData?.jobCategory || '');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  useEffect(() => {
    if (workType === 'Workshop') {
      setCustomerName('Workshop');
      setLocation('Workshop');
      setTravelStart('');
      setTravelStop('');
    } else if (workType === 'Office') {
      setCustomerName('Office');
      setLocation('Office');
    } else if (!initialData && (customerName === 'Workshop' || customerName === 'Office')) {
      setCustomerName('');
      setLocation('');
    }
  }, [workType, initialData]);

  const getCurrentTimeHHmm = () => format(new Date(), 'HH:mm');

  const handleSave = () => {
    if (!date || !workType || !jobCategory) {
      alert('Please fill Date, Work Type, and Job Category');
      return;
    }
    if ((workType === 'Customer' || workType === 'Other' || workType === 'Delivery') && (!customerName || !location)) {
      alert('Please fill Customer/Recipient Name and Location');
      return;
    }
    if (workType === 'Delivery' && !deliveryType) {
      alert('Please select a Delivery Type');
      return;
    }

    onSave({
      date,
      workType,
      ...(workType === 'Delivery' ? { deliveryType: deliveryType as any } : {}),
      customerName,
      location,
      travelStart,
      travelStop,
      jobStart,
      jobStop,
      jobCategory,
      remarks
    });
    
    setShowSavedMsg(true);
    setTimeout(() => {
      onCancel();
    }, 800);
  };

  const handleChipClick = (cat: string) => {
    const current = jobCategory.trim();
    if (current && !current.includes(cat)) {
       setJobCategory(current + (current.endsWith(',') ? ' ' : ', ') + cat);
    } else if (!current) {
       setJobCategory(cat);
    }
  };

  const travelDur = calculateDuration(travelStart, travelStop);
  const jobDur = calculateDuration(jobStart, jobStop);

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={onCancel} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit Entry' : 'New Work Entry'}</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Work Type Selection */}
        <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(['Customer', 'Workshop', 'Office', 'Delivery', 'Other'] as WorkType[]).map((type) => (
              <button
                key={type}
                onClick={() => setWorkType(type)}
                className={cn(
                  "py-3 text-center rounded-lg font-bold transition-colors border-2 text-sm",
                  workType === type ? "bg-red-50 border-[#E61C24] text-red-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {workType === 'Delivery' && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Delivery Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(['Delivery of Consumables', 'Delivery of Parts'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDeliveryType(type)}
                    className={cn(
                      "py-3 text-center rounded-lg font-bold transition-colors border-2 text-sm",
                      deliveryType === type ? "bg-emerald-50 border-emerald-600 text-emerald-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(workType === 'Customer' || workType === 'Other' || workType === 'Delivery') && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <Building className="w-4 h-4 mr-1" /> Customer / Recipient Name *
                </label>
                <input 
                  type="text" 
                  list="customers-list"
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. ABC Packaging"
                />
                <datalist id="customers-list">
                  {uniqueCustomers.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  <MapPin className="w-4 h-4 mr-1" /> Location *
                </label>
                <input 
                  type="text" 
                  list="locations-list"
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. JAFZA"
                />
                <datalist id="locations-list">
                  {uniqueLocations.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>
            </div>
          )}
        </section>

        {/* Travel Section */}
        {workType !== 'Workshop' && (
          <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-600" /> Travel
              </h3>
              {travelStart && travelStop && (
                 <button onClick={() => setIsEditingTravel(!isEditingTravel)} className="text-gray-400 hover:text-red-600 p-1">
                   <Pencil className="w-4 h-4" />
                 </button>
              )}
            </div>

            {!travelStart ? (
              <button 
                onClick={() => setTravelStart(getCurrentTimeHHmm())}
                className="w-full py-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-2 border-emerald-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
              >
                <PlayCircle className="w-6 h-6 mr-2" /> START TRAVEL
              </button>
            ) : !travelStop ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 py-2 rounded-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="font-semibold text-sm">TRAVEL IN PROGRESS (Started {travelStart})</span>
                </div>
                <button 
                  onClick={() => setTravelStop(getCurrentTimeHHmm())}
                  className="w-full py-4 bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
                >
                  <StopCircle className="w-6 h-6 mr-2" /> STOP TRAVEL
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-gray-800">TRAVEL COMPLETED</p>
                <p className="text-sm text-gray-500 mt-1">{travelStart} &rarr; {travelStop}</p>
                <p className="font-bold text-red-600 mt-1">Duration: {formatDuration(travelDur)}</p>
              </div>
            )}

            {isEditingTravel && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input type="time" value={travelStart} onChange={e => setTravelStart(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input type="time" value={travelStop} onChange={e => setTravelStop(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Job Section */}
        <section className={cn("bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity", (workType !== 'Workshop' && !travelStop) ? "opacity-50 pointer-events-none" : "opacity-100")}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-purple-600" /> Job
            </h3>
            {jobStart && jobStop && (
               <button onClick={() => setIsEditingJob(!isEditingJob)} className="text-gray-400 hover:text-purple-600 p-1">
                 <Pencil className="w-4 h-4" />
               </button>
            )}
          </div>

          {!jobStart ? (
            <button 
              onClick={() => setJobStart(getCurrentTimeHHmm())}
              className="w-full py-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-2 border-emerald-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
            >
              <PlayCircle className="w-6 h-6 mr-2" /> START JOB
            </button>
          ) : !jobStop ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-purple-700 bg-purple-50 py-2 rounded-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <span className="font-semibold text-sm">JOB IN PROGRESS (Started {jobStart})</span>
              </div>
              <button 
                onClick={() => setJobStop(getCurrentTimeHHmm())}
                className="w-full py-4 bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
              >
                <StopCircle className="w-6 h-6 mr-2" /> STOP JOB
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">JOB COMPLETED</p>
              <p className="text-sm text-gray-500 mt-1">{jobStart} &rarr; {jobStop}</p>
              <p className="font-bold text-purple-600 mt-1">Duration: {formatDuration(jobDur)}</p>
            </div>
          )}

          {isEditingJob && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                <input type="time" value={jobStart} onChange={e => setJobStart(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                <input type="time" value={jobStop} onChange={e => setJobStop(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          )}
        </section>

        {/* Work Details Section */}
        <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Job Category / Work Carried Out *
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {JOB_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleChipClick(cat)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors active:bg-gray-300"
                >
                  {cat}
                </button>
              ))}
            </div>
            <textarea
              value={jobCategory}
              onChange={e => setJobCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
              placeholder="Describe work carried out..."
            />
          </div>
          <div>
            <label className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4 mr-1" /> Remarks / Notes
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
              placeholder="Optional notes..."
            />
          </div>
        </section>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
           {showSavedMsg && <span className="text-emerald-600 font-bold whitespace-nowrap animate-in fade-in">Entry Saved ✓</span>}
           <button
            onClick={handleSave}
            className="flex-1 bg-[#E61C24] text-white font-bold text-lg py-4 rounded-xl shadow-md hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center"
          >
            <Save className="w-5 h-5 mr-2" /> SAVE ENTRY
          </button>
        </div>
      </div>
    </div>
  );
}
