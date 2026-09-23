export type OrderType = 'Home Delivery' | 'Dine-in';

export interface Customer {
  orderType: OrderType;
  name: string;
  mobile?: string;
  address?: string;
  tableNumber?: string;
}

export interface MenuItem {
  ItemName: string;
  Price: number | string;
  Category?: string;
  Description?: string;
  IsVeg?: boolean;
}

export interface CartItem {
  item: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface OrderData {
  customer: Customer;
  items: CartItem[];
  total: number;
  orderNumber?: string;
  timestamp?: string;
}

export type OrderStep = 'select_type' | 'customer_form' | 'menu' | 'receipt';
