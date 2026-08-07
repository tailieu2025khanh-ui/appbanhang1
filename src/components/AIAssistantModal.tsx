import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Key,
  Bot,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Zap,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import {
  askGeminiAIAssistant,
  getStoredApiKey,
  saveApiKey,
  AIMessage,
} from '../services/aiAssistant';
import { MenuItem, StoreConfig } from '../types/pos';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  storeConfig: StoreConfig;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  storeConfig,
}) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);
  const [promptInput, setPromptInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sender: 'ai',
      text: `Xin chào! Tôi là Trợ Lý AI của cửa hàng ${storeConfig.storeName}. Tôi có thể giúp bạn tư vấn chọn món, thiết kế combo tiệc, hay tính chi phí suất ăn cho khách hàng. Bạn cần hỗ trợ gì hôm nay?`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    saveApiKey(apiKey.trim());
    setShowKeyInput(false);
    setErrorMsg(null);
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || promptInput;
    if (!query.trim() || loading) return;

    if (!apiKey.trim()) {
      setShowKeyInput(true);
      setErrorMsg('Vui lòng nhập API Key để bắt đầu sử dụng Trợ lý AI!');
      return;
    }

    const userMsg: AIMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await askGeminiAIAssistant(query, menuItems, storeConfig, apiKey);
      const aiMsg: AIMessage = {
        sender: 'ai',
        text: res.text,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã dừng do lỗi API.');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'Gợi ý combo 4 người ăn no giòn rụm?',
    'Thiết kế thực đơn tiệc 15 người với ngân sách 1 triệu?',
    'Món chả giò nào bán chạy nhất & ăn kèm nước nào ngon?',
    'Có món chả giò nào thích hợp cho người ăn chay không?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E0E0D6] flex flex-col h-[85vh] animate-fadeIn">
        {/* Header */}
        <div className="bg-[#5A5A40] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight tracking-wide flex items-center gap-2">
                TRỢ LÝ AI TƯ VẤN BÁN HÀNG CHẢ GIÒ
              </h2>
              <p className="text-[11px] text-[#D6D6C2] font-medium">
                Sử dụng Gemini AI Studio • Tự động chuyển đổi Model khi quá tải
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-colors"
              title="Cài đặt API Key Gemini"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">API Key</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Modal Banner / Drawer if needed */}
        {showKeyInput && (
          <form
            onSubmit={handleSaveApiKey}
            className="bg-amber-50 border-b border-amber-200 p-4 space-y-2 animate-fadeIn text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-700" /> Cấu Hình API Key Google Gemini (Bắt buộc)
              </span>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-rose-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
              >
                Lấy API key để sử dụng app <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán API Key từ AI Studio (AIzaSy...)"
                className="flex-1 p-2.5 rounded-xl border border-amber-300 font-mono text-xs text-[#1A1A1A] bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0"
              >
                Lưu Key
              </button>
            </div>
            <p className="text-[10.5px] text-amber-800 italic">
              * Key được lưu bảo mật trong trình duyệt của bạn (localStorage). Thử tự động chuỗi Model: gemini-3-flash-preview, gemini-3-pro-preview, gemini-2.5-flash.
            </p>
          </form>
        )}

        {/* Chat History Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAF9F6]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              )}

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#5A5A40] text-white rounded-tr-none shadow-xs'
                    : 'bg-white text-[#1A1A1A] border border-[#E0E0D6] rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`mt-1 text-[9.5px] flex items-center justify-between gap-2 ${
                    msg.sender === 'user' ? 'text-gray-300' : 'text-gray-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && (
                    <span className="font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-xs border border-emerald-200">
                      {msg.modelUsed}
                    </span>
                  )}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#2C2C24] text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] bg-white p-3 rounded-2xl border border-[#E0E0D6] w-max animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>AI đang suy nghĩ và tính toán thực đơn...</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 border border-rose-300 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Đã dừng do lỗi API / Quá tải Quota</p>
                <p className="font-normal mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-2.5 bg-white border-t border-[#E0E0D6] overflow-x-auto flex gap-1.5 shrink-0">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendPrompt(prompt)}
              className="px-3 py-1.5 rounded-xl bg-[#F5F5F0] hover:bg-[#E0E0D6] text-[#5A5A40] text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-600" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="p-3 bg-white border-t border-[#E0E0D6] flex gap-2"
        >
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Hỏi Trợ lý AI (VD: Combo chả giò ngon cho 5 người ăn?)..."
            className="flex-1 p-3 rounded-2xl border border-[#E0E0D6] text-xs text-[#1A1A1A] bg-[#FAF9F6] focus:outline-hidden focus:ring-2 focus:ring-[#5A5A40]"
          />
          <button
            type="submit"
            disabled={loading || !promptInput.trim()}
            className="px-5 py-3 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A34] text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Gửi</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
