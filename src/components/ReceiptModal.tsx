import React from 'react';
import { X, Printer, CheckCircle, ChefHat, Sparkles } from 'lucide-react';
import { Order, StoreConfig } from '../types';
import { formatVND } from '../utils/printer';

interface ReceiptModalProps {
  order: Order;
  config: StoreConfig;
  onClose: () => void;
  onPrintThermal: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  config,
  onClose,
  onPrintThermal,
}) => {
  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 my-8">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base">Xem Trước Hóa Đơn 2 Bill</h3>
              <p className="text-xs text-stone-500">Mã đơn: {order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Bill Previews Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* BILL 1: Customer Receipt */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-300 font-mono text-stone-900 space-y-2.5 shadow-inner">
            <div className="text-center space-y-0.5 border-b pb-2 border-stone-300">
              <p className="font-extrabold text-sm uppercase">{config.storeName}</p>
              <p className="text-[10px] text-stone-600">{config.slogan}</p>
              <p className="text-[10px] text-stone-600">{config.address}</p>
              <p className="text-[10px] font-bold text-amber-700">Hotline: {config.hotline}</p>
            </div>

            <div className="text-center py-1">
              <p className="font-extrabold text-xs">HÓA ĐƠN THANH TOÁN</p>
              <p className="text-[10px] text-stone-500">Mã: {order.id}</p>
              <p className="text-[10px] text-stone-500">
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
              <p className="text-[10px] font-bold">
                Vị trí: {order.tableName || (order.orderType === 'takeaway' ? 'Mang Về' : 'Giao Hàng')}
              </p>
            </div>

            <div className="border-t border-b border-stone-300 py-1.5 space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="flex-1 pr-2">
                    <p className="font-bold">{item.menuItem.name}</p>
                    <p className="text-[9px] text-stone-500">
                      {formatVND(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-bold">{formatVND(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span>-{formatVND(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-stone-300">
                <span>TỔNG CỘNG:</span>
                <span className="text-amber-700">{formatVND(order.totalAmount)}</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-stone-300 text-[10px] text-stone-500">
              <p>Wi-Fi: {config.wifiName} | Pass: {config.wifiPassword}</p>
              <p className="font-bold mt-1 text-stone-800">Cảm ơn & Hẹn gặp lại quý khách!</p>
            </div>
          </div>

          {/* BILL 2: Kitchen Ticket */}
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400 font-mono text-stone-900 space-y-2.5 shadow-inner">
            <div className="text-center border-b pb-2 border-amber-300">
              <p className="font-extrabold text-sm uppercase text-amber-900 flex items-center justify-center gap-1">
                <ChefHat className="w-4 h-4" /> *** PHIẾU BẾP ***
              </p>
              <p className="font-black text-base text-stone-900">MÃ: {order.id}</p>
              <p className="font-extrabold text-xs text-amber-800">
                VỊ TRÍ: {order.tableName || (order.orderType === 'takeaway' ? 'MANG VỀ' : 'GIAO HÀNG')}
              </p>
              <p className="text-[10px] text-stone-600">
                Giờ tạo: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
              </p>
            </div>

            <div className="border-t border-b border-amber-300 py-2 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-amber-200/60 pb-1.5 last:border-0">
                  <div className="flex-1 pr-2">
                    <p className="font-black text-stone-900">{item.menuItem.name}</p>
                    {item.selectedOptions.map((o, oIdx) => (
                      <p key={oIdx} className="text-[10px] text-stone-600">
                        ↳ {o.choiceName}
                      </p>
                    ))}
                    {item.notes && (
                      <p className="text-[10px] font-bold text-rose-600">Note: {item.notes}</p>
                    )}
                  </div>
                  <span className="font-black text-base bg-stone-900 text-amber-400 px-2 py-0.5 rounded">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {order.notes && (
              <p className="text-[10px] font-bold text-amber-950 bg-amber-200 p-1.5 rounded">
                Ghi chú đơn: {order.notes}
              </p>
            )}

            <div className="text-center text-[10px] font-bold text-amber-800 pt-1">
              KDS - BẾP CỬA HÀNG CHẢ GIÒ BẮP
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onPrintThermal}
            className="py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" /> In 2 Bill Qua Máy Nhiệt (USB / Sunmi)
          </button>

          <button
            onClick={handleBrowserPrint}
            className="py-3 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" /> In Qua Trình Duyệt (Print Dialog)
          </button>
        </div>
      </div>
    </div>
  );
};
