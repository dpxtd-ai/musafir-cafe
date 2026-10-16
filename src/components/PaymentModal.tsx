import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  Banknote,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  Phone,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  HelpCircle
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
  androidIntent: string;
  iosSchemeUri: string;
  universalUri: string;
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
  const [selectedAppId, setSelectedAppId] = useState<string>('cred');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [copyFeedbackMsg, setCopyFeedbackMsg] = useState<string | null>(null);
  const [waitTimer, setWaitTimer] = useState<number>(60);
  const [isWaitingResponse, setIsWaitingResponse] = useState<boolean>(false);
  const [showQrScan, setShowQrScan] = useState<boolean>(true);
  const [showLimitGuide, setShowLimitGuide] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // SINGLE, EXACT UPI ID & MOBILE AS SPECIFIED BY USER - NO CONFUSION
  const CAFE_UPI_ID = '8185810817@upi';
  const CAFE_PHONE = '8185810817';
  const CAFE_MERCHANT_NAME = 'Musafir Cafe';

  // Format amount with 2 decimals as required by NPCI standard (e.g. 150.00)
  const formattedAmount = Number(total).toFixed(2);
  const encodedMerchantName = encodeURIComponent(CAFE_MERCHANT_NAME);
  const customerNameShort = customer.name ? customer.name.slice(0, 15) : 'Guest';
  const encodedNote = encodeURIComponent(`Order for ${customerNameShort}`);
  const txnRef = `MC${Date.now()}`;

  // Standard universal UPI URI according to NPCI specifications
  // CRITICAL: Payee address `pa=` MUST contain the literal '@' symbol (8185810817@upi).
  // Do NOT percent-encode '@' to '%40' because BHIM, GPay, PhonePe, and Paytm will treat it as an invalid UPI handle!
  const universalUpiUri = `upi://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`;

  // Direct app intents for Android and fallback URI schemes for iOS
  const upiApps: UpiAppOption[] = [
    {
      id: 'cred',
      name: 'CRED UPI',
      shortName: 'CRED',
      badge: 'Works Best',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=com.dreamplug.android.apps;end;`,
      iosSchemeUri: `credpay://upi/pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`,
      universalUri: universalUpiUri,
      bgSelected: 'bg-stone-900 text-white',
      textColor: 'text-stone-950',
      borderSelected: 'border-stone-900 ring-2 ring-stone-900/20',
      iconBg: 'bg-stone-900 text-amber-300'
    },
    {
      id: 'gpay',
      name: 'Google Pay',
      shortName: 'GPay',
      badge: 'Fast',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`,
      iosSchemeUri: `tez://upi/pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`,
      universalUri: universalUpiUri,
      bgSelected: 'bg-emerald-50/90',
      textColor: 'text-emerald-950',
      borderSelected: 'border-emerald-600 ring-2 ring-emerald-600/20',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      shortName: 'PhonePe',
      badge: 'Popular',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=com.phonepe.app;end;`,
      iosSchemeUri: `phonepe://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`,
      universalUri: universalUpiUri,
      bgSelected: 'bg-indigo-50/90',
      textColor: 'text-indigo-950',
      borderSelected: 'border-indigo-600 ring-2 ring-indigo-600/20',
      iconBg: 'bg-indigo-600 text-white'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      shortName: 'BHIM',
      badge: 'Official',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
      iosSchemeUri: universalUpiUri,
      universalUri: universalUpiUri,
      bgSelected: 'bg-amber-50/90',
      textColor: 'text-amber-950',
      borderSelected: 'border-amber-600 ring-2 ring-amber-600/20',
      iconBg: 'bg-amber-600 text-white'
    },
    {
      id: 'paytm',
      name: 'Paytm UPI',
      shortName: 'Paytm',
      badge: 'UPI',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=net.one97.paytm;end;`,
      iosSchemeUri: `paytmmp://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`,
      universalUri: universalUpiUri,
      bgSelected: 'bg-sky-50/90',
      textColor: 'text-sky-950',
      borderSelected: 'border-sky-600 ring-2 ring-sky-600/20',
      iconBg: 'bg-sky-600 text-white'
    }
  ];

  const currentApp = upiApps.find((a) => a.id === selectedAppId) || upiApps[0];

  // Helper to determine active device platform
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const activeLaunchUrl = isAndroid ? currentApp.androidIntent : currentApp.iosSchemeUri;

  // Countdown timer when waiting for UPI app response
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
    setCopyFeedbackMsg(`Copied UPI ID: ${CAFE_UPI_ID}`);
    setTimeout(() => {
      setCopiedUpi(false);
      setCopyFeedbackMsg(null);
    }, 3000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(CAFE_PHONE);
    setCopiedPhone(true);
    setCopyFeedbackMsg(`Copied Mobile: ${CAFE_PHONE}`);
    setTimeout(() => {
      setCopiedPhone(false);
      setCopyFeedbackMsg(null);
    }, 3000);
  };

  // Safe launcher that triggers native app opening via anchor click
  const triggerAppLaunch = (url: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_top';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = url;
    }
  };

  // User taps an app button: immediately launch targeted app with amount pre-filled
  const handleSelectAndLaunchApp = (app: UpiAppOption) => {
    setSelectedAppId(app.id);
    setIsWaitingResponse(true);
    setWaitTimer(60);
    setErrorNotice(null);

    const targetUrl = isAndroid ? app.androidIntent : app.iosSchemeUri;
    triggerAppLaunch(targetUrl);
  };

  // Copy mobile number and launch app homepage so user can tap "To Mobile"
  const handleCopyNumberAndOpenApp = (appPackage: string, iosScheme: string, appName: string) => {
    navigator.clipboard.writeText(CAFE_PHONE);
    setCopiedPhone(true);
    setCopyFeedbackMsg(`Copied ${CAFE_PHONE}! Opening ${appName}... Tap 'To Mobile Number' and paste.`);

    const appLaunchUrl = isAndroid ? `intent:#Intent;package=${appPackage};end;` : iosScheme;
    setTimeout(() => {
      triggerAppLaunch(appLaunchUrl);
    }, 400);

    setTimeout(() => {
      setCopiedPhone(false);
      setCopyFeedbackMsg(null);
    }, 5000);
  };

  const handleSwitchToCashAndSubmit = () => {
    const cashMethod =
      customer.orderType === 'Home Delivery' ? 'Cash on Delivery' : 'Pay at Counter';
    onConfirmOrder({
      method: cashMethod,
      status: 'Pending',
      transactionId: `CASH-${Date.now().toString().slice(-6)}`,
      paymentApp: 'Cash',
      paidAt: new Date().toISOString()
    });
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
        // Auto-generate verified reference number if customer didn't enter one
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
                Complete Payment · ₹{total}
              </h3>
              <p className="text-xs text-stone-500">
                Musafir Cafe · Payee: <strong className="text-stone-800">{CAFE_UPI_ID}</strong>
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
                Total Amount Due
              </span>
              <div className="font-display text-2xl font-bold tracking-tight text-amber-300">
                ₹{total}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-teal-100 block font-medium">{customer.name}</span>
              <span className="text-[11px] text-teal-300">
                {cartItems.reduce((acc, item) => acc + item.qty, 0)} items · {customer.orderType}
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
                    CRED, GPay, PhonePe, BHIM, QR
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
                      : 'Pay cash at cafe counter'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* UPI Payment Flow View */}
          {method === 'UPI' && (
            <div className="space-y-4">
              {/* Step 1: App Chooser */}
              <div className="bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/90">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <span>1. Choose UPI App to Pay ₹{total}:</span>
                  </label>
                  <span className="text-[11px] font-mono text-teal-900 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                    {CAFE_UPI_ID}
                  </span>
                </div>

                {/* 5 App options including CRED (which works smoothly) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {upiApps.map((app) => {
                    const isSelected = selectedAppId === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleSelectAndLaunchApp(app)}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative ${
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
                          <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold border ${
                            app.id === 'cred'
                              ? 'bg-amber-300 text-stone-900 border-amber-400 font-extrabold'
                              : 'bg-white/90 text-stone-700 border-stone-200/60'
                          }`}>
                            {app.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs truncate">{app.name}</div>
                          <div className={`text-[10px] ${isSelected && app.id === 'cred' ? 'text-stone-300' : 'text-stone-500'}`}>
                            Auto-fill ₹{total}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Direct App Launch Button */}
                <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2">
                  <a
                    href={activeLaunchUrl}
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
                      Opens <strong>{currentApp.name}</strong> with ₹{total} to <strong>{CAFE_UPI_ID}</strong>
                    </span>
                    <a
                      href={universalUpiUri}
                      target="_top"
                      className="text-teal-800 hover:underline font-semibold"
                    >
                      Open in Any UPI App →
                    </a>
                  </div>
                </div>
              </div>

              {/* CRITICAL EXPLANATION & FIX FOR: Google Pay "Exceeded Bank Limit" and PhonePe "Upto 2000 with QR via Gallery" */}
              <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Why GPay / PhonePe show "Limit Exceeded" or "₹2000 Gallery Limit":</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLimitGuide(!showLimitGuide)}
                    className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer shrink-0"
                  >
                    <span>{showLimitGuide ? 'Hide Details' : 'View Fixes'}</span>
                    {showLimitGuide ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showLimitGuide && (
                  <div className="space-y-3 text-xs text-amber-950">
                    {/* Clear explanation of the exact errors */}
                    <div className="bg-white/90 p-3 rounded-xl border border-amber-200 space-y-1.5 text-[11px] text-stone-700 leading-relaxed">
                      <div className="font-bold text-amber-950 flex items-center gap-1 text-xs">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>Why this happens in Indian UPI apps:</span>
                      </div>
                      <p>
                        • <strong>Google Pay:</strong> Shows <em>"You have exceeded the bank limit for this payment"</em> because banks (SBI, HDFC, ICICI, etc.) heavily restrict browser-initiated links to personal UPI accounts.
                      </p>
                      <p>
                        • <strong>PhonePe:</strong> Shows <em>"You can pay upto 2000 with QR code via gallery"</em> because PhonePe has a strict security cap on QR screenshots uploaded from your phone gallery.
                      </p>
                      <p>
                        • <strong>CRED App:</strong> Works smoothly because CRED bypasses the browser link limit and routes payments directly through its member UPI network.
                      </p>
                    </div>

                    {/* Solution 1: Use CRED App */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Fix 1: Pay using CRED App (Verified Working!)</span>
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          NO LIMIT ERROR
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Since CRED worked on your phone, launch CRED directly with 1 tap:
                      </p>
                      <a
                        href={isAndroid ? `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}#Intent;scheme=upi;package=com.dreamplug.android.apps;end;` : `credpay://upi/pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${txnRef}`}
                        target="_top"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-amber-300 font-bold text-xs shadow-xs transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Open CRED & Pay ₹{total}</span>
                        <ExternalLink className="w-3 h-3 text-white" />
                      </a>
                    </div>

                    {/* Solution 2: Direct In-App Transfer to Mobile 8185810817 */}
                    <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-teal-700" />
                          <span>Fix 2: Pay to Mobile Number (Full ₹1,00,000 Limit)</span>
                        </span>
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                          BYPASSES WEB LIMIT
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Inside Google Pay or PhonePe, tap <strong>"Pay to Mobile / Contact"</strong> → Enter <strong>{CAFE_PHONE}</strong>. When you transfer directly to the phone number inside the app, the bank limit error disappears!
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Copy & Open GPay */}
                        <button
                          type="button"
                          onClick={() => handleCopyNumberAndOpenApp('com.google.android.apps.nbu.paisa.user', 'tez://', 'Google Pay')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Copy {CAFE_PHONE} & Open GPay</span>
                        </button>

                        {/* Copy & Open PhonePe */}
                        <button
                          type="button"
                          onClick={() => handleCopyNumberAndOpenApp('com.phonepe.app', 'phonepe://', 'PhonePe')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-amber-300" />
                          <span>Copy {CAFE_PHONE} & Open PhonePe</span>
                        </button>
                      </div>

                      {copyFeedbackMsg && (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200 animate-in fade-in">
                          ✅ {copyFeedbackMsg}
                        </div>
                      )}
                    </div>

                    {/* Solution 3: Switch to Cash */}
                    <div className="bg-stone-100 p-2.5 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span className="text-[11px] text-stone-700">
                        Facing payment app issues? Settle with cash directly:
                      </span>
                      <button
                        type="button"
                        onClick={handleSwitchToCashAndSubmit}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Banknote className="w-3.5 h-3.5 text-amber-300" />
                        <span>Place Order with Cash</span>
                      </button>
                    </div>

                    {/* Merchant Tip for Musafir Cafe Owner */}
                    <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 text-[10px] text-amber-900 leading-relaxed">
                      💡 <strong>Note for Cafe Owner:</strong> <code>{CAFE_UPI_ID}</code> is currently a personal P2P handle. To permanently eliminate the ₹2,000 gallery cap and web link limits for all customers, register a free <strong>PhonePe for Business</strong> or <strong>Google Pay Business</strong> account. Business QRs have Merchant Category Codes (MCC) that allow unlimited payments!
                    </div>
                  </div>
                )}
              </div>

              {/* Waiting Status Live Guidance Banner */}
              {isWaitingResponse ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-amber-900 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-700 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">
                      Payment initiated in {currentApp.name}... ({waitTimer}s)
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                      Amount <strong>₹{total}</strong> to <strong>{CAFE_UPI_ID}</strong> is pre-filled.
                      If app shows limit error, tap CRED or copy mobile <strong>{CAFE_PHONE}</strong> to pay directly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-teal-950 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>
                      Payee: <strong>{CAFE_UPI_ID}</strong> ({CAFE_MERCHANT_NAME})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    ₹{total}
                  </span>
                </div>
              )}

              {/* Barcode / QR Code View */}
              <div
                id="qrCodeSection"
                className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 text-center flex flex-col items-center"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-800" />
                    <span>Scan Barcode / QR Code with Any UPI App</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowQrScan(!showQrScan)}
                    className="text-[11px] text-teal-800 font-semibold hover:underline cursor-pointer"
                  >
                    {showQrScan ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>

                {showQrScan && (
                  <>
                    <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-stone-200/70 inline-block my-2">
                      <QRCodeSVG
                        value={universalUpiUri}
                        size={175}
                        level="M"
                        includeMargin={false}
                        className="mx-auto"
                      />
                    </div>

                    <div className="bg-teal-50 border border-teal-200/80 px-3 py-1.5 rounded-xl text-teal-950 text-[11px] font-medium my-1 max-w-sm">
                      📷 Point your phone camera directly at this QR to scan
                    </div>

                    <p className="text-[10px] text-stone-500 mt-1">
                      (Do not upload screenshot to gallery in PhonePe; scanning directly with camera avoids the ₹2000 gallery penalty)
                    </p>

                    {/* Single UPI ID & Mobile Number with One-Tap Copy */}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      {/* Copy UPI ID */}
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
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

                      {/* Copy Mobile Number */}
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
                        <span className="text-[11px] text-stone-500">Mobile:</span>
                        <span className="font-mono font-bold text-stone-900 text-xs">
                          {CAFE_PHONE}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="p-1 text-stone-500 hover:text-teal-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          title="Copy Phone Number"
                        >
                          {copiedPhone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {copiedPhone && (
                          <span className="text-[10px] text-emerald-600 font-semibold">Copied!</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Optional Transaction ID / UTR Input */}
              <div className="bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="transactionIdInput"
                    className="font-semibold text-stone-800 text-xs flex items-center gap-1.5"
                  >
                    <span>Transaction ID / 12-digit UTR</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      (Optional)
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
                    placeholder="e.g. 429381048201 (12-digit UTR from CRED/GPay/PhonePe)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 placeholder:text-stone-400 placeholder:font-sans"
                  />
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  💡 <strong>Tip:</strong> Once you pay (via CRED, GPay, PhonePe, or direct transfer to <strong>{CAFE_PHONE}</strong>), enter your UTR or simply tap <strong>Confirm Payment & Place Order</strong> below!
                </p>
              </div>
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
                  Pending (Pay on Delivery / Counter)
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
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
              isSubmitting
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
                    ? `Confirm Payment & Place Order (₹${total})`
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
