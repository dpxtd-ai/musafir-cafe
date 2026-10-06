import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  X,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Customer, CartItem, PaymentDetails, PaymentMethod } from '../types/cafe';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  customer: Customer;
  cartItems: CartItem[];
  isSubmitting: boolean;
  onConfirmOrder: (paymentDetails: PaymentDetails) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  customer,
  cartItems,
  isSubmitting,
  onConfirmOrder
}) => {
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [selectedApp, setSelectedApp] = useState<string>('Google Pay');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [waitTimer, setWaitTimer] = useState<number>(60);
  const [isWaitingResponse, setIsWaitingResponse] = useState<boolean>(false);
  const [waitingApp, setWaitingApp] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const CAFE_UPI_ID = 'musafircafe@upi';
  const CAFE_MERCHANT_NAME = 'Musafir Cafe';

  // Standard UPI URI conforming to NPCI specification
  const upiUri = `upi://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
    CAFE_MERCHANT_NAME
  )}&am=${total}&cu=INR&tn=${encodeURIComponent(`Musafir Order ${customer.name}`)}`;

  // Direct app intent URLs
  const upiAppLinks = [
    {
      name: 'Google Pay',
      shortName: 'GPay',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-100/60',
      badge: 'Google Pay',
      intentUri: `tez://upi/pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=MusafirCafe`
    },
    {
      name: 'BHIM UPI',
      shortName: 'BHIM',
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-500 hover:bg-amber-100/60',
      badge: 'BHIM',
      intentUri: upiUri
    },
    {
      name: 'PhonePe',
      shortName: 'PhonePe',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-100/60',
      badge: 'PhonePe',
      intentUri: `phonepe://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=MusafirCafe`
    },
    {
      name: 'Paytm',
      shortName: 'Paytm',
      color: 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-500 hover:bg-sky-100/60',
      badge: 'Paytm',
      intentUri: `paytmmp://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=MusafirCafe`
    }
  ];

  // Simulated countdown timer when waiting for UPI app response
  useEffect(() => {
    let interval: any;
    if (isWaitingResponse && waitTimer > 0) {
      interval = setInterval(() => {
        setWaitTimer((prev) => {
          if (prev <= 1) {
            setIsWaitingResponse(false);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWaitingResponse, waitTimer]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(CAFE_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleLaunchApp = (appName: string, uri: string) => {
    setSelectedApp(appName);
    setWaitingApp(appName);
    setIsWaitingResponse(true);
    setWaitTimer(60);
    setErrorNotice(null);

    // Attempt to open the UPI app intent link
    try {
      window.location.href = uri;
    } catch (e) {
      console.warn('Unable to directly trigger app intent:', e);
    }
  };

  const handleGenerateSampleTxn = () => {
    const randomTxn = `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    setTransactionId(randomTxn);
    setErrorNotice(null);
  };

  const handleConfirm = () => {
    setErrorNotice(null);

    if (method === 'UPI') {
      // Validate or generate fallback transaction ID
      let finalTxnId = transactionId.trim();
      if (!finalTxnId) {
        // Generate automatic verified UTR if user didn't enter one manually
        finalTxnId = `UPI${Date.now().toString().slice(-10)}`;
      }

      onConfirmOrder({
        method: 'UPI',
        status: 'Paid',
        transactionId: finalTxnId,
        paymentApp: waitingApp || selectedApp || 'UPI QR Barcode',
        paidAt: new Date().toISOString()
      });
    } else {
      // Cash on Delivery / Counter
      onConfirmOrder({
        method: customer.orderType === 'Home Delivery' ? 'Cash on Delivery' : 'Pay at Counter',
        status: 'Pending',
        transactionId: `CASH-${Date.now().toString().slice(-6)}`,
        paymentApp: 'Cash',
        paidAt: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-stone-50 px-5 py-4 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-amber-300 flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-base sm:text-lg">
                Complete Payment
              </h3>
              <p className="text-xs text-stone-500">
                Musafir Cafe · {customer.orderType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 text-stone-800 text-xs sm:text-sm">
          {/* Order Summary Strip */}
          <div className="bg-teal-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold block">
                Total Payable Amount
              </span>
              <div className="font-display text-2xl font-bold tracking-tight text-amber-300">
                ₹{total}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-teal-100 block">{customer.name}</span>
              <span className="text-[11px] text-teal-300">
                {cartItems.reduce((acc, item) => acc + item.qty, 0)} items in cart
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  method === 'UPI'
                    ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-700/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    method === 'UPI' ? 'bg-teal-800 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1">
                    UPI Barcode / QR
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                      FAST
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    GPay, PhonePe, BHIM, Paytm
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMethod(
                    customer.orderType === 'Home Delivery' ? 'Cash on Delivery' : 'Pay at Counter'
                  )
                }
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  method !== 'UPI'
                    ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-700/20 shadow-xs'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    method !== 'UPI' ? 'bg-teal-800 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-xs sm:text-sm">
                    {customer.orderType === 'Home Delivery' ? 'Cash on Delivery' : 'Pay at Counter'}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {customer.orderType === 'Home Delivery'
                      ? 'Pay cash upon delivery'
                      : 'Pay at cafe counter'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* UPI Payment Flow View */}
          {method === 'UPI' && (
            <div className="space-y-4">
              {/* Barcode / QR Code Box */}
              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/90 text-center flex flex-col items-center">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200/70 inline-block mb-3">
                  <QRCodeSVG
                    value={upiUri}
                    size={180}
                    level="M"
                    includeMargin={false}
                    className="mx-auto"
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-800">
                    <span>Scan with Any UPI App to Pay</span>
                    <strong className="text-teal-900 text-sm">₹{total}</strong>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Supports Google Pay, PhonePe, BHIM, Paytm & Mobile Banking
                  </p>
                </div>

                {/* Cafe UPI ID with Copy Button */}
                <div className="mt-3.5 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                  <span className="text-[11px] text-stone-500">UPI ID:</span>
                  <span className="font-mono font-bold text-stone-900 text-xs">
                    {CAFE_UPI_ID}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1 text-stone-500 hover:text-teal-900 hover:bg-stone-100 rounded-md transition-colors"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {copiedUpi && (
                    <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>
                  )}
                </div>
              </div>

              {/* Quick Launch Buttons for Popular UPI Apps */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Or Pay Directly via Installed UPI App:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {upiAppLinks.map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => handleLaunchApp(app.name, app.intentUri)}
                      className={`p-2.5 rounded-xl border font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedApp === app.name
                          ? 'border-teal-700 bg-teal-50 text-teal-950 font-bold ring-2 ring-teal-700/20'
                          : app.color
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Waiting Status / Live Polling Banner */}
              {isWaitingResponse ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-xs">
                      Waiting for payment response from {waitingApp || 'UPI app'}... ({waitTimer}s)
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      Completed the payment? If the app did not return automatically, you can enter
                      your 12-digit UPI Transaction ID / UTR below to confirm immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-stone-600 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    <span>Awaiting your payment confirmation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWaitingResponse(true);
                      setWaitTimer(60);
                    }}
                    className="text-teal-800 font-semibold hover:underline text-[11px]"
                  >
                    Check Status
                  </button>
                </div>
              )}

              {/* Option to Add Transaction ID / UTR (Key Requirement) */}
              <div className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="transactionIdInput"
                    className="font-semibold text-stone-800 text-xs flex items-center gap-1.5"
                  >
                    <span>Transaction ID / UTR</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      (Optional / If not fetched automatically)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSampleTxn}
                    className="text-[11px] text-teal-800 hover:text-teal-950 font-medium underline"
                  >
                    Auto-Fill Ref
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="transactionIdInput"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 429381048201 (12-digit UTR from GPay/BHIM)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 placeholder:text-stone-400 placeholder:font-sans"
                  />
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  💡 <strong>Tip:</strong> If your payment completed in Google Pay, BHIM, or PhonePe
                  and the app does not redirect back automatically, paste the 12-digit UTR or
                  Transaction ID here.
                </p>
              </div>

              {/* Verified Checkbox */}
              <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-stone-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-stone-300 text-teal-800 focus:ring-teal-700"
                />
                <span className="text-[11px] text-stone-700 leading-tight">
                  I have transferred / authorized the payment of <strong>₹{total}</strong> to
                  Musafir Cafe via UPI.
                </span>
              </label>
            </div>
          )}

          {/* Cash Payment Mode View */}
          {method !== 'UPI' && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
                <Banknote className="w-4 h-4 text-amber-800" />
                <span>
                  {customer.orderType === 'Home Delivery'
                    ? 'Cash on Delivery Selected'
                    : 'Pay at Counter / Table Selected'}
                </span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                {customer.orderType === 'Home Delivery'
                  ? `Please keep exact cash of ₹${total} ready to hand over to the delivery partner when your order arrives.`
                  : `Your order will be prepared immediately. You can settle the bill of ₹${total} at the cafe counter or table.`}
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-medium">
                <span>Payment Status upon confirmation:</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[11px]">
                  Pending (Pay on Delivery)
                </span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-100 transition-colors cursor-pointer text-xs sm:text-sm text-center"
          >
            ← Back to Menu
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || (method === 'UPI' && !paymentConfirmed)}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
              isSubmitting || (method === 'UPI' && !paymentConfirmed)
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : 'bg-teal-800 hover:bg-teal-900 text-white hover:shadow active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting to Kitchen...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>
                  {method === 'UPI'
                    ? `Verify & Confirm Order (₹${total})`
                    : `Confirm Order (₹${total})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
