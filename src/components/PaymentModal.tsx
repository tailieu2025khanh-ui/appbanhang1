import React, { useState } from 'react';
import { Order, PaymentMethod, StoreConfig } from '../types/pos';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  storeConfig: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    method: PaymentMethod,
    paidAmount: number,
    changeAmount: number,
    autoPrint: boolean
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  storeConfig,
  isOpen,
  onClose,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [givenCashText, setGivenCashText] = useState<string>(
    order.grandTotal.toString()
  );
  const [autoPrint, setAutoPrint] = useState<boolean>(
    storeConfig.autoPrintReceipt
  );

  const grandTotal = order.grandTotal;
  const givenCash = parseFloat(givenCashText.replace(/\D/g, '')) || 0;
  const changeAmount = Math.max(0, givenCash - grandTotal);

  const cashSuggestions = [
    grandTotal,
    Math.ceil(grandTotal / 50000) * 50000,
    Math.ceil(grandTotal / 100000) * 100000,
    Math.ceil(grandTotal / 200000) * 200000,
    500000,
  ].filter((val, index, self) => val >= grandTotal && self.indexOf(val) === index);

  const qrUrl = `https://img.vietqr.io/image/${storeConfig.bankName}-${storeConfig.bankAccount}-${storeConfig.qrTemplate}.png?amount=${grandTotal}&addInfo=${encodeURIComponent('Thanh me ' + order.id)}&accountName=${encodeURIComponent(storeConfig.accountHolder)}`;

  const handleConfirm = () => {
    if (method === 'cash' && givenCash < grandTotal) {
      alert('Số tiền khách đưa chưa đủ để thanh toán đơn hàng!');
      return;
    }
    onConfirmPayment(
      method,
      method === 'cash' ? givenCash : grandTotal,
      method === 'cash' ? changeAmount : 0,
      autoPrint
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E0E0D6]">
        {/* Modal Header */}
        <div className="bg-[#2C2C24] text-white p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#D6D6C2] uppercase tracking-wide">
              XÁC NHẬN THANH TOÁN
            </span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Đơn hàng {order.id}
              {order.tableName && (
                <span className="bg-[#5A5A40] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {order.tableName}
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#3E3E34] text-[#D6D6C2] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-[#FAF9F6] border-y border-[#E0E0D6] p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#808070]">TỔNG TIỀN CẦN THANH TOÁN</p>
            <p className="text-2xl font-bold text-[#2C2C24] mt-0.5">
              {grandTotal.toLocaleString('vi-VN')} <span className="text-base">đ</span>
            </p>
          </div>
          <div className="text-right text-xs text-[#808070] font-medium">
            <p>Số lượng món: <span className="font-bold text-[#1A1A1A]">{order.items.reduce((s, i) => s + i.quantity, 0)}</span></p>
            {order.discountPercent > 0 && (
              <p className="text-emerald-700 font-bold">Đã giảm: {order.discountPercent}%</p>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-2">
              CHỌN PHƯƠNG THỨC THANH TOÁN:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  method === 'cash'
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-xs'
                    : 'border-[#E0E0D6] bg-[#FAF9F6] hover:bg-white text-[#1A1A1A]'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('transfer')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  method === 'transfer'
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-xs'
                    : 'border-[#E0E0D6] bg-[#FAF9F6] hover:bg-white text-[#1A1A1A]'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>VietQR Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  method === 'card'
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-xs'
                    : 'border-[#E0E0D6] bg-[#FAF9F6] hover:bg-white text-[#1A1A1A]'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Thẻ ATM / POS</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('momo')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all gap-1.5 ${
                  method === 'momo'
                    ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-xs'
                    : 'border-[#E0E0D6] bg-[#FAF9F6] hover:bg-white text-[#1A1A1A]'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>Ví Điện Tử</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content based on method */}
          {method === 'cash' && (
            <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E0E0D6] space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1">
                  Tiền Khách Đưa (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={givenCash ? givenCash.toLocaleString('vi-VN') : ''}
                    onChange={(e) => setGivenCashText(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full text-xl font-bold px-3 py-2.5 rounded-xl border border-[#E0E0D6] bg-white pr-10 text-[#1A1A1A] focus:outline-hidden focus:border-[#5A5A40]"
                  />
                  <span className="absolute right-3 top-3 text-[#808070] font-bold text-sm">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Quick Cash Suggestions */}
              <div>
                <span className="text-[11px] font-medium text-[#808070] mb-1.5 block">
                  Gợi ý nhanh mệnh giá:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cashSuggestions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setGivenCashText(amount.toString())}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E0E0D6] hover:border-[#5A5A40] hover:bg-[#F5F5F0] text-[#1A1A1A] font-bold text-xs transition-all"
                    >
                      {amount.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Change */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="text-xs font-bold">TIỀN THỪA TRẢ LẠI:</span>
                <span className="text-lg font-bold text-emerald-800">
                  {changeAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          )}

          {method === 'transfer' && (
            <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E0E0D6] text-center space-y-2">
              <span className="text-xs font-bold text-[#1A1A1A] block">
                MÃ VIETQR TỰ ĐỘNG CHUYỂN KHỎAN KÈM NỘI DUNG & SỐ TIỀN
              </span>
              <div className="inline-block p-3 bg-white rounded-2xl border border-[#E0E0D6] shadow-2xs">
                <img
                  src={qrUrl}
                  alt="VietQR Payment"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>
              <div className="text-xs text-[#808070] font-medium space-y-0.5">
                <p>Ngân hàng: <span className="font-bold text-[#1A1A1A]">{storeConfig.bankName}</span></p>
                <p>Số tài khoản: <span className="font-bold text-[#1A1A1A]">{storeConfig.bankAccount}</span></p>
                <p>Chủ TK: <span className="font-bold text-[#1A1A1A]">{storeConfig.accountHolder}</span></p>
              </div>
            </div>
          )}

          {(method === 'card' || method === 'momo') && (
            <div className="bg-[#FAF9F6] rounded-2xl p-6 border border-[#E0E0D6] text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F0] text-[#5A5A40] border border-[#E0E0D6] flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#1A1A1A] text-sm">
                Quẹt thẻ trên máy POS / Quét mã MoMo tại quầy
              </h4>
              <p className="text-xs text-[#808070] max-w-xs mx-auto">
                Nhấn "Xác nhận đã thu tiền" sau khi giao dịch trên thiết bị thanh toán hoàn tất thành công.
              </p>
            </div>
          )}

          {/* Auto Print Receipt Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E0E0D6]">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#808070]" />
              <span className="text-xs font-bold text-[#1A1A1A]">
                Tự động in hóa đơn (ESC/POS Thermal)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#E0E0D6] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5A5A40]"></div>
            </label>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0D6] flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-[#E0E0D6] font-bold text-[#808070] hover:bg-white text-xs transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>XÁC NHẬN ĐÃ THU TIỀN & PHÁT HÀNH HÓA ĐƠN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
