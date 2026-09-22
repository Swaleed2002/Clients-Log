import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Building, MapPin, User, Phone, CheckCircle2, AlertCircle, Plus, Search, X } from 'lucide-react';
import { useCustomers, CustomerOption } from '../hooks/useCustomers';

interface CustomerAutocompleteProps {
  customerId?: string;
  customerName: string;
  location: string;
  contactPerson?: string;
  contactNumber?: string;
  isUnregisteredCustomer?: boolean;
  onCustomerChange: (data: {
    customerId?: string;
    customerName: string;
    location?: string;
    contactPerson?: string;
    contactNumber?: string;
    isUnregisteredCustomer: boolean;
  }) => void;
  onLocationChange: (loc: string) => void;
  onContactPersonChange?: (val: string) => void;
  onContactNumberChange?: (val: string) => void;
  disabled?: boolean;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  customerId,
  customerName,
  location,
  contactPerson = '',
  contactNumber = '',
  isUnregisteredCustomer = false,
  onCustomerChange,
  onLocationChange,
  onContactPersonChange,
  onContactNumberChange,
  disabled = false
}) => {
  const { clients, isLoaded, searchCustomers } = useCustomers();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(customerName || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search query if external customerName changes
  useEffect(() => {
    setSearchQuery(customerName || '');
  }, [customerName]);

  // Close dropdown on outside click or tap
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Filter matching existing customers
  const matchingCustomers = useMemo(() => {
    return searchCustomers(searchQuery);
  }, [searchCustomers, searchQuery]);

  const handleSelectExisting = (customer: CustomerOption) => {
    setSearchQuery(customer.name);
    setIsOpen(false);
    onCustomerChange({
      customerId: customer.id,
      customerName: customer.name,
      location: customer.address || location || '',
      contactPerson: customer.contactPerson || contactPerson || '',
      contactNumber: customer.contactNumber || contactNumber || '',
      isUnregisteredCustomer: false
    });
  };

  const handleSelectNewCustomer = () => {
    const nameToUse = searchQuery.trim() || customerName.trim();
    setIsOpen(false);
    onCustomerChange({
      customerId: undefined,
      customerName: nameToUse,
      location: location || '',
      contactPerson: contactPerson || '',
      contactNumber: contactNumber || '',
      isUnregisteredCustomer: true
    });
  };

  const handleClearSelection = () => {
    setSearchQuery('');
    onCustomerChange({
      customerId: undefined,
      customerName: '',
      location: '',
      contactPerson: '',
      contactNumber: '',
      isUnregisteredCustomer: false
    });
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100" ref={containerRef}>
      {/* Customer Name Field with Autocomplete */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 mr-1 text-slate-500" /> Customer / Company Name *
          </label>
          {customerId && !isUnregisteredCustomer && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked Existing (ID: {customerId})
            </span>
          )}
          {isUnregisteredCustomer && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" /> New / Unregistered Visit
            </span>
          )}
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setIsOpen(true);
              // Update customer name while keeping custom edits responsive
              onCustomerChange({
                customerId: isUnregisteredCustomer ? undefined : customerId,
                customerName: val,
                location,
                contactPerson,
                contactNumber,
                isUnregisteredCustomer: isUnregisteredCustomer || (!customerId && Boolean(val.trim()))
              });
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            placeholder="Type customer name (e.g. DU, Dubai Bottling, ABC...)"
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-slate-500 focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />

          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSelection}
              aria-label="Clear customer"
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-72 flex flex-col">
            {/* Header info */}
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{isLoaded ? `Customers Database (${clients.length})` : 'Loading customers...'}</span>
              <span className="text-[10px] text-slate-400">Tap to select</span>
            </div>

            {/* List items */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {/* Option to create as New Customer */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectNewCustomer();
                }}
                className="w-full text-left px-3.5 py-3 hover:bg-amber-50 active:bg-amber-100 bg-amber-50/50 flex items-center gap-2.5 transition-colors border-b border-amber-100 group"
              >
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-200">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>+ New Customer</span>
                    {searchQuery.trim() && (
                      <span className="font-normal text-amber-800 truncate">
                        ("{searchQuery.trim()}")
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Urgent visit / not yet in database (Admin will review later)
                  </p>
                </div>
              </button>

              {/* Matching existing customers */}
              {matchingCustomers.length > 0 ? (
                matchingCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectExisting(cust);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-start justify-between gap-2 min-h-[44px] ${
                      customerId === cust.id ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {cust.name}
                        </span>
                        {customerId === cust.id && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      {cust.address && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      )}
                      {(cust.contactPerson || cust.contactNumber) && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          {cust.contactPerson && (
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-2.5 h-2.5" /> {cust.contactPerson}
                            </span>
                          )}
                          {cust.contactNumber && (
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="w-2.5 h-2.5" /> {cust.contactNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0 self-center">
                      {cust.id}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs font-semibold text-slate-700">
                    No existing customers matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-2">
                    Click "+ New Customer" above to enter details for this urgent visit without delay.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Field */}
      <div>
        <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> Location / Site Address *
        </label>
        <input
          type="text"
          disabled={disabled}
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="e.g. JAFZA South, Warehouse 4"
          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-slate-500 focus:outline-none transition-colors"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Visit site or facility address for this log. Editable for both existing and new customers.
        </p>
      </div>

      {/* Optional Contact Person & Contact Number Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <User className="w-3.5 h-3.5 mr-1 text-slate-500" /> Contact Person (Optional)
          </label>
          <input
            type="text"
            disabled={disabled}
            value={contactPerson}
            onChange={(e) => onContactPersonChange?.(e.target.value)}
            placeholder="e.g. John Doe / Maintenance Mgr"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <Phone className="w-3.5 h-3.5 mr-1 text-slate-500" /> Contact Phone (Optional)
          </label>
          <input
            type="text"
            disabled={disabled}
            value={contactNumber}
            onChange={(e) => onContactNumberChange?.(e.target.value)}
            placeholder="e.g. +971 50 123 4567"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 focus:border-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
