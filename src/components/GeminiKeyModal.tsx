import React, { useState } from 'react';
import { Bot, Key, ExternalLink, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import {
  AI_MODELS,
  getGeminiApiKey,
  saveGeminiApiKey,
  getGeminiSelectedModel,
  saveGeminiSelectedModel,
} from '../utils/gemini';

interface GeminiKeyModalProps {
  onClose: () => void;
  onSaved?: () => void;
  required?: boolean;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  onClose,
  onSaved,
  required = false,
}) => {
  const [apiKey, setApiKey] = useState<string>(getGeminiApiKey());
  const [selectedModel, setSelectedModel] = useState<string>(getGeminiSelectedModel());
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setErrorMsg('Vui lòng nhập API Key để tiếp tục!');
      return;
    }

    saveGeminiApiKey(apiKey);
    saveGeminiSelectedModel(selectedModel);
    setSuccessMsg('Đã lưu cấu hình Gemini API thành công!');
    setErrorMsg('');

    setTimeout(() => {
      if (onSaved) onSaved();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 border-2 border-stone-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-lg flex items-center gap-2">
                <span>Thiết Lập Model AI & API Key</span>
                <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  Gemini API
                </span>
              </h3>
              <p className="text-xs text-stone-500">Cấu hình API Key cá nhân để sử dụng Trợ Lý AI CHẢ GIÒ BẮP</p>
            </div>
          </div>

          {!required && (
            <button onClick={onClose} className="p-1.5 rounded-full text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Model Selector Cards */}
        <div className="space-y-2.5">
          <label className="text-xs font-black text-stone-800 uppercase tracking-wider block">
            1. Chọn Model AI Ưu Tiên:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {AI_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 text-stone-900 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-stone-900">{model.name}</span>
                      {model.badge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            model.isDefault
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-900 text-amber-400'
                          }`}
                        >
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{model.description}</p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-stone-950' : 'border-stone-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-stone-950" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Key Input Section */}
        <div className="space-y-2 text-xs">
          <label className="text-xs font-black text-stone-800 uppercase tracking-wider block">
            2. Nhập Gemini API Key Của Bạn:
          </label>

          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border-2 border-stone-300 rounded-xl font-mono text-stone-900 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
            <span className="text-amber-950 font-medium">
              💡 Chưa có API Key? Lấy API Key miễn phí từ Google AI Studio:
            </span>
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold rounded-lg inline-flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Lấy Key Tại Đây</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-100 border border-rose-300 text-rose-900 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {!required && (
            <button
              onClick={onClose}
              className="py-3 px-5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-2xl"
            >
              Hủy
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lưu Cấu Hình AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
