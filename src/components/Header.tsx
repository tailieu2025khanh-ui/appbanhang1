import React from 'react';
import { Shift, StoreConfig } from '../types/pos';
import {
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  BarChart3,
  BookOpen,
  Clock,
  Settings,
  Wifi,
  Printer,
  ShoppingBag,
  FileSpreadsheet,
  Sparkles,
  Trophy,
  FileText,
  Key,
} from 'lucide-react';

export type ViewTab = 'pos' | 'tables' | 'kds' | 'reports' | 'menu' | 'shift' | 'settings';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  shift: Shift;
  storeConfig: StoreConfig;
  kitchenPendingCount: number;
  onOpenGoogleSheetsModal: () => void;
  onOpenAIAssistantModal: () => void;
  onOpenTrainingGame: () => void;
  onExportDocxReport: () => void;
  onExportDocxMenu: () => void;
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  shift,
  storeConfig,
  kitchenPendingCount,
  onOpenGoogleSheetsModal,
  onOpenAIAssistantModal,
  onOpenTrainingGame,
  onExportDocxReport,
  onExportDocxMenu,
  onOpenApiKeyModal,
}) => {
  const isSheetConnected = Boolean(storeConfig.googleSheetsUrl && storeConfig.googleSheetsUrl.trim().length > 0);

  return (
    <header className="bg-white text-[#1A1A1A] border-b border-[#E0E0D6] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight text-[#1A1A1A] tracking-wide">
              {storeConfig.storeName}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-[#808070] font-medium">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-600" />
                {storeConfig.wifiName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Printer className="w-3 h-3 text-[#5A5A40]" />
                ESC/POS ({storeConfig.paperSize})
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-2xl border border-[#E0E0D6]">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pos'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đặt Món (POS)</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tables'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Sơ Đồ Bàn</span>
          </button>

          <button
            onClick={() => setActiveTab('kds')}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'kds'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Màn Bếp</span>
            {kitchenPendingCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {kitchenPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo Cáo</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Thực Đơn</span>
          </button>

          <button
            onClick={() => setActiveTab('shift')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shift'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Ca Làm Việc</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#808070] hover:text-[#1A1A1A] hover:bg-[#E0E0D6]/50'
            }`}
            title="Cấu hình hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>

        {/* Right Controls & Mandatory API Key Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Permanent Settings (API Key) Button with Red Text required by AI_INSTRUCTIONS.md */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs transition-all shadow-2xs group"
            title="Cấu hình Gemini API Key & Model AI"
          >
            <Key className="w-4 h-4 text-rose-600 group-hover:rotate-12 transition-transform" />
            <span className="text-rose-600 font-extrabold whitespace-nowrap">
              Lấy API key để sử dụng app
            </span>
          </button>

          {/* AI Sales Assistant Button */}
          <button
            type="button"
            onClick={onOpenAIAssistantModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs transition-all shadow-2xs"
            title="Trợ Lý AI Tư Vấn Bán Hàng"
          >
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="hidden lg:inline">Trợ Lý AI</span>
          </button>

          {/* Cashier Training Game Button */}
          <button
            type="button"
            onClick={onOpenTrainingGame}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#2C2C24] hover:bg-[#3E3E34] text-amber-400 font-extrabold text-xs transition-all shadow-2xs"
            title="Game Luyện Tập Tốc Độ Thu Ngân"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Luyện POS</span>
          </button>

          {/* Export DOCX Button */}
          <button
            type="button"
            onClick={onExportDocxReport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 font-extrabold text-xs transition-all"
            title="Xuất Báo Cáo Doanh Thu Ra File Word (.docx)"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span className="hidden lg:inline">Xuất Word</span>
          </button>

          {/* Google Sheets DB Quick Button */}
          <button
            type="button"
            onClick={onOpenGoogleSheetsModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              isSheetConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
            }`}
            title="Cấu hình kết nối Google Sheet DataBase"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isSheetConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="hidden md:inline">
              {isSheetConnected ? 'Sheet DB' : 'Kết Nối DB'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar below header */}
      <div className="xl:hidden flex items-center justify-around bg-[#FAF9F6] border-t border-[#E0E0D6] p-1 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('pos')}
          className={`p-2 flex flex-col items-center text-[10px] shrink-0 ${
            activeTab === 'pos' ? 'text-[#5A5A40] font-bold' : 'text-[#808070]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Đặt món</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`p-2 flex flex-col items-center text-[10px] shrink-0 ${
            activeTab === 'tables' ? 'text-[#5A5A40] font-bold' : 'text-[#808070]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Sơ đồ bàn</span>
        </button>

        <button
          onClick={onOpenApiKeyModal}
          className="p-2 flex flex-col items-center text-[10px] text-rose-600 font-extrabold shrink-0"
        >
          <Key className="w-4 h-4 text-rose-600" />
          <span>Lấy API key</span>
        </button>

        <button
          onClick={onOpenAIAssistantModal}
          className="p-2 flex flex-col items-center text-[10px] text-amber-700 font-bold shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Trợ lý AI</span>
        </button>

        <button
          onClick={onOpenTrainingGame}
          className="p-2 flex flex-col items-center text-[10px] text-[#2C2C24] font-bold shrink-0"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Luyện POS</span>
        </button>

        <button
          onClick={onOpenGoogleSheetsModal}
          className="p-2 flex flex-col items-center text-[10px] text-emerald-700 font-bold shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Sheet DB</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`p-2 flex flex-col items-center text-[10px] shrink-0 ${
            activeTab === 'reports' ? 'text-[#5A5A40] font-bold' : 'text-[#808070]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Báo cáo</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`p-2 flex flex-col items-center text-[10px] shrink-0 ${
            activeTab === 'settings' ? 'text-[#5A5A40] font-bold' : 'text-[#808070]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt</span>
        </button>
      </div>
    </header>
  );
};
