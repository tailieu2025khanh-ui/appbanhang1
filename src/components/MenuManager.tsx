import React, { useState } from 'react';
import { MenuItem, CategoryType, ModifierGroup } from '../types/pos';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Flame,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface MenuManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  modifierGroups: ModifierGroup[];
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  setMenuItems,
  modifierGroups,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    sku: '',
    name: '',
    category: 'nuoc-uong',
    subcategory: 'Cà phê',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
    isAvailable: true,
    isBestSeller: false,
    description: '',
    modifierGroupIds: ['mod_sugar', 'mod_ice'],
  });

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleToggleAvailable = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) {
      setMenuItems(menuItems.filter((i) => i.id !== id));
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      sku: `SKU${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'nuoc-uong',
      subcategory: 'Cà phê',
      price: 35000,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      isBestSeller: false,
      description: '',
      modifierGroupIds: ['mod_sugar', 'mod_ice'],
    });
    setIsCreating(true);
    setEditingItem(null);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setFormData({ ...item });
    setEditingItem(item);
    setIsCreating(false);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Vui lòng điền đầy đủ tên món và đơn giá!');
      return;
    }

    if (isCreating) {
      const newItem: MenuItem = {
        id: `m_${Date.now()}`,
        sku: formData.sku || `SKU${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name || '',
        category: formData.category as CategoryType,
        subcategory: formData.subcategory || 'Chung',
        price: Number(formData.price) || 0,
        image: formData.image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80',
        isAvailable: formData.isAvailable ?? true,
        isBestSeller: formData.isBestSeller ?? false,
        description: formData.description || '',
        modifierGroupIds: formData.modifierGroupIds || [],
      };
      setMenuItems([newItem, ...menuItems]);
    } else if (editingItem) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItem.id ? ({ ...item, ...formData } as MenuItem) : item
        )
      );
    }

    setIsCreating(false);
    setEditingItem(null);
  };

  return (
    <div className="flex-1 bg-[#F5F5F0] p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-[#E0E0D6] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#5A5A40]" />
              QUẢN LÝ DANH MỤC & THỰC ĐƠN (MENU CRUD)
            </h2>
            <p className="text-xs text-[#808070] mt-0.5 font-medium">
              Thêm mới, chỉnh sửa đơn giá, bật/tắt trạng thái hết hàng của Món Ăn & Nước Uống.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>THÊM MÓN MỚI</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E0E0D6]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#808070]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên món hoặc mã SKU..."
              className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl border border-[#E0E0D6] focus:outline-hidden focus:border-[#5A5A40] bg-[#FAF9F6]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['all', 'nuoc-uong', 'mon-an', 'combo'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#5A5A40] text-white shadow-2xs'
                    : 'bg-[#FAF9F6] border border-[#E0E0D6] text-[#808070] hover:bg-[#F0F0E8]'
                }`}
              >
                {cat === 'all'
                  ? 'Tất cả món'
                  : cat === 'nuoc-uong'
                  ? 'Nước uống'
                  : cat === 'mon-an'
                  ? 'Món ăn'
                  : 'Combo'}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-2xl border border-[#E0E0D6] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0D6] text-[#808070] font-bold bg-[#FAF9F6]">
                  <th className="py-3 px-4">Ảnh & Tên Món</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4">Đơn Giá</th>
                  <th className="py-3 px-4 text-center">Trạng Thái Kho</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0D6]/60 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E0E0D6]"
                        />
                        <div>
                          <p className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5">
                            {item.name}
                            {item.isBestSeller && (
                              <span className="bg-[#5A5A40] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                HOT
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-[#808070]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#808070]">{item.sku}</td>
                    <td className="py-3 px-4">
                      <span className="bg-[#FAF9F6] border border-[#E0E0D6] text-[#1A1A1A] px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {item.category === 'mon-an'
                          ? 'Món Ăn'
                          : item.category === 'nuoc-uong'
                          ? 'Nước Uống'
                          : 'Combo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#5A5A40] text-sm">
                      {item.price.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleAvailable(item.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all inline-flex items-center gap-1 ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                            <span>Còn Bán</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-700" />
                            <span>Hết Hàng</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#F5F5F0] border border-[#E0E0D6] text-[#1A1A1A] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isCreating || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <form
            onSubmit={handleSaveItem}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 border border-[#E0E0D6]"
          >
            <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-3">
              <h3 className="font-extrabold text-base text-[#1A1A1A]">
                {isCreating ? 'THÊM MÓN MỚI VÀO THỰC ĐƠN' : `CHỈNH SỬA: ${editingItem?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                }}
                className="text-[#808070] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Tên Món (*):</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Cà Phê Muối Sài Gòn..."
                  className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium focus:outline-hidden focus:border-[#5A5A40] bg-[#FAF9F6]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Mã SKU / Code:</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium bg-[#FAF9F6]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Đơn Giá (VNĐ) (*):</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-bold text-[#5A5A40] bg-[#FAF9F6]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Nhóm Thực Thể:</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as CategoryType })
                    }
                    className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium bg-[#FAF9F6]"
                  >
                    <option value="nuoc-uong">Nước Uống</option>
                    <option value="mon-an">Món Ăn</option>
                    <option value="combo">Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">Nhóm Nhỏ (Subcategory):</label>
                  <input
                    type="text"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Cà phê, Trà sữa, Món cơm..."
                    className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium bg-[#FAF9F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Link Hình Ảnh (URL):</label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium bg-[#FAF9F6]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1A1A1A] mb-1">Mô Tả Ngắn:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-[#E0E0D6] font-medium bg-[#FAF9F6]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1A1A1A]">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller || false}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="w-4 h-4 rounded text-[#5A5A40] focus:ring-[#5A5A40]"
                  />
                  <span>Món Bán Chạy (HOT)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1A1A1A]">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable ?? true}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Sẵn Sàng Bán (In Stock)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E0D6]">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-[#E0E0D6] font-bold text-[#808070] hover:bg-[#FAF9F6] text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs shadow-md"
              >
                LƯU MÓN VÀO MENU
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
