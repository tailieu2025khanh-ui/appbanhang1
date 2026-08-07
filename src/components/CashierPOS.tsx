import React, { useState } from 'react';
import {
  MenuItem,
  CategoryType,
  CartItem,
  OrderType,
  Table,
  ModifierGroup,
  SelectedModifier,
} from '../types/pos';
import { ModifierModal } from './ModifierModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Coffee,
  Sparkles,
  Layers,
  Send,
  CreditCard,
  Percent,
  Edit2,
  Tag,
  ShoppingBag,
  MapPin,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface CashierPOSProps {
  menuItems: MenuItem[];
  modifierGroups: ModifierGroup[];
  tables: Table[];
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  vatPercent: number;
  setVatPercent: (percent: number) => void;
  customerNote: string;
  setCustomerNote: (note: string) => void;
  onSendToKitchen: () => void;
  onOpenPayment: () => void;
  onOpenTableSelector: () => void;
}

export const CashierPOS: React.FC<CashierPOSProps> = ({
  menuItems,
  modifierGroups,
  tables,
  cartItems,
  setCartItems,
  selectedTable,
  setSelectedTable,
  orderType,
  setOrderType,
  discountPercent,
  setDiscountPercent,
  vatPercent,
  setVatPercent,
  customerNote,
  setCustomerNote,
  onSendToKitchen,
  onOpenPayment,
  onOpenTableSelector,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modifier Modal state
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Filter Categories
  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Tất Cả Món', icon: <Layers className="w-4 h-4" /> },
    { id: 'bestseller', label: 'Bán Chạy 🔥', icon: <Flame className="w-4 h-4 text-amber-600" /> },
    { id: 'nuoc-uong', label: 'Nước Uống', icon: <Coffee className="w-4 h-4 text-[#5A5A40]" /> },
    { id: 'mon-an', label: 'Món Ăn', icon: <Utensils className="w-4 h-4 text-[#5A5A40]" /> },
    { id: 'combo', label: 'Combo Món', icon: <Sparkles className="w-4 h-4 text-[#5A5A40]" /> },
  ];

  // Derive available subcategories based on current category filter
  const availableSubcategories = Array.from(
    new Set(
      menuItems
        .filter((item) => {
          if (selectedCategory === 'all') return true;
          if (selectedCategory === 'bestseller') return item.isBestSeller;
          return item.category === selectedCategory;
        })
        .map((item) => item.subcategory)
        .filter(Boolean)
    )
  ) as string[];

  // Filtered Menu Items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory === 'bestseller' && !item.isBestSeller) return false;
    if (
      selectedCategory !== 'all' &&
      selectedCategory !== 'bestseller' &&
      item.category !== selectedCategory
    ) {
      return false;
    }
    if (selectedSubcategory !== 'all' && item.subcategory !== selectedSubcategory) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  // Handle Item Click (Open modal or direct add)
  const handleItemClick = (item: MenuItem) => {
    if (!item.isAvailable) return;
    const hasModifiers = item.modifierGroupIds && item.modifierGroupIds.length > 0;

    if (hasModifiers) {
      setModalItem(item);
      setEditingCartItem(null);
    } else {
      const existingIdx = cartItems.findIndex(
        (ci) => ci.menuItem.id === item.id && ci.selectedModifiers.length === 0
      );
      if (existingIdx >= 0) {
        const updated = [...cartItems];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].totalPrice =
          updated[existingIdx].quantity * updated[existingIdx].unitPrice;
        setCartItems(updated);
      } else {
        const newItem: CartItem = {
          cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          menuItem: item,
          quantity: 1,
          selectedModifiers: [],
          itemNote: '',
          unitPrice: item.price,
          totalPrice: item.price,
        };
        setCartItems([...cartItems, newItem]);
      }
    }
  };

  const handleModalConfirm = (
    selectedModifiers: SelectedModifier[],
    note: string,
    quantity: number
  ) => {
    if (editingCartItem) {
      const modifierTotalPrice = selectedModifiers.reduce((acc, curr) => acc + curr.price, 0);
      const unitPrice = editingCartItem.menuItem.price + modifierTotalPrice;
      const updated = cartItems.map((ci) =>
        ci.cartItemId === editingCartItem.cartItemId
          ? {
              ...ci,
              selectedModifiers,
              itemNote: note,
              quantity,
              unitPrice,
              totalPrice: unitPrice * quantity,
            }
          : ci
      );
      setCartItems(updated);
    } else if (modalItem) {
      const modifierTotalPrice = selectedModifiers.reduce((acc, curr) => acc + curr.price, 0);
      const unitPrice = modalItem.price + modifierTotalPrice;
      const newItem: CartItem = {
        cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        menuItem: modalItem,
        quantity,
        selectedModifiers,
        itemNote: note,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };
      setCartItems([...cartItems, newItem]);
    }
    setModalItem(null);
    setEditingCartItem(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.cartItemId === cartItemId) {
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
      .filter(Boolean) as CartItem[];

    setCartItems(updated);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = Math.round((afterDiscount * vatPercent) / 100);
  const grandTotal = afterDiscount + vatAmount;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-[#F5F5F0]">
      {/* Left Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-[#E0E0D6]">
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-3.5 border-b border-[#E0E0D6] space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#808070]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên món hoặc mã SKU (Phở, Cà phê, DRK01)..."
                className="w-full text-xs font-medium pl-9 pr-8 py-2.5 rounded-xl border border-[#E0E0D6] focus:outline-hidden focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] bg-[#FAF9F6]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-[#808070] hover:text-[#1A1A1A] font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Main Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedSubcategory('all');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-white border border-[#E0E0D6] text-[#5A5A40] hover:bg-[#F0F0E8]'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subcategory Chips */}
          {availableSubcategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none pt-0.5">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  selectedSubcategory === 'all'
                    ? 'bg-[#2C2C24] text-white'
                    : 'bg-white border border-[#E0E0D6] text-[#808070] hover:bg-[#F0F0E8]'
                }`}
              >
                Tất cả nhóm
              </button>
              {availableSubcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                    selectedSubcategory === sub
                      ? 'bg-[#2C2C24] text-white'
                      : 'bg-white border border-[#E0E0D6] text-[#808070] hover:bg-[#F0F0E8]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Touch Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredItems.map((item) => {
            const hasModifiers = item.modifierGroupIds && item.modifierGroupIds.length > 0;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={!item.isAvailable}
                className={`group relative flex flex-col bg-white rounded-2xl border border-[#E0E0D6] p-3 text-left overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer ${
                  !item.isAvailable
                    ? 'opacity-60 bg-[#FAF9F6] border-[#E0E0D6] cursor-not-allowed'
                    : 'hover:border-[#5A5A40] active:scale-[0.98]'
                }`}
              >
                {/* Image & Badges */}
                <div className="relative w-full aspect-square bg-[#F5F5F0] rounded-xl mb-2.5 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.isBestSeller && (
                    <span className="absolute top-2 left-2 bg-[#5A5A40] text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300" />
                      HOT
                    </span>
                  )}
                  {hasModifiers && (
                    <span className="absolute bottom-2 right-2 bg-[#2C2C24]/80 backdrop-blur-xs text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                      + Tùy chọn
                    </span>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-[#2C2C24]/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-rose-700 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg uppercase shadow-md">
                        Tạm Hết Hàng
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] text-[#808070] font-semibold mb-0.5">
                      <span>{item.sku}</span>
                      <span className="truncate">{item.subcategory}</span>
                    </div>
                    <h4 className="font-bold text-[#1A1A1A] text-xs leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-[#F0F0E8]">
                    <span className="font-bold text-[#5A5A40] text-xs sm:text-sm">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-[#F5F5F0] group-hover:bg-[#5A5A40] text-[#5A5A40] group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#808070] space-y-2">
              <Utensils className="w-10 h-10 mx-auto stroke-1" />
              <p className="font-semibold text-sm">Không tìm thấy món phù hợp!</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSearchQuery('');
                }}
                className="text-xs text-[#5A5A40] font-bold underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Order Cart Panel */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-white flex flex-col h-full border-t lg:border-t-0 border-[#E0E0D6] shadow-md">
        {/* Order Header Info */}
        <div className="p-4 bg-[#FAF9F6] border-b border-[#E0E0D6] space-y-2.5">
          {/* Order Type Switcher */}
          <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-xl border border-[#E0E0D6]">
            <button
              onClick={() => setOrderType('table')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                orderType === 'table'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#808070] hover:text-[#1A1A1A]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Tại Bàn</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                orderType === 'takeaway'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#808070] hover:text-[#1A1A1A]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Mang Về</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                orderType === 'delivery'
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'text-[#808070] hover:text-[#1A1A1A]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Giao Hàng</span>
            </button>
          </div>

          {/* Table Selector Trigger */}
          {orderType === 'table' && (
            <button
              onClick={onOpenTableSelector}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#F5F5F0] border border-[#E0E0D6] text-[#5A5A40] text-xs font-bold transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>
                  {selectedTable ? `Đang chọn: ${selectedTable.name} (${selectedTable.zone})` : 'Chưa chọn bàn - Nhấn để chọn'}
                </span>
              </div>
              <span className="text-[10px] uppercase bg-[#5A5A40]/10 px-2 py-0.5 rounded text-[#5A5A40]">
                Đổi Bàn
              </span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cartItems.map((item) => (
            <div key={item.cartItemId} className="p-3 bg-[#F5F5F0] rounded-xl border border-[#E0E0D6]/60 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-[#1A1A1A] text-sm leading-tight">
                    {item.menuItem.name}
                  </h5>
                  <p className="text-xs font-bold text-[#5A5A40] mt-0.5">
                    {item.unitPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-[#E0E0D6]">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="w-6 h-6 rounded bg-[#F5F5F0] hover:bg-[#E0E0D6] text-[#1A1A1A] flex items-center justify-center text-xs font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-xs text-[#1A1A1A]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="w-6 h-6 rounded bg-[#5A5A40] hover:bg-[#4A4A34] text-white flex items-center justify-center text-xs font-bold"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Item Total Price */}
                <div className="text-right min-w-[70px]">
                  <span className="font-bold text-[#1A1A1A] text-sm block">
                    {item.totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, -item.quantity)}
                    className="text-[#808070] hover:text-rose-600 p-0.5 transition-colors inline-block"
                    title="Xóa món"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Modifiers & Note Badges */}
              {(item.selectedModifiers.length > 0 || item.itemNote) && (
                <div className="bg-white p-2 rounded-lg border border-[#E0E0D6] text-[11px] space-y-0.5">
                  {item.selectedModifiers.map((mod, idx) => (
                    <div key={idx} className="text-[#808070] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]"></span>
                      <span>{mod.groupTitle}:</span>
                      <span className="font-semibold text-[#1A1A1A]">{mod.optionName}</span>
                      {mod.price > 0 && (
                        <span className="text-[#5A5A40] font-bold">
                          (+{mod.price.toLocaleString('vi-VN')}đ)
                        </span>
                      )}
                    </div>
                  ))}
                  {item.itemNote && (
                    <div className="text-[#5A5A40] font-medium italic flex items-center gap-1">
                      <Edit2 className="w-2.5 h-2.5 text-[#5A5A40]" />
                      <span>{item.itemNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {cartItems.length === 0 && (
            <div className="py-16 text-center text-[#808070] space-y-2">
              <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-[#808070]" />
              <p className="font-bold text-xs text-[#1A1A1A]">Giỏ hàng đang trống!</p>
              <p className="text-[11px] text-[#808070] max-w-[200px] mx-auto">
                Chạm vào các món trong thực đơn bên trái để tạo đơn hàng mới.
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals & Discount Controls */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0D6] space-y-2.5 text-xs">
          {/* Note Input */}
          <input
            type="text"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder="Ghi chú tổng cho toàn bộ đơn hàng..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E0E0D6] bg-white focus:outline-hidden focus:border-[#5A5A40]"
          />

          {/* Subtotal */}
          <div className="flex justify-between text-[#808070] text-sm">
            <span>Tạm tính ({cartItems.reduce((s, i) => s + i.quantity, 0)} món):</span>
            <span className="font-semibold text-[#1A1A1A]">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>

          {/* Discount Quick Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 text-xs">
              <Tag className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span className="font-semibold text-[#808070]">Giảm giá:</span>
            </div>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    discountPercent === pct
                      ? 'bg-[#5A5A40] text-white'
                      : 'bg-white border border-[#E0E0D6] text-[#808070] hover:bg-[#F0F0E8]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center pt-2.5 border-t border-[#E0E0D6] text-[#2C2C24]">
            <div>
              <span className="text-xs font-bold text-[#808070] block">TỔNG TIỀN:</span>
              {discountPercent > 0 && (
                <span className="text-[10px] text-emerald-700 font-bold">
                  Đã giảm {discountAmount.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-[#2C2C24]">
              {grandTotal.toLocaleString('vi-VN')} <span className="text-sm font-medium">đ</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onSendToKitchen}
              disabled={cartItems.length === 0}
              className="py-3 px-3 rounded-xl bg-[#2C2C24] hover:bg-[#3E3E34] text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Send className="w-4 h-4 text-[#D6D6C2]" />
              <span>Báo Bếp / Bar</span>
            </button>

            <button
              onClick={onOpenPayment}
              disabled={cartItems.length === 0}
              className="py-3 px-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] active:scale-[0.98] text-white font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-md"
            >
              <CreditCard className="w-4 h-4" />
              <span>THANH TOÁN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modifier Customization Modal */}
      {modalItem && (
        <ModifierModal
          item={modalItem}
          modifierGroups={modifierGroups}
          isOpen={!!modalItem}
          onClose={() => {
            setModalItem(null);
            setEditingCartItem(null);
          }}
          onConfirm={handleModalConfirm}
          initialModifiers={editingCartItem?.selectedModifiers}
          initialNote={editingCartItem?.itemNote}
          initialQuantity={editingCartItem?.quantity || 1}
        />
      )}
    </div>
  );
};
