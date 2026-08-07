import React, { useState } from 'react';
import { Table, TableStatus, Order } from '../types/pos';
import {
  Users,
  MapPin,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  DollarSign,
  Utensils,
  Plus,
  AlertCircle,
  X,
} from 'lucide-react';

interface TableManagerProps {
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  activeOrders: Order[];
  onSelectTableForOrder: (table: Table) => void;
  onPayTableOrder: (order: Order) => void;
}

export const TableManager: React.FC<TableManagerProps> = ({
  tables,
  setTables,
  activeOrders,
  onSelectTableForOrder,
  onPayTableOrder,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('Tất cả');
  const [movingTable, setMovingTable] = useState<Table | null>(null);
  const [targetTableId, setTargetTableId] = useState<string>('');

  const zones = ['Tất cả', 'Tầng 1', 'Sân Thượng', 'Phòng VIP', 'Mang Về'];

  const filteredTables = tables.filter((t) =>
    selectedZone === 'Tất cả' ? true : t.zone === selectedZone
  );

  const emptyCount = tables.filter((t) => t.status === 'empty').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billingCount = tables.filter((t) => t.status === 'billing').length;

  const handleConfirmMoveTable = () => {
    if (!movingTable || !targetTableId) return;

    const target = tables.find((t) => t.id === targetTableId);
    if (!target) return;

    setTables(
      tables.map((t) => {
        if (t.id === movingTable.id) {
          return { ...t, status: 'empty', currentOrderId: undefined };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            status: movingTable.status,
            currentOrderId: movingTable.currentOrderId,
          };
        }
        return t;
      })
    );

    alert(`Đã chuyển đơn từ ${movingTable.name} sang ${target.name} thành công!`);
    setMovingTable(null);
    setTargetTableId('');
  };

  return (
    <div className="flex-1 bg-[#F5F5F0] p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-[#E0E0D6] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#5A5A40]" />
              SƠ ĐỒ BÀN & KHU VỰC PHỤC VỤ
            </h2>
            <p className="text-xs text-[#808070] mt-0.5 font-medium">
              Quản lý trạng thái bàn, chuyển bàn, gộp bàn và gọi món nhanh tại bàn.
            </p>
          </div>

          {/* Quick Counts */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6] text-[#5A5A40] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Bàn trống: {emptyCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6] text-[#5A5A40] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]"></span>
              <span>Đang có khách: {occupiedCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6] text-[#2C2C24] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2C2C24]"></span>
              <span>Chờ thanh toán: {billingCount}</span>
            </div>
          </div>
        </div>

        {/* Zone Selector Bar */}
        <div className="flex items-center gap-2 border-b border-[#E0E0D6] pb-2 overflow-x-auto">
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedZone === zone
                  ? 'bg-[#5A5A40] text-white shadow-xs'
                  : 'bg-white border border-[#E0E0D6] text-[#5A5A40] hover:bg-[#F0F0E8]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTables.map((table) => {
            const tableOrder = activeOrders.find(
              (o) => o.id === table.currentOrderId || o.tableId === table.id
            );

            let statusBg = 'bg-white border-[#E0E0D6] hover:border-[#5A5A40]';
            let badgeBg = 'bg-[#E0E0D6] text-[#5A5A40]';
            let statusText = 'Trống';

            if (table.status === 'occupied') {
              statusBg = 'bg-[#FAF9F6] border-[#5A5A40] hover:border-[#4A4A34]';
              badgeBg = 'bg-[#5A5A40] text-white';
              statusText = 'Có Khách';
            } else if (table.status === 'billing') {
              statusBg = 'bg-[#FAF9F6] border-[#2C2C24] hover:border-[#1A1A1A]';
              badgeBg = 'bg-[#2C2C24] text-white';
              statusText = 'Chờ Thanh Toán';
            } else if (table.status === 'reserved') {
              statusBg = 'bg-[#FAF9F6] border-[#D6D6C2]';
              badgeBg = 'bg-[#808070] text-white';
              statusText = 'Đã Đặt Trước';
            }

            return (
              <div
                key={table.id}
                className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${statusBg}`}
              >
                {/* Table Header */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-[#1A1A1A] text-sm">
                      {table.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeBg}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#808070] space-y-1 font-medium">
                    <p className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#808070]" />
                      <span>{table.capacity} ghế</span> • <span>{table.zone}</span>
                    </p>

                    {tableOrder && (
                      <div className="bg-white p-2 rounded-xl border border-[#E0E0D6] mt-2 text-[10px]">
                        <p className="font-bold text-[#1A1A1A]">Mã đơn: {tableOrder.id}</p>
                        <p className="font-bold text-[#5A5A40]">
                          {tableOrder.grandTotal.toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-[9px] text-[#808070]">
                          {tableOrder.items.length} món
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Actions */}
                <div className="mt-4 pt-2 border-t border-[#E0E0D6] flex flex-col gap-1.5">
                  {table.status === 'empty' ? (
                    <button
                      onClick={() => onSelectTableForOrder(table)}
                      className="w-full py-2 px-3 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Mở Đặt Món</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onSelectTableForOrder(table)}
                        className="w-full py-1.5 px-2 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Utensils className="w-3 h-3" />
                        <span>Thêm Món / Sửa</span>
                      </button>

                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => setMovingTable(table)}
                          className="py-1 px-1.5 rounded-lg bg-[#FAF9F6] border border-[#E0E0D6] hover:bg-[#F0F0E8] text-[#1A1A1A] font-bold text-[10px] transition-colors flex items-center justify-center gap-1"
                          title="Chuyển sang bàn khác"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Đổi Bàn</span>
                        </button>

                        {tableOrder && (
                          <button
                            onClick={() => onPayTableOrder(tableOrder)}
                            className="py-1 px-1.5 rounded-lg bg-[#2C2C24] hover:bg-[#3E3E34] text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Tính Tiền</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Move Table Modal */}
      {movingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-[#E0E0D6]">
            <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-3">
              <h3 className="font-extrabold text-base text-[#1A1A1A] flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#5A5A40]" />
                Chuyển Bàn: {movingTable.name}
              </h3>
              <button
                onClick={() => setMovingTable(null)}
                className="text-[#808070] hover:text-[#1A1A1A] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#808070]">
              Chọn bàn trống muốn chuyển toàn bộ thực đơn đơn hàng sang:
            </p>

            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full text-xs font-bold p-3 rounded-xl border border-[#E0E0D6] bg-[#FAF9F6] focus:outline-hidden focus:ring-2 focus:ring-[#5A5A40]"
            >
              <option value="">-- Chọn Bàn Đích --</option>
              {tables
                .filter((t) => t.status === 'empty' && t.id !== movingTable.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.zone} - {t.capacity} ghế)
                  </option>
                ))}
            </select>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0E0D6]">
              <button
                onClick={() => setMovingTable(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E0E0D6] text-[#808070] hover:bg-[#FAF9F6]"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmMoveTable}
                disabled={!targetTableId}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#4A4A34] text-white disabled:opacity-50"
              >
                Xác Nhận Chuyển Bàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
