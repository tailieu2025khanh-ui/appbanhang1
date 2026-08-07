import React, { useState } from 'react';
import { MenuItem, ModifierGroup, SelectedModifier } from '../types/pos';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem;
  modifierGroups: ModifierGroup[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedModifiers: SelectedModifier[], note: string, quantity: number) => void;
  initialModifiers?: SelectedModifier[];
  initialNote?: string;
  initialQuantity?: number;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({
  item,
  modifierGroups,
  isOpen,
  onClose,
  onConfirm,
  initialModifiers = [],
  initialNote = '',
  initialQuantity = 1,
}) => {
  if (!isOpen) return null;

  const applicableGroups = modifierGroups.filter((group) =>
    item.modifierGroupIds?.includes(group.id)
  );

  const [selectedModifiersState, setSelectedModifiersState] = useState<SelectedModifier[]>(initialModifiers);
  const [note, setNote] = useState(initialNote);
  const [quantity, setQuantity] = useState(initialQuantity);

  const isSelected = (groupId: string, optionName: string) => {
    return selectedModifiersState.some(
      (m) => m.groupId === groupId && m.optionName === optionName
    );
  };

  const handleToggleOption = (
    group: ModifierGroup,
    optionName: string,
    price: number
  ) => {
    if (group.type === 'single') {
      const filtered = selectedModifiersState.filter((m) => m.groupId !== group.id);
      setSelectedModifiersState([
        ...filtered,
        { groupId: group.id, groupTitle: group.title, optionName, price },
      ]);
    } else {
      const exists = isSelected(group.id, optionName);
      if (exists) {
        setSelectedModifiersState(
          selectedModifiersState.filter(
            (m) => !(m.groupId === group.id && m.optionName === optionName)
          )
        );
      } else {
        setSelectedModifiersState([
          ...selectedModifiersState,
          { groupId: group.id, groupTitle: group.title, optionName, price },
        ]);
      }
    }
  };

  const modifierTotalPrice = selectedModifiersState.reduce((acc, curr) => acc + curr.price, 0);
  const unitPrice = item.price + modifierTotalPrice;
  const totalPrice = unitPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E0E0D6]">
        {/* Header */}
        <div className="relative bg-[#2C2C24] text-white p-4 flex items-center gap-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-xl object-cover border-2 border-[#D6D6C2] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#5A5A40] text-white uppercase tracking-wide">
              {item.category === 'mon-an' ? 'Món Ăn' : item.category === 'nuoc-uong' ? 'Nước Uống' : 'Combo'}
            </span>
            <h3 className="text-lg font-bold truncate text-white leading-tight mt-0.5">
              {item.name}
            </h3>
            <p className="text-[#D6D6C2] font-bold text-base mt-0.5">
              {item.price.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#3E3E34] text-[#D6D6C2] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Options scrollable */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 divide-y divide-[#E0E0D6]/60">
          {applicableGroups.map((group) => (
            <div key={group.id} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5A5A40]"></span>
                  {group.title}
                </h4>
                <span className="text-xs text-[#808070] font-medium bg-[#FAF9F6] border border-[#E0E0D6] px-2 py-0.5 rounded">
                  {group.type === 'single' ? 'Chọn 1' : 'Chọn nhiều'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const active = isSelected(group.id, option.name);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleToggleOption(group, option.name, option.price)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all font-medium ${
                        active
                          ? 'border-[#5A5A40] bg-[#FAF9F6] text-[#5A5A40] font-bold shadow-2xs'
                          : 'border-[#E0E0D6] bg-white hover:border-[#5A5A40] text-[#1A1A1A]'
                      }`}
                    >
                      <span className="truncate pr-1 flex items-center gap-1.5">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                            active ? 'bg-[#5A5A40] text-white' : 'border border-[#E0E0D6]'
                          }`}
                        >
                          {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        {option.name}
                      </span>
                      {option.price > 0 && (
                        <span className="text-[#5A5A40] font-bold shrink-0">
                          +{option.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Ghi chú đặc biệt */}
          <div className="pt-4">
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              Ghi chú cho bếp / pha chế:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ít ngọt, mang ly riêng, ít hành, cay vừa..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E0E0D6] bg-[#FAF9F6] focus:outline-hidden focus:border-[#5A5A40]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0D6] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white border border-[#E0E0D6] rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-[#FAF9F6] hover:bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center font-bold text-sm transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-[#1A1A1A] text-sm">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A34] text-white flex items-center justify-center font-bold text-sm transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onConfirm(selectedModifiersState, note, quantity)}
            className="flex-1 py-3 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-sm shadow-xs transition-all flex items-center justify-between"
          >
            <span>Thêm Vào Đơn</span>
            <span className="bg-black/20 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">
              {totalPrice.toLocaleString('vi-VN')} đ
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
