import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  Table as TableIcon,
  User,
  Phone,
  FileText,
  Tag,
  Check,
  Flame,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  MenuItem,
  CartItem,
  CategoryId,
  OrderType,
  PaymentMethod,
  Table,
  StoreConfig,
  Order,
  CartOptionChoice,
} from '../types';
import { formatVND } from '../utils/printer';
import { AIAssistantWidget } from './AIAssistantWidget';
import { SpinWheelModal } from './SpinWheelModal';

interface POSOrderViewProps {
  menuItems: MenuItem[];
  tables: Table[];
  config: StoreConfig;
  onCompleteOrder: (order: Order, printReceipt: boolean) => void;
  selectedTableId?: string;
  onClearSelectedTable?: () => void;
}

export const POSOrderView: React.FC<POSOrderViewProps> = ({
  menuItems,
  tables,
  config,
  onCompleteOrder,
  selectedTableId,
  onClearSelectedTable,
}) => {
  // State
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all' | 'bestseller'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Order Details State
  const [orderType, setOrderType] = useState<OrderType>('at_table');
  const [tableId, setTableId] = useState<string>(selectedTableId || 'tb1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountFlat, setDiscountFlat] = useState<number>(0);
  const [orderNote, setOrderNote] = useState('');

  // Modals
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, CartOptionChoice>>({});
  const [itemNote, setItemNote] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSpinWheelModal, setShowSpinWheelModal] = useState(false);

  // Sync tableId if passed from props
  React.useEffect(() => {
    if (selectedTableId) {
      setTableId(selectedTableId);
      setOrderType('at_table');
    }
  }, [selectedTableId]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'all'
          ? true
          : activeCategory === 'bestseller'
          ? item.isBestSeller
          : item.category === activeCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountPercent > 0) {
      return Math.round((subtotal * discountPercent) / 100);
    }
    return discountFlat;
  }, [subtotal, discountPercent, discountFlat]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const cashChange = useMemo(() => {
    if (paymentMethod !== 'cash' || typeof cashGiven !== 'number') return 0;
    return Math.max(0, cashGiven - totalAmount);
  }, [paymentMethod, cashGiven, totalAmount]);

  // Handle Add To Cart
  const handleAddToCart = (item: MenuItem) => {
    if (item.options && item.options.length > 0) {
      // Open option modal
      setCustomizingItem(item);
      const initialChoices: Record<string, CartOptionChoice> = {};
      item.options.forEach((group) => {
        if (group.choices.length > 0) {
          initialChoices[group.id] = {
            groupName: group.name,
            choiceName: group.choices[0].name,
            priceDelta: group.choices[0].priceDelta,
          };
        }
      });
      setSelectedChoices(initialChoices);
      setItemNote('');
    } else {
      // Direct Add
      addItemToCartList(item, [], '');
    }
  };

  const addItemToCartList = (
    item: MenuItem,
    choicesList: CartOptionChoice[],
    note: string
  ) => {
    const optionsDelta = choicesList.reduce((acc, c) => acc + c.priceDelta, 0);
    const unitPrice = item.price + optionsDelta;

    const existingIndex = cart.findIndex(
      (c) =>
        c.menuItem.id === item.id &&
        c.notes === note &&
        JSON.stringify(c.selectedOptions) === JSON.stringify(choicesList)
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * unitPrice;
      setCart(updated);
    } else {
      const newCartItem: CartItem = {
        cartInstanceId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuItem: item,
        quantity: 1,
        selectedOptions: choicesList,
        notes: note,
        unitPrice,
        totalPrice: unitPrice,
      };
      setCart([...cart, newCartItem]);
    }
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    const choicesList = Object.values(selectedChoices);
    addItemToCartList(customizingItem, choicesList, itemNote);
    setCustomizingItem(null);
  };

  const handleUpdateQuantity = (cartInstanceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartInstanceId === cartInstanceId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartInstanceId: string) => {
    setCart((prev) => prev.filter((i) => i.cartInstanceId !== cartInstanceId));
  };

  const selectedTableObj = useMemo(() => {
    return tables.find((t) => t.id === tableId);
  }, [tables, tableId]);

  // Submit Order
  const handleCheckout = (printReceipt: boolean) => {
    if (cart.length === 0) {
      alert('Vui lòng chọn món vào giỏ hàng trước khi thanh toán!');
      return;
    }

    const orderId = `POS${Math.floor(1000 + Math.random() * 9000)}`;
    const nowISO = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      createdAt: nowISO,
      updatedAt: nowISO,
      items: cart,
      subtotal,
      discountAmount,
      taxAmount: 0,
      totalAmount,
      orderType,
      tableId: orderType === 'at_table' ? tableId : undefined,
      tableName: orderType === 'at_table' ? selectedTableObj?.name || 'Bàn ' : undefined,
      customerName,
      customerPhone,
      paymentMethod,
      paymentStatus: 'paid',
      orderStatus: 'pending', // Sent to KDS
      cashGiven: paymentMethod === 'cash' && typeof cashGiven === 'number' ? cashGiven : undefined,
      cashChange: paymentMethod === 'cash' ? cashChange : undefined,
      notes: orderNote,
    };

    onCompleteOrder(newOrder, printReceipt);

    // Reset Cart & Form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashGiven('');
    setDiscountPercent(0);
    setDiscountFlat(0);
    setOrderNote('');
    if (onClearSelectedTable) onClearSelectedTable();
  };

  // Generate VietQR URL
  const vietQrUrl = useMemo(() => {
    const bankId = config.bankId || 'MBBank';
    const acc = config.bankAccount || '0905123456';
    const name = encodeURIComponent(config.bankAccountName || 'CHA CHI BAP');
    const info = encodeURIComponent(`CHA CHI BAP TT BAN ${selectedTableObj?.name || 'POS'}`);
    return `https://img.vietqr.io/image/${bankId}-${acc}-compact2.png?amount=${totalAmount}&addInfo=${info}&accountName=${name}`;
  }, [config, totalAmount, selectedTableObj]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-[#FFFBF0] overflow-hidden">
      {/* LEFT PANEL: Menu Catalog & Selection (Flex-1) */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto border-r-2 border-[#1A1A1A]">
        {/* Search & Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Tìm món (Chả giò bắp, Trà tắc, Nem nướng...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border-2 border-[#1A1A1A] text-sm font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] shadow-[3px_3px_0px_0px_#1A1A1A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 hover:text-[#FF6B35]"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="text-xs text-stone-700 font-extrabold bg-white px-3 py-2 rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
            Hiển thị <span className="font-black text-[#FF6B35]">{filteredItems.length}</span> món
          </div>
        </div>

        {/* AI Recommendation Widget */}
        <div className="mb-4">
          <AIAssistantWidget
            mode="pos"
            cartItems={cart}
            allMenuItems={menuItems}
            onAddToCart={(item) => handleAddToCart(item)}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0 no-scrollbar">
          {[
            { id: 'all', label: 'Tất Cả Món', icon: '🍽️' },
            { id: 'bestseller', label: 'Bán Chạy 🔥', icon: '⭐' },
            { id: 'mon_an', label: 'Món Ăn', icon: '🌽' },
            { id: 'nuoc_uong', label: 'Nước Uống', icon: '🥤' },
            { id: 'combo', label: 'Combo Món', icon: '🍱' },
            { id: 'extra', label: 'Topping / Extra', icon: '🥗' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#FFF4E0] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAddToCart(item)}
              className="bg-white rounded-3xl border-2 border-[#1A1A1A] overflow-hidden shadow-[5px_5px_0px_0px_#1A1A1A] hover:shadow-[7px_7px_0px_0px_#FF6B35] transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group relative"
            >
              {/* Product Image & Badges */}
              <div className="relative aspect-[4/3] bg-[#FFFBF0] overflow-hidden border-b-2 border-[#1A1A1A]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {item.isBestSeller && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B35] text-white font-black text-[10px] uppercase border border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-white" /> Best Seller
                    </span>
                  )}
                  {item.category === 'combo' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#7DBE52] text-white font-black border border-[#1A1A1A] text-[10px] shadow-[2px_2px_0px_0px_#1A1A1A]">
                      Tiết Kiệm
                    </span>
                  )}
                </div>

                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center text-white font-black text-xs uppercase">
                    Hết Hàng
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-[#1A1A1A] text-xs sm:text-sm line-clamp-1 group-hover:text-[#FF6B35] transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] text-stone-600 line-clamp-2 mt-0.5 font-medium">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-black text-[#FF6B35] text-sm sm:text-base">
                    {formatVND(item.price)}
                  </span>
                  <button className="w-8 h-8 rounded-xl bg-[#F2A900] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] group-hover:bg-[#FF6B35] group-hover:text-white flex items-center justify-center transition-all">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Cart & Order Register (380px) */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col border-l-4 border-[#1A1A1A] shadow-[-6px_0px_0px_0px_rgba(26,26,26,0.1)] shrink-0 h-full overflow-y-auto">
        {/* Cart Header */}
        <div className="p-4 border-b-2 border-[#FF6B35] bg-[#1A1A1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#F2A900]" />
            <h2 className="font-black text-base uppercase tracking-tight">Đơn Bán Hàng</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-[#FF6B35] hover:underline flex items-center gap-1 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
            </button>
          )}
        </div>

        {/* Order Setup (Type & Table Selector) */}
        <div className="p-3.5 bg-[#FFFBF0] border-b-2 border-[#1A1A1A] space-y-3 text-xs">
          {/* Order Type Toggle */}
          <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] font-extrabold">
            <button
              onClick={() => setOrderType('at_table')}
              className={`py-1.5 rounded-xl transition-all ${
                orderType === 'at_table'
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] hover:bg-[#FFF4E0]'
              }`}
            >
              Tại Bàn
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`py-1.5 rounded-xl transition-all ${
                orderType === 'takeaway'
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] hover:bg-[#FFF4E0]'
              }`}
            >
              Mang Về
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`py-1.5 rounded-xl transition-all ${
                orderType === 'delivery'
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] hover:bg-[#FFF4E0]'
              }`}
            >
              Giao Hàng
            </button>
          </div>

          {/* Table Selector if At Table */}
          {orderType === 'at_table' && (
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#FF6B35] shrink-0" />
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl py-1.5 px-2.5 font-extrabold text-[#1A1A1A] focus:ring-2 focus:ring-[#FF6B35] shadow-[2px_2px_0px_0px_#1A1A1A]"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.section}) - {t.status === 'occupied' ? 'Đang có khách' : 'Bàn trống'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Tên khách hàng"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-bold"
              />
            </div>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 divide-y-2 divide-stone-100">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-extrabold text-[#1A1A1A]">Giỏ hàng đang trống</p>
              <p className="text-xs text-stone-500 mt-1">Chọn món bên trái để tạo đơn hàng</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartInstanceId} className="pt-2.5 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-extrabold text-[#1A1A1A] text-xs">{item.menuItem.name}</h4>
                    {item.selectedOptions.length > 0 && (
                      <div className="text-[10px] text-stone-600 mt-0.5 space-y-0.5 font-medium">
                        {item.selectedOptions.map((opt, idx) => (
                          <p key={idx}>
                            + {opt.groupName}: <span className="font-bold text-[#1A1A1A]">{opt.choiceName}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[10px] font-bold text-[#FF6B35] mt-0.5">Note: {item.notes}</p>
                    )}
                    <span className="text-xs font-black text-[#FF6B35] mt-1 inline-block">
                      {formatVND(item.unitPrice)}
                    </span>
                  </div>

                  {/* Quantity & Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.cartInstanceId, -1)}
                      className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 border border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] font-black"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-black text-xs text-[#1A1A1A]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.cartInstanceId, 1)}
                      className="w-6 h-6 rounded-lg bg-[#F2A900] border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center font-black"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveCartItem(item.cartInstanceId)}
                      className="w-6 h-6 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Note Input */}
        {cart.length > 0 && (
          <div className="px-3.5 py-2 border-t-2 border-[#1A1A1A] bg-[#FFFBF0]">
            <input
              type="text"
              placeholder="Ghi chú chung đơn hàng (ví dụ: Mang về gấp, không hành...)"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border-2 border-[#1A1A1A] rounded-xl bg-white font-medium"
            />
          </div>
        )}

        {/* Payment Summary Footer */}
        <div className="p-4 border-t-4 border-[#FF6B35] bg-[#1A1A1A] text-white space-y-3">
          {/* Summary Breakdown */}
          <div className="space-y-1 text-xs text-stone-300">
            <div className="flex justify-between font-bold">
              <span>Tạm tính:</span>
              <span>{formatVND(subtotal)}</span>
            </div>

            {/* Discount Inputs & Spin Wheel Button */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="flex items-center gap-1 text-[#F2A900] font-bold">
                <Tag className="w-3.5 h-3.5" /> Giảm giá:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSpinWheelModal(true)}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-all active:scale-95"
                  title="Quay thưởng may mắn cho khách hàng"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Vòng Quay May Mắn</span>
                </button>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  value={discountPercent || ''}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    setDiscountPercent(val);
                    setDiscountFlat(0);
                  }}
                  className="w-12 px-1 py-0.5 text-center bg-stone-900 border border-stone-600 rounded-lg text-white font-extrabold"
                />
                <span className="text-stone-300 font-bold">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-black text-[#F2A900] pt-2 border-t border-stone-800">
              <span>TỔNG THANH TOÁN:</span>
              <span className="text-lg text-[#F2A900] font-black">{formatVND(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5 text-xs font-black">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 px-2 rounded-2xl border-2 border-[#1A1A1A] flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-[#F2A900] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tiền Mặt</span>
            </button>
            <button
              onClick={() => {
                setPaymentMethod('transfer');
                setShowQRModal(true);
              }}
              className={`py-2 px-2 rounded-2xl border-2 border-[#1A1A1A] flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'transfer'
                  ? 'bg-[#F2A900] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Mã VietQR</span>
            </button>
            <button
              onClick={() => setPaymentMethod('e_wallet')}
              className={`py-2 px-2 rounded-2xl border-2 border-[#1A1A1A] flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'e_wallet'
                  ? 'bg-[#F2A900] text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Ví Điện Tử</span>
            </button>
          </div>

          {/* Cash Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="bg-stone-900 p-2.5 rounded-2xl space-y-1.5 text-xs border border-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-stone-300 font-bold">Khách đưa:</span>
                <input
                  type="number"
                  placeholder={totalAmount.toString()}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value ? Number(e.target.value) : '')}
                  className="w-28 px-2 py-1 bg-black border border-stone-600 rounded-lg text-right font-black text-[#F2A900] text-xs"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1 text-[10px]">
                {[totalAmount, 50000, 100000, 200000, 500000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setCashGiven(val)}
                    className="flex-1 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-extrabold rounded-lg border border-stone-700"
                  >
                    {val === totalAmount ? 'Đủ' : `${val / 1000}k`}
                  </button>
                ))}
              </div>

              {typeof cashGiven === 'number' && cashGiven >= totalAmount && (
                <div className="flex justify-between items-center text-xs font-black text-[#7DBE52] pt-1 border-t border-stone-800">
                  <span>Tiền thối lại:</span>
                  <span>{formatVND(cashChange)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#FF5514] disabled:bg-stone-800 disabled:text-stone-600 text-white font-black rounded-2xl text-sm border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#F2A900] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
            >
              <Printer className="w-5 h-5 stroke-[2.5]" />
              <span>Thanh Toán & In 2 Bill (Khách + Bếp)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ITEM CUSTOMIZATION MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">{customizingItem.name}</h3>
                <p className="text-xs text-amber-600 font-bold">{formatVND(customizingItem.price)}</p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option Choices */}
            {customizingItem.options?.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {group.name}
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.choices.map((choice) => {
                    const isSelected =
                      selectedChoices[group.id]?.choiceName === choice.name;
                    return (
                      <button
                        key={choice.id}
                        onClick={() =>
                          setSelectedChoices((prev) => ({
                            ...prev,
                            [group.id]: {
                              groupName: group.name,
                              choiceName: choice.name,
                              priceDelta: choice.priceDelta,
                            },
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-bold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <span>{choice.name}</span>
                        {choice.priceDelta > 0 && (
                          <span className="text-amber-600 font-extrabold">
                            +{formatVND(choice.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Custom Item Note */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Ghi chú thêm món:</label>
              <input
                type="text"
                placeholder="Ví dụ: Giòn rụm, ít ngọt, không hành..."
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs"
              />
            </div>

            <button
              onClick={handleConfirmCustomization}
              className="w-full py-3 bg-stone-900 text-amber-400 rounded-2xl font-extrabold text-sm hover:bg-stone-800 shadow-md"
            >
              Thêm Vào Giỏ
            </button>
          </div>
        </div>
      )}

      {/* VIETQR PAYMENT MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 text-center shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-stone-900 text-sm">Mã Quét Chuyển Khoản VietQR</h3>
              <button onClick={() => setShowQRModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 inline-block">
              <img
                src={vietQrUrl}
                alt="VietQR Payment Code"
                className="w-56 h-56 mx-auto object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="text-xs space-y-1 text-stone-600">
              <p>
                Số TK: <span className="font-extrabold text-stone-900">{config.bankAccount}</span> ({config.bankId})
              </p>
              <p>
                Chủ TK: <span className="font-bold text-stone-900">{config.bankAccountName}</span>
              </p>
              <p className="text-sm font-black text-amber-600 pt-1">{formatVND(totalAmount)}</p>
            </div>

            <button
              onClick={() => {
                setShowQRModal(false);
                handleCheckout(true);
              }}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-500 shadow"
            >
              Đã Nhận Tiền & In 2 Bill
            </button>
      {/* CUSTOMER SPIN WHEEL MODAL */}
      {showSpinWheelModal && (
        <SpinWheelModal
          orderSubtotal={subtotal}
          onApplyPrize={(prize) => {
            if (prize.type === 'discount_pct') {
              setDiscountPercent(prize.value);
              setDiscountFlat(0);
            } else if (prize.type === 'discount_fixed') {
              setDiscountFlat(prize.value);
              setDiscountPercent(0);
            } else if (prize.type === 'gift') {
              // Add gift item for free if matched in menu
              const giftItem = menuItems.find((m) => m.name.toLowerCase().includes('trà tắc')) || menuItems[0];
              if (giftItem) {
                handleAddToCart({
                  ...giftItem,
                  price: 0,
                  name: `${giftItem.name} (Tặng Từ Vòng Quay)`,
                });
              }
            }
          }}
          onClose={() => setShowSpinWheelModal(false)}
        />
      )}
    </div>
  );
};
