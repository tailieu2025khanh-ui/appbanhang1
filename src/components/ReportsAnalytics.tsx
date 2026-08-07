import React, { useState } from 'react';
import { Order, MenuItem } from '../types/pos';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  PieChart as PieIcon,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Coffee,
  Utensils,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface ReportsAnalyticsProps {
  orders: Order[];
  menuItems: MenuItem[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  orders,
  menuItems,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | 'month'>('today');

  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalOrdersCount = paidOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  let foodRevenue = 0;
  let foodVolume = 0;
  let drinkRevenue = 0;
  let drinkVolume = 0;

  const itemSalesMap: Record<string, { name: string; category: string; volume: number; revenue: number }> = {};

  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = item.menuItem.category;
      if (cat === 'mon-an') {
        foodRevenue += item.totalPrice;
        foodVolume += item.quantity;
      } else if (cat === 'nuoc-uong') {
        drinkRevenue += item.totalPrice;
        drinkVolume += item.quantity;
      }

      if (!itemSalesMap[item.menuItem.id]) {
        itemSalesMap[item.menuItem.id] = {
          name: item.menuItem.name,
          category: item.menuItem.category === 'mon-an' ? 'Món Ăn' : 'Nước Uống',
          volume: 0,
          revenue: 0,
        };
      }
      itemSalesMap[item.menuItem.id].volume += item.quantity;
      itemSalesMap[item.menuItem.id].revenue += item.totalPrice;
    });
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const pieData = [
    { name: 'Nước Uống', value: drinkRevenue || 1 },
    { name: 'Món Ăn', value: foodRevenue || 1 },
  ];
  const COLORS = ['#5A5A40', '#808070'];

  const hourlyDataMap: Record<string, number> = {
    '08:00': 350000,
    '10:00': 890000,
    '12:00': 1450000,
    '14:00': 920000,
    '16:00': 680000,
    '18:00': 1620000,
    '20:00': 1200000,
  };

  const timelineChartData = Object.entries(hourlyDataMap).map(([time, revenue]) => ({
    time,
    'Doanh Thu (đ)': revenue,
  }));

  return (
    <div className="flex-1 bg-[#F5F5F0] p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Filter */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-[#E0E0D6] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#5A5A40]" />
              BÁO CÁO DOANH THU & SẢN LƯỢNG F&B
            </h2>
            <p className="text-xs text-[#808070] mt-0.5 font-medium">
              Thống kê tổng quan tình hình kinh doanh, sản lượng bán ra và hiệu quả theo ca.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-xl border border-[#E0E0D6] text-xs">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === 'today'
                    ? 'bg-[#5A5A40] text-white shadow-2xs'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                Hôm Nay
              </button>
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === '7days'
                    ? 'bg-[#5A5A40] text-white shadow-2xs'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                7 Ngày Qua
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  timeRange === 'month'
                    ? 'bg-[#5A5A40] text-white shadow-2xs'
                    : 'text-[#808070] hover:text-[#1A1A1A]'
                }`}
              >
                Tháng Này
              </button>
            </div>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E0E0D6] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#808070]">TỔNG DOANH THU</p>
              <p className="text-xl font-extrabold text-[#5A5A40] mt-1">
                {totalRevenue.toLocaleString('vi-VN')} đ
              </p>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" /> +14.2% so với hôm qua
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] text-[#5A5A40] flex items-center justify-center font-bold border border-[#E0E0D6]">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E0E0D6] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#808070]">SỐ ĐƠN HOÀN TẤT</p>
              <p className="text-xl font-bold text-[#1A1A1A] mt-1">
                {totalOrdersCount} <span className="text-xs font-normal">đơn</span>
              </p>
              <span className="text-[10px] text-[#808070] font-medium mt-1 block">
                Trung bình ~{averageOrderValue.toLocaleString('vi-VN')}đ/đơn
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center font-bold border border-[#E0E0D6]">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E0E0D6] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#808070]">SẢN LƯỢNG NƯỚC UỐNG</p>
              <p className="text-xl font-bold text-[#5A5A40] mt-1">
                {drinkVolume} <span className="text-xs font-normal">ly</span>
              </p>
              <span className="text-[10px] text-[#5A5A40] font-bold mt-1 block">
                {drinkRevenue.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] text-[#5A5A40] flex items-center justify-center border border-[#E0E0D6]">
              <Coffee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E0E0D6] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#808070]">SẢN LƯỢNG MÓN ĂN</p>
              <p className="text-xl font-bold text-[#2C2C24] mt-1">
                {foodVolume} <span className="text-xs font-normal">phần</span>
              </p>
              <span className="text-[10px] text-[#2C2C24] font-bold mt-1 block">
                {foodRevenue.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] text-[#2C2C24] flex items-center justify-center border border-[#E0E0D6]">
              <Utensils className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Area Timeline */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-2xs space-y-4">
            <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5A5A40]" />
              Biểu Đồ Doanh Thu Theo Giờ Trong Ngày
            </h3>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#5A5A40" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D6" />
                  <XAxis dataKey="time" stroke="#808070" />
                  <YAxis stroke="#808070" tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString('vi-VN')} đ`,
                      'Doanh thu',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="Doanh Thu (đ)"
                    stroke="#5A5A40"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie */}
          <div className="bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-2xs space-y-4 flex flex-col justify-between">
            <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#5A5A40]" />
              Tỷ Lệ Doanh Thu: Món Ăn vs Nước Uống
            </h3>
            <div className="h-52 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} đ`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#5A5A40]">
                <span className="w-3 h-3 rounded-full bg-[#5A5A40]"></span>
                Nước Uống ({Math.round((drinkRevenue / (totalRevenue || 1)) * 100)}%)
              </span>
              <span className="flex items-center gap-1.5 text-[#808070]">
                <span className="w-3 h-3 rounded-full bg-[#808070]"></span>
                Món Ăn ({Math.round((foodRevenue / (totalRevenue || 1)) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Top Selling Items Table */}
        <div className="bg-white rounded-2xl p-5 border border-[#E0E0D6] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
              <Award className="w-5 h-5 text-[#5A5A40]" />
              TOP 5 SẢN PHẨM BÁN CHẠY NHẤT (SẢN LƯỢNG HIGH-VOLUME)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0D6] text-[#808070] font-bold bg-[#FAF9F6]">
                  <th className="py-2.5 px-3">Hạng</th>
                  <th className="py-2.5 px-3">Tên Món</th>
                  <th className="py-2.5 px-3">Phân Loại</th>
                  <th className="py-2.5 px-3 text-center">Sản Lượng Bán</th>
                  <th className="py-2.5 px-3 text-right">Tổng Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0D6]/60 font-medium">
                {topSellingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF9F6]">
                    <td className="py-3 px-3">
                      <span className="w-6 h-6 rounded-full bg-[#F5F5F0] text-[#5A5A40] font-black text-xs flex items-center justify-center border border-[#E0E0D6]">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-[#1A1A1A]">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="bg-[#FAF9F6] border border-[#E0E0D6] text-[#808070] px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#5A5A40]">
                      {item.volume} phần/ly
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1A1A1A]">
                      {item.revenue.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
