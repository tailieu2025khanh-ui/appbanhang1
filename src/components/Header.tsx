import {
  ShoppingBag,
  LayoutGrid,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Printer,
  FileSpreadsheet,
  Clock,
  Usb,
  Smartphone,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Key,
} from 'lucide-react';
import { ActiveTab, StoreConfig } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: StoreConfig;
  usbConnected: boolean;
  onConnectUSBPrinter: () => void;
  pendingKDSCount: number;
  onOpenMenuQuiz?: () => void;
  onOpenGeminiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  usbConnected,
  onConnectUSBPrinter,
  pendingKDSCount,
  onOpenMenuQuiz,
  onOpenGeminiKeyModal,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isSunmiDetected, setIsSunmiDetected] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.SunmiPrinter || window.sunmiInnerPrinter) {
      setIsSunmiDetected(true);
    }
  }, []);

  const navItems = [
    {
      id: 'pos' as ActiveTab,
      label: 'Đặt Món (POS)',
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'tables' as ActiveTab,
      label: 'Sơ Đồ Bàn',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'kds' as ActiveTab,
      label: 'Màn Hình Bếp',
      icon: ChefHat,
      badge: pendingKDSCount > 0 ? pendingKDSCount : null,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Lịch Sử Bill',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'menu' as ActiveTab,
      label: 'Thực Đơn',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo Cáo',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Cài Đặt',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <header className="bg-white text-[#1A1A1A] border-b-4 border-[#FF6B35] sticky top-0 z-40 shadow-[0_4px_12px_rgba(26,26,26,0.08)]">
      {/* Top Bar Status Strip */}
      <div className="bg-[#1A1A1A] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#FF6B35] text-white">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#F2A900] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7DBE52] animate-pulse border border-[#1A1A1A]"></span>
            {config.storeName} - F&B POS 2026
          </span>
          <span className="hidden sm:inline text-stone-500">|</span>
          <span className="hidden sm:inline text-stone-300 font-medium">{config.slogan}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Gemini API Key Settings Button */}
          {onOpenGeminiKeyModal && (
            <button
              onClick={onOpenGeminiKeyModal}
              title="Thiết lập Gemini AI Model & Nhập API Key"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] border border-[#1A1A1A] shadow-xs active:scale-95 animate-pulse"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>Settings (API Key) - <span className="underline text-amber-200">Lấy API key để sử dụng app</span></span>
            </button>
          )}

          {/* Staff Quiz Button */}
          {onOpenMenuQuiz && (
            <button
              onClick={onOpenMenuQuiz}
              title="Mở trò chơi trắc nghiệm đào tạo thực đơn cho nhân viên"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all font-black text-[11px] border border-[#1A1A1A] shadow-xs active:scale-95"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Đào Tạo Nhân Viên</span>
            </button>
          )}

          {/* USB Printer Status */}
          <button
            onClick={onConnectUSBPrinter}
            title="Nhấp để kết nối Máy in Nhiệt USB (Rongta/ESC-POS)"
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg transition-all font-bold text-[11px] border border-[#1A1A1A] ${
              usbConnected
                ? 'bg-[#7DBE52] text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-300'
            }`}
          >
            <Usb className="w-3.5 h-3.5" />
            {usbConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>USB Máy In (Sẵn Sàng)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Kết Nối USB Máy In</span>
              </>
            )}
          </button>

          {/* Sunmi D2 Indicator */}
          {isSunmiDetected && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F2A900] text-[#1A1A1A] border border-[#1A1A1A] text-[11px] font-black">
              <Smartphone className="w-3.5 h-3.5" />
              Sunmi D2 POS
            </span>
          )}

          {/* 2-Bill Mode Indicator */}
          <span
            className={`hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-[#1A1A1A] ${
              config.enableDualBill
                ? 'bg-[#FF6B35] text-white'
                : 'bg-stone-800 text-stone-300'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            {config.enableDualBill ? 'In 2 Bill (Khách + Bếp)' : 'In 1 Bill'}
          </span>

          {/* Google Sheets Sync Indicator */}
          {config.googleSheetWebhookUrl && (
            <span
              onClick={() => setActiveTab('reports')}
              cursor-pointer="true"
              title="Cơ sở dữ liệu Google Sheets trực tuyến - Nhấp để xem báo cáo doanh thu"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white border border-[#1A1A1A] text-[11px] font-bold cursor-pointer hover:bg-emerald-500 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets DB Online</span>
            </span>
          )}

          {/* Realtime Clock */}
          <div className="flex items-center gap-1 text-[#F2A900] font-mono text-xs font-bold pl-1">
            <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
            {timeStr}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('pos')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-[#F2A900] border-2 border-[#1A1A1A] flex items-center justify-center text-[#1A1A1A] font-black text-xl shadow-[3px_3px_0px_0px_#1A1A1A] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
            🌽
          </div>
          <div>
            <h1 className="font-black text-xl text-[#1A1A1A] tracking-tighter uppercase leading-none group-hover:text-[#FF6B35] transition-colors">
              CHẢ GIÒ BẮP <span className="text-[#FF6B35]">2026</span>
            </h1>
            <p className="text-[11px] text-stone-600 font-bold">POS F&B & DB Google Sheets Trực Tuyến</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all relative ${
                  isActive
                    ? 'bg-[#FF6B35] text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5'
                    : 'text-[#1A1A1A] hover:bg-[#FFF4E0] border-2 border-transparent hover:border-[#1A1A1A] rounded-xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#1A1A1A]'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="w-5 h-5 rounded-full bg-[#FF6B35] text-white text-[10px] font-black flex items-center justify-center animate-bounce border border-[#1A1A1A] shadow-[2px_2px_0px_0px_#1A1A1A]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
