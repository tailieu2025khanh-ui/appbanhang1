import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, AlertTriangle, Check, Volume2, VolumeX } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface KDSViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const KDSView: React.FC<KDSViewProps> = ({ orders, onUpdateOrderStatus }) => {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play Web Audio Chime Sound
  const playSoundChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Sound chime not allowed or supported', e);
    }
  };

  const kdsOrders = orders.filter((o) => {
    if (o.orderStatus === 'cancelled') return false;
    if (filter === 'all') return o.orderStatus !== 'completed'; // Default show active kitchen orders
    return o.orderStatus === filter;
  });

  const calculateMinutesElapsed = (createdAtStr: string): number => {
    const diff = new Date().getTime() - new Date(createdAtStr).getTime();
    return Math.floor(diff / (1000 * 60));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* KDS Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#1A1A1A] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F2A900] border-2 border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center font-black shadow-[3px_3px_0px_0px_#1A1A1A]">
            <ChefHat className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-black text-2xl text-[#1A1A1A] uppercase tracking-tight">Màn Hình Bếp (KDS)</h2>
            <p className="text-xs text-stone-600 font-bold">
              Sơ đồ chế biến món ăn thời gian thực theo thứ tự đơn hàng
            </p>
          </div>
        </div>

        {/* Filters & Sound Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border-2 border-[#1A1A1A] text-xs font-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_0px_#1A1A1A] ${
              soundEnabled
                ? 'bg-[#F2A900] text-[#1A1A1A]'
                : 'bg-white text-stone-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Âm Báo: Bật' : 'Âm Báo: Tắt'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] text-xs font-black">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl border ${
                filter === 'all'
                  ? 'bg-[#FF6B35] text-white border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF4E0]'
              }`}
            >
              Đang Chế Biến ({orders.filter((o) => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl border ${
                filter === 'pending'
                  ? 'bg-[#F2A900] text-[#1A1A1A] border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF4E0]'
              }`}
            >
              Đang Chờ
            </button>
            <button
              onClick={() => setFilter('cooking')}
              className={`px-3 py-1.5 rounded-xl border ${
                filter === 'cooking'
                  ? 'bg-[#FF6B35] text-white border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF4E0]'
              }`}
            >
              Đang Nấu
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-xl border ${
                filter === 'completed'
                  ? 'bg-[#7DBE52] text-white border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] border-transparent hover:bg-[#FFF4E0]'
              }`}
            >
              Đã Xong
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Masonry/Grid */}
      {kdsOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A]">
          <ChefHat className="w-16 h-16 mx-auto stroke-1 mb-3 text-[#FF6B35]" />
          <h3 className="font-black text-base text-[#1A1A1A]">Không có phiếu chế biến nào!</h3>
          <p className="text-xs text-stone-500 font-bold mt-1">Đơn hàng mới từ máy POS sẽ lập tức hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {kdsOrders.map((order) => {
            const minsElapsed = calculateMinutesElapsed(order.createdAt);
            const isLate = minsElapsed > 15;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border-2 border-[#1A1A1A] shadow-[5px_5px_0px_0px_#1A1A1A] overflow-hidden flex flex-col justify-between transition-all ${
                  isLate
                    ? 'ring-4 ring-[#FF6B35]'
                    : order.orderStatus === 'cooking'
                    ? 'shadow-[5px_5px_0px_0px_#FF6B35]'
                    : ''
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3.5 text-[#1A1A1A] flex items-center justify-between border-b-2 border-[#1A1A1A] ${
                    isLate
                      ? 'bg-rose-100'
                      : order.orderStatus === 'cooking'
                      ? 'bg-[#FFF4E0]'
                      : 'bg-[#FFFBF0]'
                  }`}
                >
                  <div>
                    <span className="font-black text-xs text-stone-700 uppercase">MÃ: {order.id}</span>
                    <h4 className="font-black text-[#FF6B35] text-base uppercase">
                      {order.tableName || (order.orderType === 'takeaway' ? 'MANG VỀ' : 'GIAO HÀNG')}
                    </h4>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 font-black text-xs px-2.5 py-0.5 rounded-full border border-[#1A1A1A] shadow-[1px_1px_0px_0px_#1A1A1A] ${
                        isLate
                          ? 'bg-[#FF6B35] text-white animate-bounce'
                          : 'bg-[#F2A900] text-[#1A1A1A]'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> {minsElapsed} phút
                    </span>
                    <p className="text-[10px] text-stone-600 font-bold mt-1">
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="p-4 flex-1 space-y-3 divide-y-2 divide-stone-100 overflow-y-auto max-h-80">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-2.5 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-[#1A1A1A] text-sm flex-1">
                          {item.menuItem.name}
                        </span>
                        <span className="px-2.5 py-1 bg-[#FF6B35] text-white border border-[#1A1A1A] font-black text-base rounded-xl shrink-0 shadow-[2px_2px_0px_0px_#1A1A1A]">
                          x{item.quantity}
                        </span>
                      </div>

                      {/* Options & Notes */}
                      {item.selectedOptions.length > 0 && (
                        <div className="text-xs text-stone-700 mt-1 space-y-0.5 font-bold pl-2 border-l-2 border-[#F2A900]">
                          {item.selectedOptions.map((opt, oIdx) => (
                            <p key={oIdx}>
                              ↳ {opt.groupName}: <span className="font-extrabold text-[#1A1A1A]">{opt.choiceName}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs font-black text-[#FF6B35] mt-1 bg-rose-50 p-2 rounded-xl border border-[#1A1A1A]">
                          ⚠️ NOTE: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}

                  {order.notes && (
                    <div className="pt-2 font-black text-xs text-[#1A1A1A] bg-[#FFF4E0] p-2.5 rounded-xl border-2 border-[#1A1A1A]">
                      Ghi chú đơn: {order.notes}
                    </div>
                  )}
                </div>

                {/* Ticket Workflow Actions */}
                <div className="p-3 bg-[#FFFBF0] border-t-2 border-[#1A1A1A]">
                  {order.orderStatus === 'pending' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'cooking')}
                      className="w-full py-2.5 bg-[#F2A900] hover:bg-[#E5A000] text-[#1A1A1A] border-2 border-[#1A1A1A] rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Flame className="w-4 h-4 fill-[#1A1A1A]" /> Bắt Đầu Chế Biến
                    </button>
                  )}

                  {order.orderStatus === 'cooking' && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                      className="w-full py-2.5 bg-[#7DBE52] hover:bg-[#6CAE43] text-white border-2 border-[#1A1A1A] rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Báo Xong - Trả Món
                    </button>
                  )}

                  {order.orderStatus === 'completed' && (
                    <div className="text-center font-black text-xs text-[#7DBE52] bg-emerald-50 py-2 rounded-xl border border-[#1A1A1A]">
                      ✓ Đã hoàn thành trả món
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
