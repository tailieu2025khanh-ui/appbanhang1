/**
 * CHA CHI BAP POS - Core Type Definitions
 */

export type CategoryId = 'mon_an' | 'nuoc_uong' | 'combo' | 'extra';

export interface OptionGroup {
  id: string;
  name: string;
  required?: boolean;
  choices: {
    id: string;
    name: string;
    priceDelta: number; // e.g. +5000 VND
  }[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: CategoryId;
  image: string;
  description?: string;
  isBestSeller?: boolean;
  isHot?: boolean;
  isAvailable: boolean;
  options?: OptionGroup[];
}

export interface CartOptionChoice {
  groupName: string;
  choiceName: string;
  priceDelta: number;
}

export interface CartItem {
  cartInstanceId: string; // Unique ID for this cart row
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: CartOptionChoice[];
  notes?: string;
  unitPrice: number; // base price + options delta
  totalPrice: number; // unitPrice * quantity
}

export type OrderType = 'at_table' | 'takeaway' | 'delivery';

export type PaymentMethod = 'cash' | 'transfer' | 'e_wallet';

export type OrderStatus = 'pending' | 'cooking' | 'completed' | 'cancelled';

export interface Order {
  id: string; // e.g., POS1001
  createdAt: string; // ISO string
  updatedAt: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  orderType: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid';
  orderStatus: OrderStatus;
  cashGiven?: number;
  cashChange?: number;
  notes?: string;
}

export type TableSection = 'Tầng 1' | 'Tầng 2' | 'Khu VIP';

export type TableStatus = 'empty' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  name: string;
  section: TableSection;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  occupiedSince?: string;
  totalAmount?: number;
}

export interface StoreConfig {
  storeName: string;
  slogan: string;
  address: string;
  hotline: string;
  wifiName: string;
  wifiPassword: string;
  bankId: string;
  bankAccount: string;
  bankAccountName: string;
  printerType: 'usb' | 'sunmi' | 'browser';
  usbVendorId?: string;
  usbProductId?: string;
  enableDualBill: boolean; // 1 Bill for customer + 1 Bill for kitchen
  paperWidth: 80 | 58;
  googleSheetWebhookUrl: string;
  googleSheetReadUrl?: string;
  autoSyncSheet: boolean;
  googleSheetAutoFetchDaily?: boolean;
  currencySymbol: string;
}

export interface DailyRevenueOnlineData {
  success: boolean;
  message: string;
  date: string;
  totalRevenue: number;
  totalOrders: number;
  lastUpdated: string;
  detailsByPaymentMethod?: {
    cash: number;
    transfer: number;
  };
}

export type ActiveTab = 'pos' | 'tables' | 'kds' | 'history' | 'menu' | 'reports' | 'settings';

