import React, { useState } from 'react';
import { Shift, StoreConfig } from '../types/pos';
import { Clock, DollarSign, Lock, Printer, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

interface ShiftManagerProps {
  shift: Shift;
  setShift: React.Dispatch<React.SetStateAction<Shift>>;
  storeConfig: StoreConfig;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({
  shift,
  setShift,
  storeConfig,
}) => {
  const [actualCashText, setActualCashText] = useState<string>(
    shift.closingCashCalculated.toString()
  );
  const [showCloseModal, setShowCloseModal] = useState(false);

  const actualCash = parseFloat(actualCashText.replace(/\D/g, '')) || 0;
  const difference = actualCash - shift.closingCashCalculated;

  const handleConfirmCloseShift = () => {
    setShift({
      ...shift,
      closingCashActual: actualCash,
      difference: difference,
      isClosed: true,
      endTime: new Date().toISOString(),
    });
    setShowCloseModal(false);
    alert('Đã chốt ca làm việc thành công!');
  };

  const handlePrintShiftReceipt = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#F5F5F0] p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="bg-white rounded-2xl p-5 shadow-2xs border border-[#E0E0D6] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5A5A40]" />
              QUẢN LÝ CA LÀM VIỆC & CHỐT KÉT TIỀN (SHIFT REPORT)
            </h2>
            <p className="text-xs text-[#808070] mt-0.5 font-medium">
              Theo dõi biến động dòng tiền đầu ca, doanh thu thực tế và chốt sổ bàn giao ca.
            </p>
          </div>

          {!shift.isClosed ? (
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>CHỐT CA LÀM VIỆC</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6] text-[#808070] font-bold text-xs">
              🔒 Ca Đã Kết Thúc
            </span>
          )}
        </div>

        {/* Shift Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E0E0D6] shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-4">
            <div>
              <p className="text-xs font-bold text-[#808070]">NHÂN VIÊN THU NGÂN</p>
              <h3 className="text-base font-bold text-[#1A1A1A] mt-0.5">
                {shift.cashierName}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#808070]">THỜI GIAN VẬN HÀNH</p>
              <p className="text-xs font-bold text-[#1A1A1A] mt-0.5">
                Bắt đầu: {new Date(shift.startTime).toLocaleString('vi-VN')}
              </p>
              {shift.endTime && (
                <p className="text-xs font-bold text-rose-700 mt-0.5">
                  Kết thúc: {new Date(shift.endTime).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          </div>

          {/* Money Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
              <span className="text-xs font-bold text-[#808070]">Tiền Tiền Mặt Đầu Ca (Két)</span>
              <p className="text-lg font-bold text-[#1A1A1A] mt-1">
                {shift.openingCash.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
              <span className="text-xs font-bold text-[#5A5A40]">Doanh Thu Tiền Mặt</span>
              <p className="text-lg font-bold text-[#5A5A40] mt-1">
                +{shift.cashRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
              <span className="text-xs font-bold text-[#5A5A40]">Doanh Thu Chuyển Khoản QR</span>
              <p className="text-lg font-bold text-[#5A5A40] mt-1">
                +{shift.transferRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
              <span className="text-xs font-bold text-[#5A5A40]">Doanh Thu Thẻ / POS</span>
              <p className="text-lg font-bold text-[#5A5A40] mt-1">
                +{shift.cardRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
              <span className="text-xs font-bold text-[#5A5A40]">TỔNG DOANH THU CA</span>
              <p className="text-xl font-bold text-[#5A5A40] mt-1">
                {shift.totalRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#2C2C24] text-white">
              <span className="text-xs font-bold text-[#D6D6C2]">TIỀN MẶT LÝ THUYẾT TRONG KÉT</span>
              <p className="text-xl font-bold text-white mt-1">
                {shift.closingCashCalculated.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {/* Closed Summary details if closed */}
          {shift.isClosed && shift.closingCashActual !== undefined && (
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E0E0D6] space-y-2">
              <h4 className="font-bold text-[#1A1A1A] text-sm">
                KẾT QUẢ KIỂM KÊ CHỐT SỔ KÉT TIỀN
              </h4>
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[#808070] font-medium">Tiền mặt kiểm đếm thực tế: </span>
                  <span className="font-bold text-[#1A1A1A] text-sm">
                    {shift.closingCashActual.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div>
                  <span className="text-[#808070] font-medium">Chênh lệch thừa/thiếu: </span>
                  <span
                    className={`font-bold text-sm ${
                      (shift.difference || 0) === 0
                        ? 'text-emerald-700'
                        : (shift.difference || 0) > 0
                        ? 'text-[#5A5A40]'
                        : 'text-rose-700'
                    }`}
                  >
                    {(shift.difference || 0) > 0 ? '+' : ''}
                    {(shift.difference || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={handlePrintShiftReceipt}
              className="px-4 py-2.5 rounded-xl bg-[#2C2C24] hover:bg-[#3E3E34] text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-[#D6D6C2]" />
              <span>IN PHIẾU BÁO CÁO CHỐT CA (ESC/POS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Close Shift Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-[#E0E0D6]">
            <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-3">
              <h3 className="font-extrabold text-base text-[#1A1A1A] flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-700" />
                XÁC NHẬN CHỐT CA LÀM VIỆC
              </h3>
            </div>

            <p className="text-xs text-[#808070] leading-relaxed">
              Vui lòng đếm lại tổng số tiền mặt thực tế đang có trong két tiền để kiểm tra chênh lệch:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A1A1A]">
                Số Tiền Mặt Thực Tế Trong Két (đ):
              </label>
              <input
                type="text"
                value={actualCash ? actualCash.toLocaleString('vi-VN') : ''}
                onChange={(e) => setActualCashText(e.target.value)}
                className="w-full text-lg font-bold p-3 rounded-xl border border-[#E0E0D6] bg-[#FAF9F6] focus:outline-hidden focus:border-[#5A5A40]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6] text-xs space-y-1">
              <div className="flex justify-between">
                <span>Lý thuyết két có:</span>
                <span className="font-bold">{shift.closingCashCalculated.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Chênh lệch:</span>
                <span className={difference < 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {difference > 0 ? '+' : ''}{difference.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0E0D6]">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E0E0D6] text-[#808070] hover:bg-[#FAF9F6]"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmCloseShift}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs"
              >
                XÁC NHẬN HOÀN TẤT CHỐT CA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
