import React, { useState } from 'react';
import { Order, KitchenStatus } from '../types/pos';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Utensils,
  Bell,
  RefreshCw,
  Flame,
} from 'lucide-react';

interface KitchenDisplayProps {
  orders: Order[];
  onUpdateKitchenStatus: (orderId: string, status: KitchenStatus) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  orders,
  onUpdateKitchenStatus,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'food' | 'drink'>('all');

  const kitchenOrders = orders.filter((o) => o.kitchenStatus !== 'delivered');

  const getFilteredItems = (order: Order) => {
    if (filterType === 'all') return order.items;
    if (filterType === 'food') {
      return order.items.filter((i) => i.menuItem.category === 'mon-an');
    }
    return order.items.filter((i) => i.menuItem.category === 'nuoc-uong');
  };

  const handlePlayChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported or restricted');
    }
  };

  return (
    <div className="flex-1 bg-[#F5F5F0] text-[#1A1A1A] p-4 sm:p-6 overflow-y-auto min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E0E0D6] shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-black">
              <ChefHat className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#1A1A1A] tracking-wide flex items-center gap-2">
                MÀN HÌNH ĐIỀU HÀNH BẾP & PHA CHẾ (KDS)
              </h2>
              <p className="text-xs text-[#808070] font-medium">
                Xử lý chế biến đơn hàng theo thời gian thực cho nhà bếp và quầy Bar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-xl border border-[#E0E0D6] text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-[#5A5A40] text-white'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                Tất Cả
              </button>
              <button
                onClick={() => setFilterType('food')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  filterType === 'food'
                    ? 'bg-[#5A5A40] text-white'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Bếp Món</span>
              </button>
              <button
                onClick={() => setFilterType('drink')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  filterType === 'drink'
                    ? 'bg-[#5A5A40] text-white'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Quầy Bar</span>
              </button>
            </div>

            {/* Test Sound Bell */}
            <button
              onClick={handlePlayChime}
              className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F5F5F0] text-[#5A5A40] border border-[#E0E0D6] transition-colors"
              title="Thử chuông thông báo"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Orders Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kitchenOrders.map((order) => {
            const items = getFilteredItems(order);
            if (items.length === 0) return null;

            const elapsedMins = Math.floor(
              (Date.now() - new Date(order.createdAt).getTime()) / 60000
            );
            const isUrgent = elapsedMins >= 10;

            let cardBorder = 'border-[#E0E0D6]';
            let headerBg = 'bg-[#FAF9F6] text-[#1A1A1A]';
            let statusBadge = 'bg-[#F5F5F0] text-[#808070] border border-[#E0E0D6]';
            let statusText = 'Đang Chờ Bếp';

            if (order.kitchenStatus === 'preparing') {
              cardBorder = 'border-[#5A5A40] shadow-md';
              headerBg = 'bg-[#5A5A40] text-white';
              statusBadge = 'bg-white text-[#5A5A40]';
              statusText = 'Đang Chế Biến 🍳';
            } else if (order.kitchenStatus === 'ready') {
              cardBorder = 'border-emerald-700 shadow-md';
              headerBg = 'bg-emerald-700 text-white';
              statusBadge = 'bg-white text-emerald-800';
              statusText = 'Sẵn Sàng Giao 🔔';
            }

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden flex flex-col justify-between shadow-2xs transition-all ${cardBorder}`}
              >
                {/* Header */}
                <div>
                  <div className={`p-3.5 flex items-center justify-between ${headerBg}`}>
                    <div>
                      <h3 className="font-bold text-sm uppercase flex items-center gap-1.5">
                        {order.tableName || `Mang Về #${order.id.slice(-4)}`}
                      </h3>
                      <p className="text-[10px] opacity-80 font-medium">
                        Mã đơn: {order.id} • {order.cashierName.split(' ')[0]}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge}`}
                      >
                        {statusText}
                      </span>
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1 mt-1 ${
                          isUrgent ? 'text-rose-700 font-extrabold animate-pulse' : 'opacity-90'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMins} phút trước</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-3.5 space-y-3 divide-y divide-[#E0E0D6]/60">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-bold text-[#1A1A1A] text-sm">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {item.selectedModifiers.map((m, idx) => (
                              <p key={idx} className="text-[11px] text-[#5A5A40] font-medium pl-2">
                                • {m.groupTitle}: <span className="font-bold">{m.optionName}</span>
                              </p>
                            ))}
                            {item.itemNote && (
                              <p className="text-[11px] text-rose-700 italic font-semibold pl-2 mt-0.5">
                                Ghi chú: {item.itemNote}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Controls */}
                <div className="p-3 bg-[#FAF9F6] border-t border-[#E0E0D6] space-y-2">
                  {order.customerNote && (
                    <p className="text-[10px] text-[#5A5A40] bg-[#F5F5F0] p-1.5 rounded-lg border border-[#E0E0D6] font-medium">
                      Note: {order.customerNote}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {order.kitchenStatus === 'pending' && (
                      <button
                        onClick={() => {
                          onUpdateKitchenStatus(order.id, 'preparing');
                          handlePlayChime();
                        }}
                        className="col-span-2 py-2.5 px-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-4 h-4" />
                        <span>BẮT ĐẦU CHẾ BIẾN</span>
                      </button>
                    )}

                    {order.kitchenStatus === 'preparing' && (
                      <button
                        onClick={() => {
                          onUpdateKitchenStatus(order.id, 'ready');
                          handlePlayChime();
                        }}
                        className="col-span-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>HOÀN TẤT MÓN 🔔</span>
                      </button>
                    )}

                    {order.kitchenStatus === 'ready' && (
                      <button
                        onClick={() => onUpdateKitchenStatus(order.id, 'delivered')}
                        className="col-span-2 py-2.5 px-3 rounded-xl bg-[#2C2C24] hover:bg-[#3E3E34] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>ĐÃ GIAO PHỤC VỤ KHÁCH</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {kitchenOrders.length === 0 && (
            <div className="col-span-full py-20 text-center text-[#808070] space-y-3 bg-white rounded-2xl border border-[#E0E0D6]">
              <ChefHat className="w-16 h-16 mx-auto stroke-1 text-[#808070]" />
              <h3 className="font-bold text-base text-[#1A1A1A]">Không Có Món Đang Chờ Bếp!</h3>
              <p className="text-xs text-[#808070] max-w-sm mx-auto">
                Tất cả đơn hàng đã được chế biến và giao cho khách hàng hoàn tất.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
