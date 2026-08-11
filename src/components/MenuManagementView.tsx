import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Flame,
  Check,
  X,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { MenuItem, CategoryId } from '../types';
import { formatVND } from '../utils/printer';
import { PINModal } from './PINModal';

interface MenuManagementViewProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (updatedItem: MenuItem) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  menuItems,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(30000);
  const [formCategory, setFormCategory] = useState<CategoryId>('mon_an');
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBestSeller, setFormBestSeller] = useState(false);
  const [formAvailable, setFormAvailable] = useState(true);

  const filteredItems = menuItems.filter((i) => {
    const matchesCat = activeCategory === 'all' || i.category === activeCategory;
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setFormName(item.name);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormImage(item.image);
    setFormDesc(item.description || '');
    setFormBestSeller(Boolean(item.isBestSeller));
    setFormAvailable(item.isAvailable);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsAddingNew(true);
    setFormName('');
    setFormPrice(35000);
    setFormCategory('mon_an');
    setFormImage('https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80');
    setFormDesc('');
    setFormBestSeller(false);
    setFormAvailable(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert('Vui lòng nhập tên món ăn!');
      return;
    }

    if (isAddingNew) {
      const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        name: formName,
        price: Number(formPrice),
        category: formCategory,
        image: formImage || 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80',
        description: formDesc,
        isBestSeller: formBestSeller,
        isAvailable: formAvailable,
      };
      onAddMenuItem(newItem);
    } else if (editingItem) {
      const updatedItem: MenuItem = {
        ...editingItem,
        name: formName,
        price: Number(formPrice),
        category: formCategory,
        image: formImage,
        description: formDesc,
        isBestSeller: formBestSeller,
        isAvailable: formAvailable,
      };
      onUpdateMenuItem(updatedItem);
    }

    setEditingItem(null);
    setIsAddingNew(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-2xl text-[#1A1A1A] uppercase tracking-tight">Quản Lý Thực Đơn (Menu)</h2>
          <p className="text-xs text-stone-600 font-bold mt-1">
            Điều chỉnh danh mục món ăn, cập nhật giá bán, trạng thái còn hàng và món Best-Seller
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#FF6B35] text-white font-black text-xs rounded-2xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] hover:bg-[#FF5514] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Thêm Món Mới
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'Tất Cả' },
            { id: 'mon_an', label: 'Món Ăn' },
            { id: 'nuoc_uong', label: 'Nước Uống' },
            { id: 'combo', label: 'Combo Món' },
            { id: 'extra', label: 'Extra / Topping' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeCategory === c.id
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'bg-white text-[#1A1A1A] border-2 border-[#1A1A1A] hover:bg-[#FFF4E0]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-[#1A1A1A] rounded-2xl text-xs font-bold shadow-[2px_2px_0px_0px_#1A1A1A]"
          />
        </div>
      </div>

      {/* Menu Catalog Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border-2 border-[#1A1A1A] overflow-hidden shadow-[4px_4px_0px_0px_#1A1A1A] flex flex-col justify-between"
          >
            <div className="relative aspect-[16/10] bg-[#FFFBF0] border-b-2 border-[#1A1A1A]">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {item.isBestSeller && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B35] text-white font-black text-[10px] uppercase border border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                    🔥 Best Seller
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-[#1A1A1A] text-sm">{item.name}</h4>
                <p className="font-black text-[#FF6B35] text-sm mt-1">{formatVND(item.price)}</p>
                {item.description && (
                  <p className="text-xs text-stone-600 font-medium line-clamp-2 mt-1">{item.description}</p>
                )}
              </div>

              {/* Quick Toggles */}
              <div className="pt-3 border-t-2 border-stone-100 mt-3 flex items-center justify-between text-xs">
                {/* Available Toggle */}
                <button
                  onClick={() =>
                    onUpdateMenuItem({ ...item, isAvailable: !item.isAvailable })
                  }
                  className={`px-2.5 py-1 rounded-xl font-black text-[11px] border border-[#1A1A1A] shadow-[1px_1px_0px_0px_#1A1A1A] ${
                    item.isAvailable
                      ? 'bg-[#7DBE52] text-white'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.isAvailable ? 'Sẵn Sàng Bán' : 'Tạm Hết Hàng'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-xl bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F2A900] shadow-[1px_1px_0px_0px_#1A1A1A]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingItemId(item.id)}
                    className="p-1.5 rounded-xl bg-white border border-[#1A1A1A] hover:bg-rose-100 text-rose-600 shadow-[1px_1px_0px_0px_#1A1A1A]"
                    title="Xóa món khỏi thực đơn (Yêu cầu PIN Quản lý)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PIN PROTECTION FOR DELETING MENU ITEM */}
      {deletingItemId && (
        <PINModal
          title="Bảo Mật PIN - Xóa Món Ăn"
          description="Vui lòng nhập mã PIN Quản Lý (Mặc định: 1234) để xác nhận xóa món khỏi thực đơn."
          onSuccess={() => {
            onDeleteMenuItem(deletingItemId);
            setDeletingItemId(null);
          }}
          onClose={() => setDeletingItemId(null)}
        />
      )}

      {/* EDIT / ADD MODAL */}
      {(editingItem || isAddingNew) && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-stone-900 text-base">
                {isAddingNew ? 'Thêm Món Mới Vào Thực Đơn' : 'Chỉnh Sửa Món Ăn'}
              </h3>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên Món (*):</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Chả Giò Bắp Quảng Ngãi"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Giá Bán (VNĐ):</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Danh Mục:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CategoryId)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="mon_an">Món Ăn</option>
                    <option value="nuoc_uong">Nước Uống</option>
                    <option value="combo">Combo Món</option>
                    <option value="extra">Extra / Topping</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">URL Hình Ảnh:</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-stone-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Mô tả ngắn:</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl h-16"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formBestSeller}
                    onChange={(e) => setFormBestSeller(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-bold text-stone-800">Món Bán Chạy (HOT 🔥)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-stone-800">Sẵn Sàng Bán</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 bg-stone-900 text-amber-400 font-extrabold text-sm rounded-2xl shadow-md hover:bg-stone-800"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
