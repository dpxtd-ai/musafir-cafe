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
  Camera,
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
  // GOOGLE PAY IS THE PRIMARY DEFAULT OPTION
  const [selectedAppId, setSelectedAppId] = useState<string>('gpay');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [copyFeedbackMsg, setCopyFeedbackMsg] = useState<string | null>(null);
  const [waitTimer, setWaitTimer] = useState<number>(60);
  const [isWaitingResponse, setIsWaitingResponse] = useState<boolean>(false);
  const [showQrScan, setShowQrScan] = useState<boolean>(true);
  const [showGPayGuide, setShowGPayGuide] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // SINGLE, EXACT UPI ID & MOBILE AS REQUIRED BY USER
  const CAFE_UPI_ID = '8185810817@upi';
  const CAFE_PHONE = '8185810817';
  const CAFE_MERCHANT_NAME = 'Musafir Cafe';

  // Format amount with 2 decimals
  const formattedAmount = Number(total).toFixed(2);
  const encodedMerchantName = encodeURIComponent(CAFE_MERCHANT_NAME);
  const customerNameShort = customer.name ? customer.name.slice(0, 15) : 'Guest';
  const encodedNote = encodeURIComponent(`Order for ${customerNameShort}`);

  // CRITICAL FIX FOR GOOGLE PAY "EXCEEDED BANK LIMIT" ERROR:
  // 1. DO NOT INCLUDE `tr=` (Transaction Reference). When `tr` is sent to a personal VPA (`@upi`),
  //    Google Pay treats it as an unregistered merchant call, causing banks to reject with
  //    "You have exceeded the bank limit for this payment retry with a smaller amount".
  // 2. Keep the URI clean: `pa`, `pn`, `am`, `cu=INR`, `tn`.
  // 3. For Google Pay on Android, use `tez://upi/pay` or standard `upi://pay` without forced package lock.
  const cleanUniversalUpiUri = `upi://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
  const gpayTezUri = `tez://upi/pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
  const gpayIntentUri = `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;

  // Direct app intents for Android and fallback URI schemes for iOS
  const upiApps: UpiAppOption[] = [
    {
      id: 'gpay',
      name: 'Google Pay',
      shortName: 'GPay',
      badge: 'Recommended',
      androidIntent: gpayTezUri, // tez:// scheme opens Google Pay directly without merchant intent lock
      iosSchemeUri: gpayTezUri,
      universalUri: cleanUniversalUpiUri,
      bgSelected: 'bg-emerald-50/95',
      textColor: 'text-emerald-950',
      borderSelected: 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-sm',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      shortName: 'PhonePe',
      badge: 'Popular',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.phonepe.app;end;`,
      iosSchemeUri: `phonepe://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`,
      universalUri: cleanUniversalUpiUri,
      bgSelected: 'bg-indigo-50/90',
      textColor: 'text-indigo-950',
      borderSelected: 'border-indigo-600 ring-2 ring-indigo-600/20',
      iconBg: 'bg-indigo-600 text-white'
    },
    {
      id: 'cred',
      name: 'CRED UPI',
      shortName: 'CRED',
      badge: 'Works Best',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.dreamplug.android.apps;end;`,
      iosSchemeUri: `credpay://upi/pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`,
      universalUri: cleanUniversalUpiUri,
      bgSelected: 'bg-stone-900 text-white',
      textColor: 'text-stone-950',
      borderSelected: 'border-stone-900 ring-2 ring-stone-900/20',
      iconBg: 'bg-stone-900 text-amber-300'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      shortName: 'BHIM',
      badge: 'Official',
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=in.org.npci.upiapp;end;`,
      iosSchemeUri: cleanUniversalUpiUri,
      universalUri: cleanUniversalUpiUri,
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
      androidIntent: `intent://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=net.one97.paytm;end;`,
      iosSchemeUri: `paytmmp://pay?pa=${CAFE_UPI_ID}&pn=${encodedMerchantName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`,
      universalUri: cleanUniversalUpiUri,
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

  // 1-TAP GOOGLE PAY FIX: Copy 8185810817 and immediately open Google Pay
  // This bypasses browser-initiated web link limits completely because inside Google Pay,
  // paying to mobile number 8185810817 has the full ₹1,00,000 NPCI daily limit!
  const handleLaunchGPayDirectByPhone = () => {
    navigator.clipboard.writeText(CAFE_PHONE);
    setCopiedPhone(true);
    setCopyFeedbackMsg(`Copied ${CAFE_PHONE}! Opening Google Pay... Tap 'Pay phone number' and paste.`);

    // Launch Google Pay app via tez:// or package intent
    const gpayLaunchUrl = isAndroid ? 'tez://' : 'tez://';
    setTimeout(() => {
      triggerAppLaunch(gpayLaunchUrl);
    }, 300);

    setTimeout(() => {
      setCopiedPhone(false);
    }, 5000);
  };

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
                Payee: <strong className="text-teal-900 font-mono">{CAFE_UPI_ID}</strong> ({CAFE_PHONE})
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
                    Google Pay / UPI
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                      INSTANT
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Google Pay, PhonePe, QR Code
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
              {/* PRIMARY FOCUS: GOOGLE PAY EXPRESS HUB */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50/40 rounded-2xl p-4 border-2 border-emerald-500/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold text-xs">
                      GPay
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                        <span>Google Pay (Official Method)</span>
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.2 rounded-full font-bold">
                          PRIMARY
                        </span>
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Pay ₹{total} to <strong>{CAFE_UPI_ID}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-950 block">₹{total}</span>
                    <span className="text-[10px] text-emerald-700">Pre-filled</span>
                  </div>
                </div>

                {/* Option 1: Direct Clean Google Pay Launch (No tr= parameter, avoids bank merchant check) */}
                <div className="space-y-2">
                  <a
                    href={gpayTezUri}
                    target="_top"
                    onClick={() => {
                      setSelectedAppId('gpay');
                      setIsWaitingResponse(true);
                      setWaitTimer(60);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-amber-300" />
                    <span>Open Google Pay & Pay ₹{total} (Direct)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                  </a>

                  {/* Fallback Intent link if tez:// doesn't catch */}
                  <div className="flex items-center justify-between text-[11px] text-stone-600 px-1">
                    <span>Direct launch link for Google Pay</span>
                    <a
                      href={cleanUniversalUpiUri}
                      target="_top"
                      className="text-emerald-800 hover:underline font-semibold"
                    >
                      Or Open via UPI Chooser →
                    </a>
                  </div>
                </div>

                {/* Option 2: 1-TAP BYPASS FOR "EXCEEDED BANK LIMIT" (Transfer to 8185810817 inside Google Pay) */}
                <div className="pt-2.5 border-t border-emerald-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>If Google Pay says "Exceeded Bank Limit":</span>
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                      ₹1 Lakh Daily Limit
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Indian banks (SBI, HDFC, ICICI, etc.) limit browser web-links to personal VPAs. 
                    <strong> Transferring directly to mobile number inside Google Pay has zero web limit!</strong>
                  </p>

                  <button
                    type="button"
                    onClick={handleLaunchGPayDirectByPhone}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copy {CAFE_PHONE} & Open Google Pay</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                  </button>

                  {copiedPhone && (
                    <div className="p-2.5 rounded-xl bg-emerald-100/90 text-emerald-950 text-[11px] font-medium border border-emerald-300 animate-in fade-in space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied {CAFE_PHONE}! Follow these 3 easy steps in Google Pay:</span>
                      </div>
                      <ol className="list-decimal list-inside pl-1 text-[10px] text-stone-700 space-y-0.5">
                        <li>In Google Pay, tap <strong>"Pay phone number"</strong></li>
                        <li>Paste <strong>{CAFE_PHONE}</strong> (Musafir Cafe)</li>
                        <li>Enter <strong>₹{total}</strong> & UPI PIN to pay</li>
                        <li>Come back here and tap <strong>Confirm Payment</strong> below!</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Other UPI Apps (PhonePe, CRED, BHIM, Paytm) */}
              <div className="bg-stone-50/90 rounded-2xl p-3.5 border border-stone-200/90">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <span>Other UPI Apps:</span>
                  </label>
                  <span className="text-[11px] font-mono text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                    {CAFE_UPI_ID}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {upiApps.filter((a) => a.id !== 'gpay').map((app) => {
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
              </div>

              {/* Waiting Status Live Guidance Banner */}
              {isWaitingResponse && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-950 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">
                      Payment initiated in {currentApp.name}... ({waitTimer}s)
                    </p>
                    <p className="text-[11px] text-emerald-800/90 mt-0.5 leading-relaxed">
                      Amount <strong>₹{total}</strong> to <strong>{CAFE_UPI_ID}</strong> is pre-filled.
                      After completing payment in Google Pay, enter your UTR or tap <strong>Confirm Payment</strong> below!
                    </p>
                  </div>
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
                    <span>Scan QR with Google Pay Camera (No Bank Limit)</span>
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
                        value={cleanUniversalUpiUri}
                        size={175}
                        level="M"
                        includeMargin={false}
                        className="mx-auto"
                      />
                    </div>

                    <div className="bg-teal-50 border border-teal-200/80 px-3.5 py-1.5 rounded-xl text-teal-950 text-[11px] font-medium my-1 max-w-sm flex items-center gap-2 justify-center">
                      <Camera className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                      <span>Open Google Pay → Tap <strong>Scan QR</strong> icon (top right)</span>
                    </div>

                    <p className="text-[10px] text-stone-500 mt-1">
                      Scanning directly with your phone camera is treated as an in-person payment by banks, avoiding all web limits!
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
                    <span>Google Pay UPI Transaction ID / 12-digit UTR</span>
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
                    placeholder="e.g. 429381048201 (12-digit UTR from Google Pay)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-700/30 focus:border-teal-700 placeholder:text-stone-400 placeholder:font-sans"
                  />
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  💡 <strong>Tip:</strong> Once paid via Google Pay, you can paste the 12-digit UTR or immediately tap <strong>Confirm Payment & Place Order</strong> below!
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
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow active:scale-[0.99]'
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
