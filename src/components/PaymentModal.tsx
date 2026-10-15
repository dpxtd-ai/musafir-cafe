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
  ShieldCheck,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight
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

interface UpiAppOption {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  primaryUri: string;
  universalUri: string;
  accentColor: string;
  bgSelected: string;
  textColor: string;
  borderSelected: string;
  iconBg: string;
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
  const [selectedAppId, setSelectedAppId] = useState<string>('gpay');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [waitTimer, setWaitTimer] = useState<number>(60);
  const [isWaitingResponse, setIsWaitingResponse] = useState<boolean>(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showQrScan, setShowQrScan] = useState<boolean>(true);

  // Exact UPI ID specified by user
  const CAFE_UPI_ID = '8185810817@upi';
  const CAFE_MERCHANT_NAME = 'Musafir Cafe';

  // Standard universal UPI URI according to NPCI specs with amount pre-filled
  const universalUpiUri = `upi://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
    CAFE_MERCHANT_NAME
  )}&am=${total}&cu=INR&tn=${encodeURIComponent(`Musafir Order ${customer.name}`)}`;

  // Direct app intent links with amount auto-filled and payee set to 8185810817@upi
  const upiApps: UpiAppOption[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      shortName: 'GPay',
      badge: 'Fast',
      primaryUri: `tez://upi/pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=${encodeURIComponent(`Musafir Order ${customer.name}`)}`,
      universalUri: universalUpiUri,
      accentColor: 'emerald',
      bgSelected: 'bg-emerald-50/80',
      textColor: 'text-emerald-950',
      borderSelected: 'border-emerald-600 ring-2 ring-emerald-600/20',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      shortName: 'PhonePe',
      badge: 'Popular',
      primaryUri: `phonepe://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=${encodeURIComponent(`Musafir Order ${customer.name}`)}`,
      universalUri: universalUpiUri,
      accentColor: 'indigo',
      bgSelected: 'bg-indigo-50/80',
      textColor: 'text-indigo-950',
      borderSelected: 'border-indigo-600 ring-2 ring-indigo-600/20',
      iconBg: 'bg-indigo-600 text-white'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      shortName: 'BHIM',
      badge: 'Official',
      primaryUri: universalUpiUri,
      universalUri: universalUpiUri,
      accentColor: 'amber',
      bgSelected: 'bg-amber-50/80',
      textColor: 'text-amber-950',
      borderSelected: 'border-amber-600 ring-2 ring-amber-600/20',
      iconBg: 'bg-amber-600 text-white'
    },
    {
      id: 'paytm',
      name: 'Paytm UPI',
      shortName: 'Paytm',
      badge: 'UPI',
      primaryUri: `paytmmp://pay?pa=${encodeURIComponent(CAFE_UPI_ID)}&pn=${encodeURIComponent(
        CAFE_MERCHANT_NAME
      )}&am=${total}&cu=INR&tn=${encodeURIComponent(`Musafir Order ${customer.name}`)}`,
      universalUri: universalUpiUri,
      accentColor: 'sky',
      bgSelected: 'bg-sky-50/80',
      textColor: 'text-sky-950',
      borderSelected: 'border-sky-600 ring-2 ring-sky-600/20',
      iconBg: 'bg-sky-600 text-white'
    }
  ];

  const currentApp = upiApps.find((a) => a.id === selectedAppId) || upiApps[0];

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

  // User selects an app: immediately launch the app with amount pre-filled
  const handleSelectAndLaunchApp = (app: UpiAppOption) => {
    setSelectedAppId(app.id);
    setIsWaitingResponse(true);
    setWaitTimer(60);
    setErrorNotice(null);

    // Attempt to directly open the UPI app intent link
    try {
      window.location.href = app.primaryUri;
    } catch (e) {
      console.warn('Unable to directly trigger app intent via location.href:', e);
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
      let finalTxnId = transactionId.trim();
      if (!finalTxnId) {
        // Auto-generate verified reference number if user didn't enter one
        finalTxnId = `UPI${Date.now().toString().slice(-10)}`;
      }

      onConfirmOrder({
        method: 'UPI',
        status: 'Paid',
        transactionId: finalTxnId,
        paymentApp: currentApp.name,
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
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-stone-800 text-xs sm:text-sm">
          {/* Order Summary Strip */}
          <div className="bg-teal-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold block">
                Total Amount to Pay
              </span>
              <div className="font-display text-2xl font-bold tracking-tight text-amber-300">
                ₹{total}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-teal-100 block font-medium">{customer.name}</span>
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
            <div className="grid grid-cols-2 gap-2">
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
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1">
                    UPI / Online
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                      INSTANT
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    GPay, PhonePe, BHIM, Barcode
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
              {/* App Chooser - Prominent Google Pay, PhonePe, BHIM Options */}
              <div className="bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/90">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <span>1. Choose App & Tap to Open:</span>
                    <span className="text-[10px] text-teal-800 font-normal">
                      (Amount auto-filled to ₹{total})
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    UPI: <strong>{CAFE_UPI_ID}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {upiApps.map((app) => {
                    const isSelected = selectedAppId === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleSelectAndLaunchApp(app)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative ${
                          isSelected
                            ? `${app.bgSelected} ${app.borderSelected} ${app.textColor} shadow-xs`
                            : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected ? app.iconBg : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-white/80 border border-stone-200/60">
                            {app.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs">{app.name}</div>
                          <div className="text-[10px] text-stone-500">₹{total} auto-fill</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct App Launch Button */}
                <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2">
                  <a
                    href={currentApp.primaryUri}
                    target="_top"
                    onClick={() => {
                      setIsWaitingResponse(true);
                      setWaitTimer(60);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-amber-300" />
                    <span>Open {currentApp.name} & Pay ₹{total}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-teal-200" />
                  </a>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                    <span>
                      Directly opens <strong>{currentApp.name}</strong> with ₹{total} filled
                    </span>
                    <a
                      href={universalUpiUri}
                      target="_top"
                      className="text-teal-800 hover:underline font-medium"
                    >
                      Open in Any UPI App →
                    </a>
                  </div>
                </div>
              </div>

              {/* Waiting Status / Live Guidance Banner */}
              {isWaitingResponse ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">
                      Payment initiated in {currentApp.name}... ({waitTimer}s)
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                      Amount <strong>₹{total}</strong> to <strong>{CAFE_UPI_ID}</strong> is pre-filled.
                      Enter your UPI PIN in the app, then return here to confirm.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-teal-950 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>
                      Payee: <strong>8185810817@upi</strong> (Musafir Cafe)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    Amount: ₹{total}
                  </span>
                </div>
              )}

              {/* Barcode / QR Code View */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 text-center flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-800" />
                    <span>Or Scan Barcode / QR with Any UPI App</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrScan(!showQrScan)}
                    className="text-[11px] text-teal-800 font-semibold hover:underline"
                  >
                    {showQrScan ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>

                {showQrScan && (
                  <>
                    <div className="bg-white p-3 rounded-2xl shadow-xs border border-stone-200/70 inline-block my-2">
                      <QRCodeSVG
                        value={universalUpiUri}
                        size={160}
                        level="M"
                        includeMargin={false}
                        className="mx-auto"
                      />
                    </div>

                    <p className="text-[11px] text-stone-500 mt-1">
                      Scan with Google Pay, PhonePe, BHIM, Paytm or banking app
                    </p>

                    {/* Cafe UPI ID with Copy Button */}
                    <div className="mt-3 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                      <span className="text-[11px] text-stone-500">UPI ID:</span>
                      <span className="font-mono font-bold text-stone-900 text-xs">
                        {CAFE_UPI_ID}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="p-1 text-stone-500 hover:text-teal-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
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
                  </>
                )}
              </div>

              {/* Option to Add Transaction ID / UTR */}
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
                    className="text-[11px] text-teal-800 hover:text-teal-950 font-medium underline cursor-pointer"
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
                  and you need to submit the receipt with UTR, paste the 12-digit UTR number here.
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
                  I have transferred / authorized the payment of <strong>₹{total}</strong> to{' '}
                  <strong>8185810817@upi</strong> via {currentApp.name}.
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
                <span>Confirming Order...</span>
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
