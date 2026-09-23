import html2canvas from 'html2canvas';
import { Customer, MenuItem, OrderData } from '../types/cafe';

export const MENU_API = 'https://ydnyan0804.app.n8n.cloud/webhook/menu';
export const ORDER_API = 'https://ydnyan0804.app.n8n.cloud/webhook/order';

// Curated default menu from Musafir Cafe to ensure seamless experience
export const FALLBACK_MENU: MenuItem[] = [
  { ItemName: 'Musafir Special Masala Chai', Price: 40, Category: 'Hot Chai & Brews' },
  { ItemName: 'Adrak Elaichi Kadak Chai', Price: 35, Category: 'Hot Chai & Brews' },
  { ItemName: 'Special Tandoori Kulhad Chai', Price: 50, Category: 'Hot Chai & Brews' },
  { ItemName: 'Filter Coffee', Price: 60, Category: 'Hot Chai & Brews' },
  { ItemName: 'Classic Thick Cold Coffee', Price: 110, Category: 'Cold Brews & Shakes' },
  { ItemName: 'Hazelnut Iced Frappe', Price: 140, Category: 'Cold Brews & Shakes' },
  { ItemName: 'Nutella Belgian Chocolate Shake', Price: 150, Category: 'Cold Brews & Shakes' },
  { ItemName: 'Paneer Tikka Grilled Sandwich', Price: 140, Category: 'Gourmet Sandwiches' },
  { ItemName: 'Cheese Corn & Jalapeño Grilled', Price: 130, Category: 'Gourmet Sandwiches' },
  { ItemName: 'Bombay Masala Toast', Price: 110, Category: 'Gourmet Sandwiches' },
  { ItemName: 'Crispy Veg Herb Burger', Price: 90, Category: 'Burgers & Wraps' },
  { ItemName: 'Paneer Makhani Wrap', Price: 130, Category: 'Burgers & Wraps' },
  { ItemName: 'Peri-Peri Masala French Fries', Price: 110, Category: 'Snacks & Starters' },
  { ItemName: 'Garlic Cheese Toast Supreme', Price: 120, Category: 'Snacks & Starters' },
  { ItemName: 'White Sauce Penne Alfredo', Price: 170, Category: 'Italian & Mains' },
  { ItemName: 'Arrabbiata Red Sauce Pasta', Price: 160, Category: 'Italian & Mains' },
  { ItemName: 'Sizzling Hot Chocolate Brownie', Price: 140, Category: 'Desserts' }
];

export async function fetchCafeMenu(): Promise<MenuItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(MENU_API, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Unable to load menu from n8n webhook, using Musafir Cafe fallback menu:', error);
  }
  return FALLBACK_MENU;
}

export async function submitCafeOrder(orderData: OrderData): Promise<string> {
  const response = await fetch(ORDER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total
    })
  });

  if (!response.ok) {
    throw new Error(`Order webhook returned HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log('n8n order response:', result);

  const orderNumber =
    result.orderNumber ||
    result.order_number ||
    result.OrderNumber ||
    result.orderNo ||
    result.order_id ||
    result.id;

  if (!orderNumber) {
    // Generate fallback receipt ID if webhook accepted without explicit id
    return `MC-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  return String(orderNumber);
}

export function saveCustomer(customer: Customer) {
  localStorage.setItem('Musafir_customer', JSON.stringify(customer));
}

export function getSavedCustomer(): Customer | null {
  const data = localStorage.getItem('Musafir_customer');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveOrder(order: OrderData) {
  localStorage.setItem('Musafir_order', JSON.stringify(order));
}

export function getSavedOrder(): OrderData | null {
  const data = localStorage.getItem('Musafir_order');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearCafeStorage() {
  localStorage.removeItem('Musafir_customer');
  localStorage.removeItem('Musafir_order');
  sessionStorage.clear();
}

export async function captureReceiptElement(elementId: string = 'orderReceipt'): Promise<void> {
  const receipt = document.getElementById(elementId);
  if (!receipt) return;

  try {
    const canvas = await html2canvas(receipt, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `Musafir_Order_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Receipt capture error:', error);
  }
}
