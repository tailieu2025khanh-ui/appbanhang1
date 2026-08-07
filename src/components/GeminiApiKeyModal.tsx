import React, { useState } from 'react';
import { Key, ExternalLink, Check, Sparkles, X, ShieldAlert, Cpu } from 'lucide-react';
import { getStoredApiKey, saveApiKey } from '../services/aiAssistant';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const AI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Mặc Định (Khuyên Dùng)',
    description: 'Tốc độ phản hồi nhanh nhất, tối ưu tư vấn thực đơn và xử lý đơn hàng.',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Thông Minh Cao Cấp',
    description: 'Khả năng lập luận sâu, lập kế hoạch tiệc và phân tích doanh thu phức tạp.',
    isDefault: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Dự Phòng Nhẹ',
    description: 'Model ổn định cao, phản hồi nhanh khi các model preview quá tải.',
    isDefault: false,
  },
];

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  setSelectedModel,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [savedStatus, setSavedStatus] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    saveApiKey(apiKeyInput.trim());
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-[#E0E0D6] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <Key className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-wide">
                THIẾT LẬP GEMINI API KEY & MODEL AI
              </h2>
              <p className="text-xs text-[#D6D6C2] font-medium mt-0.5">
                Cấu hình API Key cá nhân để sử dụng các tính năng AI Studio
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs">
          {/* Section 1: API Key Input & Mandatory Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1A1A1A]">Nhập Google Gemini API Key (*):</label>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-rose-600 font-extrabold hover:underline flex items-center gap-1 text-[11.5px] bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>Lấy API key để sử dụng app</span>
                <ExternalLink className="w-3 h-3 text-rose-600" />
              </a>
            </div>

            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Dán API Key (VD: AIzaSy...)"
              className="w-full p-3 rounded-xl border border-[#E0E0D6] font-mono text-xs text-[#1A1A1A] bg-[#FAF9F6] focus:outline-hidden focus:ring-2 focus:ring-[#5A5A40]"
              required
            />
            <p className="text-[11px] text-[#808070] italic">
              * API Key được bảo mật và lưu vào localStorage trình duyệt của bạn.
            </p>
          </div>

          {/* Section 2: Model AI Cards Selection */}
          <div className="space-y-2.5">
            <label className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#5A5A40]" /> Chọn Model AI Ưu Tiên Mặc Định:
            </label>

            <div className="space-y-2">
              {AI_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-white border-[#E0E0D6] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#1A1A1A]">{model.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            model.isDefault
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#808070]">{model.description}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#5A5A40] border-[#5A5A40] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Info on Retry Fallback */}
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E0E0D6] flex items-start gap-2 text-[11px] text-[#5A5A40]">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Tự động kích hoạt cơ chế Retry & Fallback: Nếu model đang chọn quá tải/lỗi quota, hệ thống sẽ tự thử các model còn lại (gemini-3-flash-preview → gemini-3-pro-preview → gemini-2.5-flash).
            </span>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between border-t border-[#E0E0D6]">
            {savedStatus ? (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                <Check className="w-4 h-4" /> Đã lưu thành công!
              </span>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E0E0D6] text-[#1A1A1A] font-bold hover:bg-[#F5F5F0] transition-colors"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>LƯU CẤU HÌNH</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
