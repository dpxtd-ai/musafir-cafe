import React, { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import { Customer, OrderType } from '../types/cafe';

interface CustomerFormStepProps {
  orderType: OrderType;
  onBack: () => void;
  onSubmit: (customer: Customer) => void;
  initialData?: Customer | null;
}

export const CustomerFormStep: React.FC<CustomerFormStepProps> = ({
  orderType,
  onBack,
  onSubmit,
  initialData
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [mobile, setMobile] = useState(initialData?.mobile || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [tableNumber, setTableNumber] = useState(initialData?.tableNumber || '');

  const isHomeDelivery = orderType === 'Home Delivery';

  // Validation strictly adhering to original requirements
  const isMobileValid = /^[0-9]{10}$/.test(mobile.trim());
  const isNameValid = name.trim().length > 0;
  const isAddressValid = address.trim().length > 0;
  const isTableValid = tableNumber.trim().length > 0;

  const isValid = isHomeDelivery
    ? isNameValid && isMobileValid && isAddressValid
    : isNameValid && isTableValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const customerData: Customer = {
      orderType,
      name: name.trim()
    };

    if (isHomeDelivery) {
      customerData.mobile = mobile.trim();
      customerData.address = address.trim();
    } else {
      customerData.tableNumber = tableNumber.trim();
    }

    onSubmit(customerData);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Order Type</span>
        </button>

        <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 font-medium">
          Step 2 of 3 · Customer Details
        </span>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{isHomeDelivery ? '🏠 Home Delivery' : '🍽️ Dine-In'}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-stone-900">
            {isHomeDelivery ? 'Home Delivery Details' : 'Dine-In Details'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {isHomeDelivery
              ? 'Please provide your contact information and delivery address for dispatch.'
              : 'Please enter your name and table number so our servers can bring your order.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-semibold text-stone-700">
              Full Name <span className="text-amber-700">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun Sharma"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all bg-stone-50/50 hover:bg-white focus:bg-white"
                required
              />
            </div>
          </div>

          {isHomeDelivery ? (
            <>
              {/* 10 Digit Mobile */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="mobile" className="block text-xs font-semibold text-stone-700">
                    10 Digit Mobile Number <span className="text-amber-700">*</span>
                  </label>
                  {mobile.length > 0 && (
                    <span className="text-[11px] font-medium text-stone-400">
                      {mobile.length}/10
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="mobile"
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      // Only allow digits
                      const val = e.target.value.replace(/\D/g, '');
                      setMobile(val);
                    }}
                    placeholder="10 Digit Mobile Number"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none transition-all ${
                      mobile.length === 10 && isMobileValid
                        ? 'border-emerald-500 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500/20'
                        : mobile.length > 0 && !isMobileValid
                        ? 'border-amber-500 bg-amber-50/20 focus:ring-2 focus:ring-amber-500/20'
                        : 'border-stone-200 bg-stone-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700'
                    }`}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    {mobile.length === 10 && isMobileValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : mobile.length > 0 ? (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    ) : null}
                  </div>
                </div>
                {mobile.length > 0 && !isMobileValid && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    Please enter a valid 10-digit number.
                  </p>
                )}
              </div>

              {/* Full Address */}
              <div className="space-y-1.5">
                <label htmlFor="address" className="block text-xs font-semibold text-stone-700">
                  Full Address <span className="text-amber-700">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 text-stone-400 pointer-events-none">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    id="address"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No, Street, Landmark, Area, City"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all bg-stone-50/50 hover:bg-white focus:bg-white resize-none"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            /* Table Number for Dine-In */
            <div className="space-y-1.5">
              <label htmlFor="table" className="block text-xs font-semibold text-stone-700">
                Table Number <span className="text-amber-700">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="table"
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table 4 or T-12"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all bg-stone-50/50 hover:bg-white focus:bg-white"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Check the table tent card or wooden stand on your cafe table.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="submitBtn"
              type="submit"
              disabled={!isValid}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isValid
                  ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-sm hover:shadow active:scale-[0.99]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Submit & View Menu</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
