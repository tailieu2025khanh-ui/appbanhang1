import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  FileSpreadsheet,
  Download,
  Calendar,
  CreditCard,
  Award,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Order, StoreConfig, DailyRevenueOnlineData } from '../types';
import { formatVND } from '../utils/printer';
import { fetchDailyRevenueFromGoogleSheets } from '../utils/googleSheets';
import { exportWordReportDocx, exportPowerPointDeckPptx } from '../utils/docExporter';
import { AIAssistantWidget } from './AIAssistantWidget';

interface ReportsViewProps {
  orders: Order[];
  config: StoreConfig;
  onSyncAllToSheet: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, config, onSyncAllToSheet }) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Online Revenue State
  const [onlineData, setOnlineData] = useState<DailyRevenueOnlineData | null>(null);
  const [isFetchingOnline, setIsFetchingOnline] = useState<boolean>(false);
  const [onlineFetchStatus, setOnlineFetchStatus] = useState<string>('');

  // Auto fetch online daily revenue on component mount if enabled
  useEffect(() => {
    if (config.googleSheetWebhookUrl && !config.googleSheetWebhookUrl.includes('EXAMPLE')) {
      handleFetchOnlineRevenue(selectedDate);
    }
  }, [selectedDate, config.googleSheetWebhookUrl]);

  const handleFetchOnlineRevenue = async (dateStr: string) => {
    setIsFetchingOnline(true);
    setOnlineFetchStatus('Đang truy vấn cơ sở dữ liệu Google Sheets trực tuyến...');
    try {
      const res = await fetchDailyRevenueFromGoogleSheets(config, dateStr);
      setOnlineData(res);
      setOnlineFetchStatus(res.message);
    } catch (err: any) {
      setOnlineFetchStatus(`Lỗi kết nối: ${err.message || 'Không thể tải dữ liệu'}`);
    } finally {
      setIsFetchingOnline(false);
    }
  };

  // Filter valid local orders for selected date (or all if not filtered)
  const validOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.orderStatus === 'cancelled') return false;
      const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
      return orderDate === selectedDate;
    });
  }, [orders, selectedDate]);

  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [validOrders]);

  const totalOrdersCount = validOrders.length;

  const avgOrderValue = useMemo(() => {
    if (totalOrdersCount === 0) return 0;
    return Math.round(totalRevenue / totalOrdersCount);
  }, [totalRevenue, totalOrdersCount]);

  // Payment Breakdown
  const cashRevenue = useMemo(() => {
    return validOrders
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [validOrders]);

  const transferRevenue = useMemo(() => {
    return validOrders
      .filter((o) => o.paymentMethod === 'transfer' || o.paymentMethod === 'e_wallet')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [validOrders]);

  // Dish Sales Ranking
  const dishSales = useMemo(() => {
    const map: Record<string, { name: string; count: number; total: number }> = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const id = item.menuItem.id;
        if (!map[id]) {
          map[id] = { name: item.menuItem.name, count: 0, total: 0 };
        }
        map[id].count += item.quantity;
        map[id].total += item.totalPrice;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [validOrders]);

  // Chart Data
  const chartData = useMemo(() => {
    const hoursMap: Record<string, number> = {};
    for (let i = 8; i <= 22; i++) {
      hoursMap[`${i}:00`] = 0;
    }
    validOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      const label = `${h}:00`;
      if (hoursMap[label] !== undefined) {
        hoursMap[label] += o.totalAmount;
      }
    });
    return Object.keys(hoursMap).map((k) => ({ hour: k, DoanhThu: hoursMap[k] }));
  }, [validOrders]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Ma Don,Thoi Gian,Vi Tri,Tong Tien,Hinh Thuc,Trang Thai\n';
    validOrders.forEach((o) => {
      csv += `${o.id},"${new Date(o.createdAt).toLocaleString('vi-VN')}","${
        o.tableName || o.orderType
      }",${o.totalAmount},"${o.paymentMethod}","${o.orderStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_ChaGioBap_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-2xl text-stone-900 flex items-center gap-2">
            <span>Báo Cáo Doanh Thu CHẢ GIÒ BẮP</span>
            <span className="bg-[#FF6B35] text-white text-xs px-2.5 py-1 rounded-full font-black">
              2026
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Kết nối cơ sở dữ liệu doanh thu trực tuyến từ Google Sheets & Thống kê POS nội bộ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-stone-800 bg-transparent border-0 focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleFetchOnlineRevenue(selectedDate)}
            disabled={isFetchingOnline}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
            title="Tải tổng doanh thu theo ngày từ Google Sheets Database"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingOnline ? 'animate-spin' : ''}`} />
            <span>Nạp DB Trực Tuyến</span>
          </button>

          <button
            onClick={onSyncAllToSheet}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
          >
            <FileSpreadsheet className="w-4 h-4" /> Đẩy Đơn Sang Sheet
          </button>

          <button
            onClick={() => exportWordReportDocx(orders, config, selectedDate)}
            className="px-3.5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
            title="Xuất báo cáo ca làm việc định dạng Word (.doc/.docx)"
          >
            <Download className="w-4 h-4" /> Xuất Word (.doc)
          </button>

          <button
            onClick={() => exportPowerPointDeckPptx(orders, config, selectedDate)}
            className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
            title="Xuất slide thuyết trình kinh doanh định dạng PowerPoint (.pptx)"
          >
            <Download className="w-4 h-4" /> Xuất PowerPoint (.pptx)
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
        </div>
      </div>

      {/* SECTION: AI BUSINESS & REVENUE INSIGHT WIDGET */}
      <AIAssistantWidget mode="reports" ordersHistory={orders} />

      {/* SECTION: ONLINE GOOGLE SHEETS DATABASE REVENUE BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white p-5 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-48 h-48 text-emerald-300" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/60 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-emerald-300 flex items-center gap-2">
                <span>Cơ Sở Dữ Liệu Trực Tuyến Google Sheets</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                Tổng doanh thu tự động ghi nhận trực tuyến theo ngày ({selectedDate})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onlineData?.success ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kết Nối Trực Tuyến OK
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full font-bold border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Webhook Demo / Chưa Đặt URL
              </span>
            )}
            {onlineData?.lastUpdated && (
              <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> {onlineData.lastUpdated}
              </span>
            )}
          </div>
        </div>

        {/* Online Data KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-700/50 backdrop-blur-xs">
            <p className="text-xs font-semibold text-emerald-200/80">Tổng Doanh Thu Google Sheets</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {formatVND(onlineData?.totalRevenue || 0)}
            </p>
            <p className="text-[11px] text-stone-300 mt-1 font-medium">
              Đồng bộ thực tế từ đám mây
            </p>
          </div>

          <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 backdrop-blur-xs">
            <p className="text-xs font-semibold text-stone-300">Tổng Đơn Hàng Ghi Nhận</p>
            <p className="text-2xl font-black text-white mt-1">
              {onlineData?.totalOrders || 0} <span className="text-xs font-normal text-stone-400">Đơn</span>
            </p>
            <p className="text-[11px] text-stone-400 mt-1 font-medium">
              Ghi trên trang tính online
            </p>
          </div>

          <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 backdrop-blur-xs">
            <p className="text-xs font-semibold text-stone-300">Đối Soát Với POS Nội Bộ</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {formatVND(totalRevenue)}
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              {onlineData?.totalRevenue === totalRevenue
                ? '✓ Trùng khớp 100%'
                : `Chênh lệch: ${formatVND(Math.abs((onlineData?.totalRevenue || 0) - totalRevenue))}`}
            </p>
          </div>
        </div>

        {onlineFetchStatus && (
          <p className="text-xs text-emerald-200/90 bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800/60 font-mono">
            ℹ️ {onlineFetchStatus}
          </p>
        )}
      </div>

      {/* KPI Cards POS LOCAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Doanh Thu POS Ngày ({selectedDate})</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{formatVND(totalRevenue)}</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ Hoạt động ổn định</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Tổng Đơn Hàng POS</p>
            <p className="text-2xl font-black text-stone-900 mt-1">{totalOrdersCount} Đơn</p>
            <p className="text-[11px] text-stone-400 font-medium mt-1">Hóa đơn trong ngày</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center font-black">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Giá Trị TB / Đơn (AOV)</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{formatVND(avgOrderValue)}</p>
            <p className="text-[11px] text-stone-400 font-medium mt-1">Trung bình mỗi bill</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500">Tiền Mặt vs QR</p>
            <p className="text-sm font-extrabold text-stone-900 mt-1">
              Tiền mặt: <span className="text-amber-600">{formatVND(cashRevenue)}</span>
            </p>
            <p className="text-xs font-bold text-emerald-600">
              Chuyển khoản: {formatVND(transferRevenue)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-stone-900 text-base">Biểu Đồ Doanh Thu Theo Giờ (Ngày {selectedDate})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [formatVND(value), 'Doanh Thu']}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="DoanhThu" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Ranking List */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Bảng Xếp Hạng Món
            </h3>
            <span className="text-xs text-stone-400 font-bold">Top Bán Chạy</span>
          </div>

          <div className="space-y-3 divide-y divide-stone-100">
            {dishSales.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">Chưa có dữ liệu bán hàng trong ngày chọn.</p>
            ) : (
              dishSales.slice(0, 5).map((dish, index) => (
                <div key={dish.name} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                        index === 0
                          ? 'bg-amber-500 text-stone-950'
                          : index === 1
                          ? 'bg-stone-300 text-stone-900'
                          : index === 2
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-extrabold text-stone-900">{dish.name}</p>
                      <p className="text-[11px] text-stone-500 font-medium">Đã bán: {dish.count} phần</p>
                    </div>
                  </div>
                  <span className="font-black text-amber-600">{formatVND(dish.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
