import React, { useState } from 'react';
import {
  Users,
  Clock,
  DollarSign,
  Plus,
  ArrowRightLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  ShoppingBag,
} from 'lucide-react';
import { Table, TableSection, Order } from '../types';
import { formatVND } from '../utils/printer';

interface TableLayoutViewProps {
  tables: Table[];
  orders: Order[];
  onSelectTableForOrder: (tableId: string) => void;
  onUpdateTableStatus: (tableId: string, status: Table['status']) => void;
}

export const TableLayoutView: React.FC<TableLayoutViewProps> = ({
  tables,
  orders,
  onSelectTableForOrder,
  onUpdateTableStatus,
}) => {
  const [activeSection, setActiveSection] = useState<TableSection | 'Tất Cả'>('Tất Cả');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const sections: (TableSection | 'Tất Cả')[] = ['Tất Cả', 'Tầng 1', 'Tầng 2', 'Khu VIP'];

  const filteredTables = tables.filter((t) =>
    activeSection === 'Tất Cả' ? true : t.section === activeSection
  );

  const getTableActiveOrder = (table: Table): Order | undefined => {
    if (!table.currentOrderId) return undefined;
    return orders.find((o) => o.id === table.currentOrderId);
  };

  const calculateMinutesOccupied = (sinceStr?: string): number => {
    if (!sinceStr) return 0;
    const diffMs = new Date().getTime() - new Date(sinceStr).getTime();
    return Math.floor(diffMs / (1000 * 60));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Section Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-2xl text-[#1A1A1A] uppercase tracking-tight">Sơ Đồ Bàn & Phục Vụ</h2>
          <p className="text-xs text-stone-600 font-bold mt-1">
            Quản lý trạng thái bàn, tổng số lượng khách và mở đơn theo vị trí
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A]">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSection === sec
                  ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]'
                  : 'text-[#1A1A1A] hover:bg-[#FFF4E0]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#1A1A1A] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600">Tổng Số Bàn</p>
            <p className="text-2xl font-black text-[#1A1A1A]">{tables.length}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FFFBF0] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
            🏰
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#FF6B35] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600">Đang Có Khách</p>
            <p className="text-2xl font-black text-[#FF6B35]">
              {tables.filter((t) => t.status === 'occupied').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B35] border-2 border-[#1A1A1A] flex items-center justify-center text-white font-black shadow-[2px_2px_0px_0px_#1A1A1A]">
            🔥
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#7DBE52] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600">Bàn Trống</p>
            <p className="text-2xl font-black text-[#7DBE52]">
              {tables.filter((t) => t.status === 'empty').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#7DBE52] border-2 border-[#1A1A1A] flex items-center justify-center text-white font-black shadow-[2px_2px_0px_0px_#1A1A1A]">
            ✨
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#F2A900] flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600">Đã Đặt Trước</p>
            <p className="text-2xl font-black text-[#F2A900]">
              {tables.filter((t) => t.status === 'reserved').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F2A900] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] font-black shadow-[2px_2px_0px_0px_#1A1A1A]">
            📅
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map((table) => {
          const activeOrder = getTableActiveOrder(table);
          const mins = calculateMinutesOccupied(table.occupiedSince);

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`p-4 rounded-3xl border-2 border-[#1A1A1A] transition-all duration-200 cursor-pointer flex flex-col justify-between h-48 relative group hover:-translate-y-1 ${
                table.status === 'occupied'
                  ? 'bg-[#FFF4E0] shadow-[5px_5px_0px_0px_#FF6B35]'
                  : table.status === 'reserved'
                  ? 'bg-sky-50 shadow-[5px_5px_0px_0px_#F2A900]'
                  : 'bg-white shadow-[5px_5px_0px_0px_#1A1A1A] hover:shadow-[7px_7px_0px_0px_#7DBE52]'
              }`}
            >
              {/* Table Top Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[#1A1A1A] text-sm sm:text-base">
                    {table.name}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-[#1A1A1A] text-[#1A1A1A] shadow-[1px_1px_0px_0px_#1A1A1A]">
                    {table.capacity} Khách
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-bold mt-0.5">{table.section}</p>
              </div>

              {/* Status Content */}
              <div className="my-auto">
                {table.status === 'occupied' && (
                  <div className="space-y-1">
                    <p className="text-xs font-black text-[#FF6B35] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {mins} phút
                    </p>
                    <p className="text-sm font-black text-[#1A1A1A]">
                      {formatVND(table.totalAmount || activeOrder?.totalAmount || 0)}
                    </p>
                  </div>
                )}

                {table.status === 'reserved' && (
                  <div className="text-xs font-black text-blue-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Đã đặt trước
                  </div>
                )}

                {table.status === 'empty' && (
                  <div className="text-xs font-black text-[#7DBE52] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Bàn Trống
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTableForOrder(table.id);
                }}
                className={`w-full py-2 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all border border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A] ${
                  table.status === 'occupied'
                    ? 'bg-[#FF6B35] text-white hover:bg-[#FF5514]'
                    : 'bg-[#F2A900] text-[#1A1A1A] hover:bg-[#E5A000]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{table.status === 'occupied' ? 'Thêm Món / Bill' : 'Đặt Món'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* TABLE DETAIL MODAL */}
      {selectedTable && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 text-lg">
                  {selectedTable.name} - {selectedTable.section}
                </h3>
                <p className="text-xs text-stone-500">
                  Sức chứa: {selectedTable.capacity} người
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Setter */}
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-2">
                Đổi trạng thái bàn:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTable.id, 'empty');
                    setSelectedTable(null);
                  }}
                  className={`py-2 rounded-xl border ${
                    selectedTable.status === 'empty'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  Bàn Trống
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTable.id, 'occupied');
                    setSelectedTable(null);
                  }}
                  className={`py-2 rounded-xl border ${
                    selectedTable.status === 'occupied'
                      ? 'bg-amber-500 text-stone-950 border-amber-500'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  Có Khách
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTable.id, 'reserved');
                    setSelectedTable(null);
                  }}
                  className={`py-2 rounded-xl border ${
                    selectedTable.status === 'reserved'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  Đặt Trước
                </button>
              </div>
            </div>

            {/* Open Order Button */}
            <button
              onClick={() => {
                onSelectTableForOrder(selectedTable.id);
                setSelectedTable(null);
              }}
              className="w-full py-3 bg-stone-900 text-amber-400 rounded-2xl font-black text-sm hover:bg-stone-800 shadow-md"
            >
              Mở Đơn / Đặt Món Cho {selectedTable.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
