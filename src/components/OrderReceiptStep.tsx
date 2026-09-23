import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Home,
  Coffee,
  Calendar,
  User,
  MapPin,
  Hash,
  Phone
} from 'lucide-react';
import { OrderData } from '../types/cafe';
import { captureReceiptElement, clearCafeStorage } from '../services/cafeService';

interface OrderReceiptStepProps {
  orderData: OrderData;
  orderNumber: string;
  onGoHome: () => void;
}

export const OrderReceiptStep: React.FC<OrderReceiptStepProps> = ({
  orderData,
  orderNumber,
  onGoHome
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Auto-capture receipt after 1 second as in original code:
  // setTimeout(() => { captureOrderReceipt(); }, 1000);
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCaptureImage(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleCaptureImage = async (showNotification = true) => {
    setIsCapturing(true);
    try {
      await captureReceiptElement('orderReceipt');
      if (showNotification) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to capture receipt PNG:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleHomeClick = () => {
    clearCafeStorage();
    onGoHome();
  };

  const currentDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 text-center shadow-xs no-print">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-2">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-emerald-950">
          ✅ Order Placed Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-emerald-800 mt-1">
          Your order has been recorded into the Musafir Cafe kitchen queue.
        </p>
      </div>

      {/* Main Printable Receipt Card (id="orderReceipt") */}
      <div
        id="orderReceipt"
        className="receipt-container bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-md relative overflow-hidden"
      >
        {/* Top Aesthetic Cafe Branding */}
        <div className="text-center pb-5 border-b border-dashed border-stone-300">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-800 text-amber-200 mb-2">
            <Coffee className="w-5 h-5" />
          </div>
          <h3 className="font-display text-2xl font-bold text-stone-900 tracking-tight">
            🍽️ Musafir Cafe
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Artisanal Chai, Coffee & Gourmet Delights
          </p>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
            Mode: {orderData.customer.orderType}
          </div>
        </div>

        {/* Order Details Header */}
        <div className="py-4 border-b border-stone-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-stone-400 block text-[11px] uppercase tracking-wider">
              Order Number
            </span>
            <span className="font-bold text-sm text-teal-800 tracking-wide font-mono">
              #{orderNumber}
            </span>
          </div>

          <div className="text-right">
            <span className="text-stone-400 block text-[11px] uppercase tracking-wider">
              Date & Time
            </span>
            <span className="font-medium text-stone-700">
              {currentDate}
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-stone-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-stone-700 font-medium">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Customer: <strong className="text-stone-900">{orderData.customer.name}</strong></span>
            </div>

            {orderData.customer.orderType === 'Home Delivery' ? (
              <>
                {orderData.customer.mobile && (
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <Phone className="w-3.5 h-3.5 text-teal-700" />
                    <span>Phone: {orderData.customer.mobile}</span>
                  </div>
                )}
                {orderData.customer.address && (
                  <div className="flex items-start gap-1.5 text-stone-600">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <span className="break-words">Address: {orderData.customer.address}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-stone-600">
                <Hash className="w-3.5 h-3.5 text-teal-700" />
                <span>Table: <strong className="text-stone-900">{orderData.customer.tableNumber}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Order Table (Matching exact columns: Item, Qty, Price, Total) */}
        <div className="py-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-teal-800 text-white font-semibold">
                <th className="border border-teal-900/40 p-2.5 text-left">Item</th>
                <th className="border border-teal-900/40 p-2.5 text-center w-14">Qty</th>
                <th className="border border-teal-900/40 p-2.5 text-center w-18">Price</th>
                <th className="border border-teal-900/40 p-2.5 text-center w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, idx) => (
                <tr
                  key={`${item.item}-${idx}`}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/70'}
                >
                  <td className="border border-stone-200 p-2.5 text-stone-800 font-medium">
                    {item.item}
                  </td>
                  <td className="border border-stone-200 p-2.5 text-center text-stone-700 tabular-nums">
                    {item.qty}
                  </td>
                  <td className="border border-stone-200 p-2.5 text-center text-stone-700 tabular-nums">
                    ₹{item.price}
                  </td>
                  <td className="border border-stone-200 p-2.5 text-center font-semibold text-stone-900 tabular-nums">
                    ₹{item.subtotal}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-stone-100 text-stone-900">
                <td colSpan={3} className="border border-stone-200 p-2.5 text-right font-semibold">
                  Grand Total
                </td>
                <td className="border border-stone-200 p-2.5 text-center text-sm font-bold text-teal-900 tabular-nums">
                  ₹{orderData.total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cafe Footer Note */}
        <div className="pt-4 text-center border-t border-dashed border-stone-300">
          <p className="text-xs font-semibold text-stone-800">
            Thank you for ordering from Musafir Cafe.
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            We hope you enjoy your experience with us! Have a wonderful day.
          </p>
        </div>
      </div>

      {/* Action Buttons: Home button */}
      <div className="space-y-3 no-print">
        {/* Home Button */}
        <button
          onClick={handleHomeClick}
          className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-teal-800 hover:bg-teal-900 text-white shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>🏠 Home</span>
        </button>

        {isCapturing && (
          <p className="text-center text-xs text-stone-500 font-medium">
            Generating receipt image...
          </p>
        )}

        {downloadSuccess && (
          <p className="text-center text-xs text-emerald-700 font-medium">
            ✓ Receipt screenshot saved to your device
          </p>
        )}
      </div>
    </div>
  );
};
