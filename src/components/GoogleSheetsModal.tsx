import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Code2,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  X,
  Database,
  HelpCircle,
} from 'lucide-react';
import {
  testGoogleSheetConnection,
  fetchMenuFromGoogleSheet,
  exportAllOrdersToGoogleSheet,
  APPS_SCRIPT_TEMPLATE,
} from '../services/googleSheets';
import { MenuItem, Order, StoreConfig } from '../types/pos';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  orders: Order[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  storeConfig,
  setStoreConfig,
  menuItems,
  setMenuItems,
  orders,
}) => {
  const [urlInput, setUrlInput] = useState(storeConfig.googleSheetsUrl || '');
  const [autoSync, setAutoSync] = useState(storeConfig.googleSheetsAutoSync ?? true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập đường dẫn Google Sheet hoặc Web App URL.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Đang kiểm tra kết nối Google Sheet...' });

    const result = await testGoogleSheetConnection(urlInput);

    setLoading(false);
    if (result.success) {
      setStatusMsg({ type: 'success', text: result.message });
      setStoreConfig((prev) => ({
        ...prev,
        googleSheetsUrl: urlInput.trim(),
        googleSheetsAutoSync: autoSync,
        googleSheetsLastSync: new Date().toISOString(),
      }));
    } else {
      setStatusMsg({ type: 'error', text: result.message });
    }
  };

  const handleSyncMenu = async () => {
    if (!urlInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập liên kết Google Sheet trước.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Đang tải thực đơn từ Google Sheet...' });

    try {
      const newItems = await fetchMenuFromGoogleSheet(urlInput);
      if (newItems.length === 0) {
        setStatusMsg({ type: 'error', text: 'Không tìm thấy món ăn nào trong Google Sheet.' });
      } else {
        setMenuItems(newItems);
        setStatusMsg({
          type: 'success',
          text: `Đồng bộ thành công ${newItems.length} món ăn từ Google Sheet vào ứng dụng BÁN HÀNG CHẢ GIÒ!`,
        });
        setStoreConfig((prev) => ({
          ...prev,
          googleSheetsUrl: urlInput.trim(),
          googleSheetsAutoSync: autoSync,
          googleSheetsLastSync: new Date().toISOString(),
        }));
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Lỗi khi đồng bộ thực đơn.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePushAllOrders = async () => {
    if (!urlInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập Apps Script Web App URL để đẩy đơn.' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: 'info', text: `Đang đẩy ${orders.length} đơn hàng lên Google Sheet...` });

    const res = await exportAllOrdersToGoogleSheet(urlInput, orders);
    setLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      setStoreConfig((prev) => ({
        ...prev,
        googleSheetsUrl: urlInput.trim(),
        googleSheetsAutoSync: autoSync,
        googleSheetsLastSync: new Date().toISOString(),
      }));
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleSaveSettings = () => {
    setStoreConfig((prev) => ({
      ...prev,
      googleSheetsUrl: urlInput.trim(),
      googleSheetsAutoSync: autoSync,
    }));
    setStatusMsg({ type: 'success', text: 'Đã lưu cấu hình kết nối Google Sheet!' });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E0E0D6] flex flex-col max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-wide flex items-center gap-2">
                KẾT NỐI DATABASE GOOGLE SHEETS TRỰC TUYẾN
              </h2>
              <p className="text-xs text-[#D6D6C2] font-medium mt-0.5">
                Đồng bộ Thực Đơn & Lưu Đơn Hàng realtime lên Google Sheet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Status Alert Banner */}
          {statusMsg && (
            <div
              className={`p-3.5 rounded-2xl font-bold flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {statusMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {statusMsg.type === 'info' && <RefreshCw className="w-5 h-5 text-amber-600 animate-spin shrink-0 mt-0.5" />}
              <span className="leading-snug">{statusMsg.text}</span>
            </div>
          )}

          {/* Connection URL Input */}
          <div className="space-y-2">
            <label className="block font-bold text-[#1A1A1A]">
              Đường Dẫn Google Sheet Công Khai HOẶC Google Apps Script Web App URL (*):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ví dụ: https://script.google.com/macros/s/AKfycb.../exec hoặc link Google Sheet"
                className="flex-1 p-3 rounded-xl border border-[#E0E0D6] font-mono text-xs text-[#1A1A1A] bg-[#FAF9F6] focus:outline-hidden focus:ring-2 focus:ring-[#5A5A40]"
              />
              <button
                type="button"
                disabled={loading}
                onClick={handleTestConnection}
                className="px-4 py-3 bg-[#2C2C24] hover:bg-[#3E3E34] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-emerald-400" />}
                <span>Kiểm Tra</span>
              </button>
            </div>
            <p className="text-[11px] text-[#808070] italic">
              * Nhập liên kết Google Sheet công khai để đọc Thực Đơn, hoặc Google Apps Script Web App URL để vừa đọc vừa ghi dữ liệu tự động.
            </p>
          </div>

          {/* Quick Action Sync Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleSyncMenu}
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold transition-all text-left flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                  <DownloadCloud className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  Đồng Bộ Thực Đơn Từ Sheet
                </span>
                <p className="text-[11px] text-emerald-800 font-normal">
                  Cập nhật danh sách món, giá bán từ Google Sheet vào ứng dụng POS
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handlePushAllOrders}
              className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-bold transition-all text-left flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-sky-700 font-extrabold text-sm">
                  <UploadCloud className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform" />
                  Đẩy Toàn Bộ Đơn Hàng Lên Sheet
                </span>
                <p className="text-[11px] text-sky-800 font-normal">
                  Xuất {orders.length} đơn hàng hiện tại lên trang "DonHang" trong Google Sheet
                </p>
              </div>
            </button>
          </div>

          {/* Auto-Sync Toggle Option */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E0E0D6] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-[#1A1A1A] block">Tự Động Ghi Đơn Hàng Lên Google Sheet</span>
              <p className="text-[11px] text-[#808070]">
                Mỗi khi thu ngân nhấn "Thanh toán thành công", đơn sẽ tự cập nhật vào Sheet
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Google Apps Script Setup Tutorial Section */}
          <div className="border-t border-[#E0E0D6] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-xs font-bold text-[#5A5A40] hover:text-[#4A4A34] flex items-center gap-1.5"
              >
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>{showScriptCode ? 'Ẩn Mã Google Apps Script' : 'Xem Mã & Hướng Dẫn Cài Đặt Google Apps Script Mẫu'}</span>
              </button>

              <a
                href="https://sheets.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1"
              >
                Mở Google Sheets <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {showScriptCode && (
              <div className="space-y-3 bg-[#1E1E1E] text-gray-200 p-4 rounded-2xl border border-gray-700 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <span className="font-mono text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Code.gs (Google Apps Script)
                  </span>
                  <button
                    type="button"
                    onClick={copyCodeToClipboard}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Đã Sao Chép!' : 'Sao Chép Mã'}</span>
                  </button>
                </div>

                <pre className="font-mono text-[10.5px] leading-relaxed overflow-x-auto max-h-56 p-2 text-gray-300">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>

                <div className="text-[11px] text-gray-400 border-t border-gray-700 pt-2 space-y-1">
                  <p className="font-bold text-amber-400">Các bước 30 giây thiết lập:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[10.5px]">
                    <li>Mở Google Sheet -&gt; Tiện ích mở rộng (Extensions) -&gt; Apps Script.</li>
                    <li>Dán đoạn mã trên -&gt; Bấm "Triển khai" -&gt; "Triển khai dưới dạng ứng dụng web".</li>
                    <li>Cấu hình: Quyền truy cập chọn "Bất kỳ ai" (Anyone) -&gt; Triển khai.</li>
                    <li>Copy URL Web App thu được dán vào ô bên trên của ứng dụng BÁN HÀNG CHẢ GIÒ.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF9F6] border-t border-[#E0E0D6] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E0E0D6] bg-white text-[#1A1A1A] font-bold text-xs hover:bg-[#F5F5F0] transition-colors"
          >
            Đóng Modal
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>LƯU CẤU HÌNH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
