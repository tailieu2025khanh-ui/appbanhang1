import React, { useState } from 'react';
import {
  Settings,
  Store,
  Printer,
  QrCode,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Usb,
  Smartphone,
  RefreshCcw,
  Wifi,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Database,
} from 'lucide-react';
import { StoreConfig } from '../types';
import { buildESCPOSReceipt, sendESCPOSUSB } from '../utils/printer';
import { fetchDailyRevenueFromGoogleSheets, GOOGLE_APPS_SCRIPT_TEMPLATE } from '../utils/googleSheets';

interface SettingsViewProps {
  config: StoreConfig;
  onSaveConfig: (newConfig: StoreConfig) => void;
  usbConnected: boolean;
  onConnectUSBPrinter: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  usbConnected,
  onConnectUSBPrinter,
}) => {
  const [formData, setFormData] = useState<StoreConfig>({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);
  const [testingSheet, setTestingSheet] = useState(false);
  const [sheetTestResult, setSheetTestResult] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const handleSave = () => {
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Test Thermal USB Print
  const handleTestUSBPrint = async () => {
    setTestingPrint(true);
    try {
      const dummyOrder: any = {
        id: 'TEST_001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [
          {
            menuItem: { name: 'Chả Giò Bắp Quảng Ngãi', price: 35000 },
            quantity: 2,
            selectedOptions: [],
            unitPrice: 35000,
            totalPrice: 70000,
          },
          {
            menuItem: { name: 'Trà Tắc Khổng Lồ', price: 15000 },
            quantity: 2,
            selectedOptions: [],
            unitPrice: 15000,
            totalPrice: 30000,
          },
        ],
        subtotal: 100000,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 100000,
        orderType: 'at_table',
        tableName: 'Bàn Test',
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        orderStatus: 'completed',
      };

      const bytes = buildESCPOSReceipt(dummyOrder, formData, false);
      const devices = await navigator.usb.getDevices();
      if (devices.length > 0 && devices[0].opened) {
        await sendESCPOSUSB(devices[0], bytes);
        alert('Đã gửi lệnh in mẫu ESC/POS thành công đến máy in nhiệt USB!');
      } else {
        alert('Vui lòng kết nối máy in USB bằng nút "Kết Nối USB Máy In" trước khi in thử.');
      }
    } catch (e: any) {
      alert(`Lỗi in thử: ${e.message || 'Không thể gửi dữ liệu máy in.'}`);
    } finally {
      setTestingPrint(false);
    }
  };

  // Test Google Sheets Online DB Connection
  const handleTestSheetConnection = async () => {
    setTestingSheet(true);
    setSheetTestResult('Đang kiểm tra kết nối Google Sheets Database trực tuyến...');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetchDailyRevenueFromGoogleSheets(formData, today);
      if (res.success) {
        setSheetTestResult(
          `✅ KẾT NỐI THÀNH CÔNG! Đã lấy doanh thu trực tuyến ngày ${today}: ${res.totalRevenue.toLocaleString(
            'vi-VN'
          )} đ (${res.totalOrders} đơn hàng)`
        );
      } else {
        setSheetTestResult(`⚠️ CHƯA LẤY ĐƯỢC DỮ LIỆU: ${res.message}`);
      }
    } catch (err: any) {
      setSheetTestResult(`❌ LỖI KẾT NỐI: ${err.message}`);
    } finally {
      setTestingSheet(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="font-extrabold text-2xl text-stone-900 flex items-center gap-2">
            <span>Cài Đặt Hệ Thống & Kết Nối</span>
            <span className="bg-[#FF6B35] text-white text-xs px-2.5 py-1 rounded-full font-black">
              CHẢ GIÒ BẮP
            </span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Thiết lập thông tin cửa hàng CHẢ GIÒ BẮP, máy in nhiệt USB 2-Bill, VietQR & Google Sheets Online DB
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg transition-all"
        >
          <Save className="w-4 h-4" /> Lưu Cấu Hình
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Đã lưu cấu hình hệ thống thành công!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: Store Branding */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-stone-900 text-sm border-b pb-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Thông Tin Quán & Thương Hiệu</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Tên Thương Hiệu Cửa Hàng:</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Slogan / Khẩu Hiệu:</label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Địa Chỉ:</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Hotline / Số Điện Thoại:</label>
              <input
                type="text"
                value={formData.hotline}
                onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold text-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên Wi-Fi:</label>
                <input
                  type="text"
                  value={formData.wifiName}
                  onChange={(e) => setFormData({ ...formData, wifiName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700 block mb-1">Mật Khẩu Wi-Fi:</label>
                <input
                  type="text"
                  value={formData.wifiPassword}
                  onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: VietQR Account */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-extrabold text-stone-900 text-sm border-b pb-2">
            <QrCode className="w-4 h-4 text-amber-600" />
            <span>Tài Khoản Ngân Hàng & Mã VietQR</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Ngân Hàng (Bank ID):</label>
              <select
                value={formData.bankId}
                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="MBBank">MBBank (Ngân Hàng Quân Đội)</option>
                <option value="VCB">Vietcombank (VCB)</option>
                <option value="TCB">Techcombank (TCB)</option>
                <option value="VPB">VPBank</option>
                <option value="ACB">ACB</option>
                <option value="BIDV">BIDV</option>
                <option value="VTB">VietinBank</option>
                <option value="TPB">TPBank</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Số Tài Khoản:</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-stone-900 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Tên Chủ Tài Khoản:</label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold uppercase"
              />
            </div>

            <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              💡 Mã VietQR sẽ tự động tạo chuỗi chuyển khoản chính xác theo đúng số tiền từng hóa đơn.
            </p>
          </div>
        </div>

        {/* SECTION 3: Thermal USB & Sunmi D2 Printer */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-extrabold text-stone-900 text-sm">
              <Printer className="w-4 h-4 text-amber-600" />
              <span>Cấu Hình Máy In Nhiệt (USB Rongta / Sunmi D2 POS)</span>
            </div>

            <button
              onClick={onConnectUSBPrinter}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                usbConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-stone-900 text-amber-400 hover:bg-stone-800'
              }`}
            >
              <Usb className="w-3.5 h-3.5" />
              {usbConnected ? 'USB Đã Kết Nối' : 'Kết Nối Máy In USB (Rongta/ESC-POS)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Loại Máy In Ưu Tiên:</label>
              <select
                value={formData.printerType}
                onChange={(e) => setFormData({ ...formData, printerType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="usb">Máy In USB Thermal ESC-POS (Rongta RP335UL)</option>
                <option value="sunmi">Máy In Tích Hợp Sunmi D2 (JS Bridge)</option>
                <option value="browser">Mở Cửa Sổ Trình Duyệt (Standard Print)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Khổ Giấy In Nhiệt:</label>
              <select
                value={formData.paperWidth}
                onChange={(e) => setFormData({ ...formData, paperWidth: Number(e.target.value) as any })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value={80}>80mm (Khổ POS Chuẩn Rongta / Sunmi)</option>
                <option value={58}>58mm (Khổ Mini Cầm Tay)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.enableDualBill}
                  onChange={(e) => setFormData({ ...formData, enableDualBill: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-extrabold text-stone-900">
                  Tự động in 2 Bill (1 Bill Khách + 1 Bill Bếp)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleTestUSBPrint}
              disabled={testingPrint}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs flex items-center gap-2"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>In Thử Phiếu Mẫu ESC/POS</span>
            </button>
            <span className="text-[11px] text-stone-400">
              Hỗ trợ tự động cắt giấy & tiếng Việt không dấu chuẩn máy in POS.
            </span>
          </div>
        </div>

        {/* SECTION 4: Google Sheets Online Database Integration */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-extrabold text-stone-900 text-sm">
              <Database className="w-4.5 h-4.5 text-emerald-600" />
              <span>Database Trực Tuyến Google Sheets (Tổng Doanh Thu Theo Ngày)</span>
            </div>

            <button
              onClick={() => setShowScriptModal(!showScriptModal)}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Xem Mã Google Apps Script Mẫu</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">
                Google Apps Script Webhook URL (Ghi đơn & Đọc tổng doanh thu):
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={formData.googleSheetWebhookUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetWebhookUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono text-stone-800 bg-emerald-50/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.autoSyncSheet}
                  onChange={(e) => setFormData({ ...formData, autoSyncSheet: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-extrabold text-stone-900">
                  Tự động đẩy đơn hàng mới lên Google Sheet khi thanh toán
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.googleSheetAutoFetchDaily ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, googleSheetAutoFetchDaily: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-extrabold text-stone-900">
                  Tự động tải tổng doanh thu trực tuyến từ Google Sheets
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleTestSheetConnection}
                disabled={testingSheet}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <Globe className={`w-4 h-4 ${testingSheet ? 'animate-spin' : ''}`} />
                <span>Kiểm Tra Kết Nối DB Doanh Thu Trực Tuyến</span>
              </button>
            </div>

            {sheetTestResult && (
              <div className="p-3 bg-stone-900 text-amber-300 rounded-xl font-mono text-xs border border-stone-800">
                {sheetTestResult}
              </div>
            )}
          </div>

          {/* Apps Script Code Modal / Viewer */}
          {showScriptModal && (
            <div className="mt-4 p-4 bg-stone-950 text-stone-100 rounded-2xl border border-stone-800 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <p className="font-bold text-xs text-amber-400">
                  Mã Google Apps Script Backend (Dán vào Google Sheets -&gt; Extensions -&gt; Apps Script)
                </p>
                <button
                  onClick={handleCopyScriptCode}
                  className="px-3 py-1 bg-amber-500 text-stone-950 font-black text-xs rounded-lg flex items-center gap-1 hover:bg-amber-400"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã Sao Chép!' : 'Sao Chép Mã'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-60 p-2 bg-stone-900 rounded-xl">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
