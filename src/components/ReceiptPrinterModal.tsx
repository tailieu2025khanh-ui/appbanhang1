import React from 'react';
import { Order, StoreConfig } from '../types/pos';
import { Printer, X, CheckCircle2, QrCode } from 'lucide-react';

interface ReceiptPrinterModalProps {
  order: Order | null;
  storeConfig: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPrinterModal: React.FC<ReceiptPrinterModalProps> = ({
  order,
  storeConfig,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const is58mm = storeConfig.paperSize === '58mm';
  const qrUrl = `https://img.vietqr.io/image/${storeConfig.bankName}-${storeConfig.bankAccount}-${storeConfig.qrTemplate}.png?amount=${order.grandTotal}&addInfo=${encodeURIComponent('Thanh toan ' + order.id)}&accountName=${encodeURIComponent(storeConfig.accountHolder)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C24]/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E0E0D6]">
        {/* Modal Top Bar */}
        <div className="bg-[#2C2C24] text-white p-4 flex items-center justify-between border-b border-[#3E3E34]">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#D6D6C2]" />
            <h3 className="font-bold text-sm text-white">Xem Trước Hóa Đơn (Mẫu {storeConfig.paperSize})</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3E3E34] text-[#D6D6C2] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Visual Container */}
        <div className="p-6 bg-[#F5F5F0] overflow-y-auto flex-1 flex justify-center">
          {/* Paper Bill Simulation */}
          <div
            id="printable-receipt"
            className={`bg-[#FAF9F6] text-[#1A1A1A] p-5 shadow-sm font-mono text-xs rounded-sm border border-[#E0E0D6] relative ${
              is58mm ? 'w-[280px]' : 'w-[340px]'
            }`}
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Header / Store Info */}
            <div className="text-center space-y-1 mb-4 border-b border-dashed border-[#808070] pb-3">
              <h2 className="font-bold text-sm tracking-wider uppercase">
                {storeConfig.storeName}
              </h2>
              <p className="text-[11px] leading-tight text-[#808070]">{storeConfig.address}</p>
              <p className="text-[11px]">SĐT: {storeConfig.phone}</p>
              <p className="text-[10px] text-[#808070]">Wifi: {storeConfig.wifiName} | Mật khẩu: {storeConfig.wifiPass}</p>
            </div>

            {/* Bill Title & Meta */}
            <div className="text-center mb-3">
              <h3 className="font-bold text-base uppercase">HÓA ĐƠN THANH TOÁN</h3>
              <p className="font-bold text-xs mt-0.5">Mã HD: {order.id}</p>
            </div>

            <div className="text-[11px] space-y-1 mb-3 border-b border-dashed border-[#808070] pb-2">
              <div className="flex justify-between">
                <span>Ngày tạo:</span>
                <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Loại đơn:</span>
                <span className="font-bold">
                  {order.orderType === 'table'
                    ? `Tại bàn (${order.tableName || 'N/A'})`
                    : order.orderType === 'takeaway'
                    ? 'Mang về'
                    : 'Giao hàng'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thu ngân:</span>
                <span>{order.cashierName}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left mb-3 border-b border-dashed border-[#808070] pb-2">
              <thead>
                <tr className="border-b border-[#808070] text-[11px]">
                  <th className="py-1">Món</th>
                  <th className="py-1 text-center">SL</th>
                  <th className="py-1 text-right">Đ.Giá</th>
                  <th className="py-1 text-right">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0D6]">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1.5 pr-1">
                      <div className="font-bold leading-tight">{item.menuItem.name}</div>
                      {item.selectedModifiers.map((m, mIdx) => (
                        <div key={mIdx} className="text-[10px] text-[#808070] pl-1">
                          + {m.optionName} {m.price > 0 && `(+${m.price / 1000}k)`}
                        </div>
                      ))}
                      {item.itemNote && (
                        <div className="text-[10px] text-[#5A5A40] italic pl-1">
                          * {item.itemNote}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-1.5 text-right">{item.unitPrice.toLocaleString('vi-VN')}</td>
                    <td className="py-1.5 text-right font-bold">{item.totalPrice.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculation Totals */}
            <div className="space-y-1 text-[11px] mb-4 border-b border-dashed border-[#808070] pb-3">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{order.subtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              {order.discountPercent > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Giảm giá ({order.discountPercent}%):</span>
                  <span>-{order.discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              {order.vatPercent > 0 && (
                <div className="flex justify-between text-[#808070]">
                  <span>Thuế VAT ({order.vatPercent}%):</span>
                  <span>+{order.vatAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-[#1A1A1A]">
                <span>TỔNG CỘNG:</span>
                <span>{order.grandTotal.toLocaleString('vi-VN')} đ</span>
              </div>

              {/* Payment Details */}
              <div className="pt-2 text-[10px] space-y-0.5 text-[#808070]">
                <div className="flex justify-between">
                  <span>Hình thức thanh toán:</span>
                  <span className="font-bold uppercase text-[#1A1A1A]">
                    {order.paymentMethod === 'cash'
                      ? 'Tiền Mặt'
                      : order.paymentMethod === 'transfer'
                      ? 'Chuyển Khoản VietQR'
                      : order.paymentMethod === 'card'
                      ? 'Thẻ ATM/POS'
                      : 'Ví Điện Tử'}
                  </span>
                </div>
                {order.paymentMethod === 'cash' && order.paidAmount && (
                  <>
                    <div className="flex justify-between">
                      <span>Tiền khách đưa:</span>
                      <span>{order.paidAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1A1A1A]">
                      <span>Tiền trả lại:</span>
                      <span>{(order.changeAmount || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer QR / Thank you */}
            <div className="text-center space-y-2">
              {order.paymentMethod === 'transfer' && (
                <div className="flex flex-col items-center justify-center p-2 bg-white border border-[#E0E0D6] rounded">
                  <img src={qrUrl} alt="VietQR" className="w-24 h-24 object-contain" />
                  <span className="text-[9px] text-[#808070] mt-1">Quét QR thanh toán VietQR</span>
                </div>
              )}
              <p className="font-bold text-[11px]">CẢM ƠN VÀ HẸN GẶP LẠI QUÝ KHÁCH!</p>
              <p className="text-[9px] text-[#808070]">Phần mềm POS F&B Chuyên Nghiệp</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0D6] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E0E0D6] font-semibold text-[#808070] hover:bg-white text-xs transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>IN HÓA ĐƠN NGAY (ESC/POS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
