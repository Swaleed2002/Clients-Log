import React from 'react';
import { WorkEntry, UserProfile } from '../types';
import { calculateEntryTotals, formatDuration } from '../utils';
import { FileSpreadsheet, Download, Clock, MapPin, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { format, isSameDay, isSameWeek, parseISO } from 'date-fns';

interface DashboardProps {
  entries: WorkEntry[];
  onAddEntry: () => void;
  onViewReport: () => void;
  onExport: () => void;
  profile: UserProfile;
}

export function Dashboard({ entries, onAddEntry, onViewReport, onExport, profile }: DashboardProps) {
  const today = new Date();
  
  let todayJobMinutes = 0;
  let todayTravelMinutes = 0;
  
  let weekJobMinutes = 0;
  let weekTravelMinutes = 0;
  let weekEntriesCount = 0;

  // Recent entries for the activity feed
  const recentEntries = [...entries]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    const totals = calculateEntryTotals(entry);
    
    if (isSameDay(entryDate, today)) {
      todayJobMinutes += totals.job.totalMinutes;
      todayTravelMinutes += totals.travel.totalMinutes;
    }
    
    if (isSameWeek(entryDate, today, { weekStartsOn: 1 })) {
      weekJobMinutes += totals.job.totalMinutes;
      weekTravelMinutes += totals.travel.totalMinutes;
      weekEntriesCount++;
    }
  });

  const formatMins = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return formatDuration({ hours: h, minutes: m, totalMinutes: totalMins });
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      
      {/* Greeting Header */}
      <div className="pt-2 pb-4 border-b border-gray-100">
        <p className="text-gray-500 font-medium text-sm">{format(today, 'EEEE, dd MMMM')}</p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Hello, {profile.fullName.split(' ')[0]}</h1>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Clock className="w-12 h-12 text-[#E61C24]" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 relative z-10">Today's Job Time</p>
          <p className="text-xl font-black text-gray-900 relative z-10">{formatMins(todayJobMinutes)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <MapPin className="w-12 h-12 text-[#E61C24]" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 relative z-10">Today's Travel</p>
          <p className="text-xl font-black text-gray-900 relative z-10">{formatMins(todayTravelMinutes)}</p>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-[#1A1A1A] p-5 rounded-2xl shadow-md text-white mt-4 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#E61C24] opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
         <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center mb-4">
           <CalendarIcon className="w-4 h-4 mr-2 text-[#E61C24]" />
           This Week Summary
         </h3>
         <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-700">
           <div>
             <p className="text-lg font-black text-white">{formatMins(weekJobMinutes)}</p>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Job Time</p>
           </div>
           <div>
             <p className="text-lg font-black text-white">{formatMins(weekTravelMinutes)}</p>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Travel Time</p>
           </div>
           <div>
             <p className="text-lg font-black text-white">{weekEntriesCount}</p>
             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Entries</p>
           </div>
         </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={onViewReport}
          className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-xs uppercase tracking-wide">View Report</span>
        </button>
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <Download className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-xs uppercase tracking-wide">Export Excel</span>
        </button>
      </div>

      {/* Recent Activity */}
      {recentEntries.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Recent Activity</h3>
            <button onClick={onViewReport} className="text-xs font-bold text-[#E61C24] uppercase tracking-wider flex items-center">
              See All <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div key={entry.id} className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{entry.customerName || 'No Customer'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-gray-500">{entry.workType}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-xs text-gray-500">{format(parseISO(entry.date), 'MMM dd')}</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="h-4"></div>
    </div>
  );
}
