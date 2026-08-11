import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  FileSpreadsheet,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import { Order, StoreConfig } from '../types';
import { formatVND } from '../utils/printer';

interface OrderHistoryViewProps {
  orders: Order[];
  config: StoreConfig;
  onReprintDualBill: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onSyncSingleOrderToSheet: (order: Order) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  config,
  onReprintDualBill,
  onCancelOrder,
  onSyncSingleOrderToSheet,
}) => {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const s = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(s) ||
      (o.tableName && o.tableName.toLowerCase().includes(s)) ||
      (o.customerName && o.customerName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl text-stone-900">Lịch Sử Hóa Đơn & Bill</h2>
          <p className="text-xs text-stone-500 mt-1">
            Tra cứu đơn hàng, in lại 2 bill (Khách + Bếp) và đồng bộ Google Sheets
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã HD, Bàn, Tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-900 text-stone-100 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Mã Đơn</th>
                <th className="py-3.5 px-4">Thời Gian</th>
                <th className="py-3.5 px-4">Vị Trí / Bàn</th>
                <th className="py-3.5 px-4">Số Món</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Thanh Toán</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400">
                    Không tìm thấy lịch sử đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-amber-700">{order.id}</td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {order.tableName || (order.orderType === 'takeaway' ? 'Mang Về' : 'Giao Hàng')}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} phần
                    </td>
                    <td className="py-3.5 px-4 font-black text-stone-900 text-sm">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold">
                        {order.paymentMethod === 'cash'
                          ? 'Tiền Mặt'
                          : order.paymentMethod === 'transfer'
                          ? 'Chuyển Khoản QR'
                          : 'Ví Điện Tử'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        {order.orderStatus === 'completed'
                          ? 'Đã xong'
                          : order.orderStatus === 'cooking'
                          ? 'Đang chế biến'
                          : order.orderStatus === 'cancelled'
                          ? 'Đã hủy'
                          : 'Đang chờ bếp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {/* Details */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Xem Chi Tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Reprint 2-Bill Thermal */}
                      <button
                        onClick={() => onReprintDualBill(order)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                        title="In Lại 2 Bill Máy Nhiệt"
                      >
                        <Printer className="w-3.5 h-3.5" /> In Lại 2 Bill
                      </button>

                      {/* Manual Sheet Sync */}
                      <button
                        onClick={() => onSyncSingleOrderToSheet(order)}
                        className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                        title="Đồng Bộ Sang Google Sheet"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL BILL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  CHI TIẾT ĐƠN HÀNG {selectedOrder.id}
                </h3>
                <p className="text-xs text-stone-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-stone-100 max-h-64 overflow-y-auto">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="pt-2 first:pt-0 flex justify-between">
                  <div>
                    <p className="font-bold text-stone-900">{item.menuItem.name}</p>
                    <p className="text-stone-500">
                      {formatVND(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-extrabold text-amber-600">{formatVND(item.totalPrice)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 text-xs font-bold space-y-1">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{formatVND(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span>-{formatVND(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-stone-900 pt-1 border-t">
                <span>TỔNG CỘNG:</span>
                <span className="text-amber-600">{formatVND(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onReprintDualBill(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="py-2.5 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <Printer className="w-4 h-4" /> In 2 Bill Nhiệt
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 bg-stone-200 text-stone-800 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
