export type CategoryType = 'mon-an' | 'nuoc-uong' | 'combo' | 'topping';

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  title: string; // e.g. "Mức đường", "Mức đá", "Topping", "Độ cay"
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  category: CategoryType;
  subcategory?: string;
  price: number;
  image: string;
  isAvailable: boolean;
  isBestSeller?: boolean;
  description?: string;
  modifierGroupIds?: string[]; // IDs of modifier groups applicable
}

export interface SelectedModifier {
  groupId: string;
  groupTitle: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // unique ID for specific item instance in cart
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  itemNote: string;
  unitPrice: number; // base price + modifier prices
  totalPrice: number; // unitPrice * quantity
}

export type OrderType = 'table' | 'takeaway' | 'delivery';
export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'delivered';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'momo';

export interface Order {
  id: string; // e.g., "HD-1024"
  orderCode: string;
  tableId?: string;
  tableName?: string;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  changeAmount?: number;
  kitchenStatus: KitchenStatus;
  cashierName: string;
  customerNote?: string;
  createdAt: string; // ISO string
  completedAt?: string;
}

export type TableStatus = 'empty' | 'occupied' | 'billing' | 'reserved';

export interface Table {
  id: string;
  name: string;
  zone: 'Tầng 1' | 'Sân Thượng' | 'Phòng VIP' | 'Mang Về';
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  joinedTableIds?: string[];
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  cashRevenue: number;
  transferRevenue: number;
  cardRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  closingCashCalculated: number;
  closingCashActual?: number;
  difference?: number;
  isClosed: boolean;
  note?: string;
}

export interface StoreConfig {
  storeName: string;
  address: string;
  phone: string;
  wifiName: string;
  wifiPass: string;
  taxCode: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  qrTemplate: string;
  printerType: 'usb' | 'lan' | 'bluetooth';
  printerIp: string;
  printerPort: number;
  paperSize: '80mm' | '58mm';
  autoPrintReceipt: boolean;
  printKitchenReceipt: boolean;
  printCopies?: number;
}
