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

export type PaymentMethod = 'UPI' | 'Cash on Delivery' | 'Pay at Counter';
export type PaymentStatus = 'Paid' | 'Pending';

export interface PaymentDetails {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentApp?: string;
  paidAt?: string;
}

export interface OrderData {
  customer: Customer;
  items: CartItem[];
  total: number;
  orderNumber?: string;
  timestamp?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  paymentApp?: string;
  payment?: PaymentDetails;
}

export type OrderStep = 'select_type' | 'customer_form' | 'menu' | 'receipt';
