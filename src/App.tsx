/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { OrderTypeSelection } from './components/OrderTypeSelection';
import { CustomerFormStep } from './components/CustomerFormStep';
import { MenuStep } from './components/MenuStep';
import { OrderReceiptStep } from './components/OrderReceiptStep';
import {
  Customer,
  MenuItem,
  OrderData,
  OrderStep,
  OrderType
} from './types/cafe';
import {
  fetchCafeMenu,
  getSavedCustomer,
  getSavedOrder,
  saveCustomer,
  clearCafeStorage
} from './services/cafeService';

export default function App() {
  const [step, setStep] = useState<OrderStep>('select_type');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<OrderData | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Check saved state from localStorage on initial mount
  useEffect(() => {
    const savedCust = getSavedCustomer();
    const savedOrd = getSavedOrder();

    if (savedOrd && savedOrd.orderNumber) {
      setCompletedOrder(savedOrd);
      setOrderNumber(savedOrd.orderNumber);
      setStep('receipt');
    } else if (savedCust) {
      setCustomer(savedCust);
      setOrderType(savedCust.orderType);
      loadMenuData();
      setStep('menu');
    }
  }, []);

  const loadMenuData = async () => {
    setIsLoadingMenu(true);
    try {
      const items = await fetchCafeMenu();
      setMenu(items);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Step 1: selectOrder(type)
  const handleSelectOrderType = (type: OrderType) => {
    setOrderType(type);
    setStep('customer_form');
  };

  // Step 2: saveCustomer()
  const handleSaveCustomer = (customerData: Customer) => {
    setCustomer(customerData);
    saveCustomer(customerData);
    loadMenuData();
    setStep('menu');
  };

  // Step 3: placeOrder() -> onOrderSuccess
  const handleOrderSuccess = (orderData: OrderData, generatedOrderNumber: string) => {
    setCompletedOrder(orderData);
    setOrderNumber(generatedOrderNumber);
    setStep('receipt');
  };

  // Step 4: goHome()
  const handleGoHome = () => {
    clearCafeStorage();
    setOrderType(null);
    setCustomer(null);
    setCompletedOrder(null);
    setOrderNumber('');
    setStep('select_type');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F2] text-stone-800">
      {/* Navigation Header */}
      <Header
        orderType={orderType}
        onReset={handleGoHome}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step === 'select_type' && (
          <OrderTypeSelection onSelect={handleSelectOrderType} />
        )}

        {step === 'customer_form' && orderType && (
          <CustomerFormStep
            orderType={orderType}
            initialData={customer}
            onBack={() => setStep('select_type')}
            onSubmit={handleSaveCustomer}
          />
        )}

        {step === 'menu' && customer && (
          <MenuStep
            customer={customer}
            menu={menu}
            isLoadingMenu={isLoadingMenu}
            onBack={() => setStep('customer_form')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {step === 'receipt' && completedOrder && (
          <OrderReceiptStep
            orderData={completedOrder}
            orderNumber={orderNumber}
            onGoHome={handleGoHome}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-200/80 bg-white/70 text-center text-xs text-stone-500 no-print mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Musafir Cafe · All Rights Reserved</span>
          <span className="font-medium text-stone-600">
            created by -Dnyanchand Yadav
          </span>
        </div>
      </footer>
    </div>
  );
}
