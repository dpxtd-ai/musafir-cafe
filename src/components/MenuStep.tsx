import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Customer, MenuItem, CartItem, OrderData } from '../types/cafe';
import { submitCafeOrder, saveOrder } from '../services/cafeService';

interface MenuStepProps {
  customer: Customer;
  menu: MenuItem[];
  isLoadingMenu: boolean;
  onBack: () => void;
  onOrderSuccess: (orderData: OrderData, orderNumber: string) => void;
}

export const MenuStep: React.FC<MenuStepProps> = ({
  customer,
  menu,
  isLoadingMenu,
  onBack,
  onOrderSuccess
}) => {
  // Quantities mapped by item index
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  // Expanded category set
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group items by Category
  const categories = useMemo(() => {
    const map: Record<string, { item: MenuItem; index: number }[]> = {};
    menu.forEach((item, index) => {
      const category = item.Category || 'Others';
      if (!map[category]) {
        map[category] = [];
      }
      map[category].push({ item, index });
    });
    return map;
  }, [menu]);

  const categoryNames = useMemo(() => Object.keys(categories), [categories]);

  // Expand all categories initially or when categories load
  React.useEffect(() => {
    if (categoryNames.length > 0 && Object.keys(expandedCategories).length === 0) {
      const initial: Record<string, boolean> = {};
      categoryNames.forEach((cat) => {
        initial[cat] = true;
      });
      setExpandedCategories(initial);
    }
  }, [categoryNames]);

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Quantity updates
  const setItemQty = (index: number, qty: number) => {
    const validQty = Math.max(0, isNaN(qty) ? 0 : qty);
    setQuantities((prev) => ({
      ...prev,
      [index]: validQty
    }));
  };

  const incrementQty = (index: number) => {
    setItemQty(index, (quantities[index] || 0) + 1);
  };

  const decrementQty = (index: number) => {
    setItemQty(index, Math.max(0, (quantities[index] || 0) - 1));
  };

  // Live total calculation matching original calculateTotal()
  const { total, itemsCount, cartItems } = useMemo(() => {
    let sum = 0;
    let count = 0;
    const items: CartItem[] = [];

    menu.forEach((item, index) => {
      const qty = quantities[index] || 0;
      if (qty > 0) {
        const price = Number(item.Price) || 0;
        const subtotal = price * qty;
        sum += subtotal;
        count += qty;
        items.push({
          item: item.ItemName,
          qty,
          price,
          subtotal
        });
      }
    });

    return { total: sum, itemsCount: count, cartItems: items };
  }, [menu, quantities]);

  // Filter items by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, { item: MenuItem; index: number }[]> = {};

    Object.entries(categories).forEach(([cat, list]) => {
      const matching = list.filter(({ item }) =>
        item.ItemName.toLowerCase().includes(query) ||
        cat.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[cat] = matching;
      }
    });

    return filtered;
  }, [categories, searchQuery]);

  // Place Order handler adhering strictly to original flow and requirements
  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (cartItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    const orderPayload: OrderData = {
      customer,
      items: cartItems,
      total,
      timestamp: new Date().toISOString()
    };

    setIsSubmitting(true);

    try {
      const orderNumber = await submitCafeOrder(orderPayload);
      saveOrder({ ...orderPayload, orderNumber });
      onOrderSuccess(orderPayload, orderNumber);
    } catch (error) {
      console.error('Order submission failed:', error);
      setErrorMessage(
        'Unable to place the order with the server. Please verify your connection or try again.'
      );
      alert('Unable to place the order.\n\nPlease try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Top Navigation & Info Header */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              type="button"
              className="p-1.5 -ml-1 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
              title="Edit Details"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display text-xl font-bold text-stone-900">
              📋 Musafir Cafe Menu
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 pl-6">
            Ordering for: <strong className="text-stone-800">{customer.name}</strong> ·{' '}
            <span className="text-teal-800 font-semibold">{customer.orderType}</span>
            {customer.orderType === 'Home Delivery' && customer.mobile
              ? ` (${customer.mobile})`
              : customer.tableNumber
              ? ` (${customer.tableNumber})`
              : ''}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chai, sandwiches, pasta..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Category Quick Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categoryNames.map((catName) => (
          <button
            key={catName}
            onClick={() => {
              // Ensure section is expanded and scroll to it
              setExpandedCategories((prev) => ({ ...prev, [catName]: true }));
              const el = document.getElementById(`category-${catName}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-white border border-stone-200/80 text-stone-700 hover:text-teal-900 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer shadow-xs"
          >
            {catName}
          </button>
        ))}
      </div>

      {/* Loading Menu State */}
      {isLoadingMenu && (
        <div className="bg-white rounded-2xl p-12 border border-stone-200/80 text-center">
          <Loader2 className="w-8 h-8 text-teal-700 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-800">Loading fresh menu...</p>
          <p className="text-xs text-stone-500 mt-1">Fetching latest items and daily specials</p>
        </div>
      )}

      {/* Categories Accordions (Exact logic from toggleCategory) */}
      {!isLoadingMenu && (
        <div className="space-y-4" id="menuSection">
          {Object.keys(filteredCategories).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-stone-200/80 text-center">
              <p className="text-sm text-stone-600">No dishes match "{searchQuery}".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-semibold text-teal-800 underline hover:text-teal-950"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            Object.entries(filteredCategories).map(([category, items], catIndex) => {
              const isExpanded = expandedCategories[category] ?? true;

              return (
                <div
                  key={category}
                  id={`category-${category}`}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* Category Header (Preserving toggleCategory) */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-5 py-4 flex items-center justify-between bg-stone-50/70 hover:bg-teal-50/30 border-b border-stone-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                      <div>
                        <span className="font-semibold text-stone-900 text-sm sm:text-base">
                          {category}
                        </span>
                        <span className="text-xs text-stone-500 ml-2 font-normal">
                          ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-stone-500">
                      <span className="text-xs font-medium text-teal-800 hidden sm:inline">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-teal-800 transition-transform" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-stone-400 transition-transform" />
                      )}
                    </div>
                  </button>

                  {/* Category Body */}
                  {isExpanded && (
                    <div className="divide-y divide-stone-100 p-2 sm:p-3">
                      {items.map(({ item, index }) => {
                        const qty = quantities[index] || 0;
                        const price = Number(item.Price) || 0;

                        return (
                          <div
                            key={`${item.ItemName}-${index}`}
                            className="p-3 sm:p-4 rounded-xl hover:bg-stone-50/60 transition-colors flex items-center justify-between gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Pure Veg" />
                                <h4 className="font-semibold text-stone-900 text-sm sm:text-base truncate">
                                  {item.ItemName}
                                </h4>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-bold text-teal-900 tabular-nums">
                                  ₹{price}
                                </span>
                                {qty > 0 && (
                                  <span className="text-xs text-stone-400">
                                    · Subtotal: <strong className="text-stone-700 tabular-nums">₹{price * qty}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Stepper (Exact qty field & live calculateTotal logic) */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
                              <button
                                type="button"
                                onClick={() => decrementQty(index)}
                                disabled={qty === 0}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  qty > 0
                                    ? 'bg-white text-stone-800 shadow-xs hover:bg-stone-200 active:scale-95'
                                    : 'text-stone-300 cursor-not-allowed'
                                }`}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                id={`qty_${index}`}
                                type="number"
                                min={0}
                                value={qty}
                                onChange={(e) => setItemQty(index, parseInt(e.target.value) || 0)}
                                className="w-10 text-center text-xs sm:text-sm font-bold text-stone-900 bg-transparent border-none focus:outline-none tabular-nums"
                              />

                              <button
                                type="button"
                                onClick={() => incrementQty(index)}
                                className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs hover:bg-teal-900 active:scale-95 transition-all"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-800 font-bold underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Floating / Bottom Sticky Order Bar (With exact Total: ₹{total} and Place Order) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-stone-200 py-3.5 px-4 shadow-lg no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center relative">
              <ShoppingBag className="w-5 h-5" />
              {itemsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {itemsCount}
                </span>
              )}
            </div>
            <div>
              <div id="totalBox" className="font-display text-lg sm:text-xl font-bold text-stone-900 tabular-nums">
                Total: ₹{total}
              </div>
              <span className="text-[11px] text-stone-500">
                {itemsCount === 0
                  ? 'Add items from the menu above'
                  : `${itemsCount} ${itemsCount === 1 ? 'item' : 'items'} in order`}
              </span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || itemsCount === 0}
            className={`place-order py-3 px-6 sm:px-8 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-2 transition-all duration-200 shadow-sm cursor-pointer ${
              itemsCount > 0 && !isSubmitting
                ? 'bg-teal-800 hover:bg-teal-900 text-white hover:shadow-md active:scale-[0.99]'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
