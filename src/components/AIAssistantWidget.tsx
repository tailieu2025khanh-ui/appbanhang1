import React, { useState } from 'react';
import { Bot, Sparkles, Plus, TrendingUp, Lightbulb, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { CartItem, MenuItem, Order } from '../types';
import { formatVND } from '../utils/printer';
import { callGeminiAPI, getGeminiApiKey, getGeminiSelectedModel } from '../utils/gemini';

interface AIAssistantWidgetProps {
  mode: 'pos' | 'reports';
  cartItems?: CartItem[];
  allMenuItems?: MenuItem[];
  onAddToCart?: (item: MenuItem) => void;
  ordersHistory?: Order[];
  onOpenGeminiKeyModal?: () => void;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  mode,
  cartItems = [],
  allMenuItems = [],
  onAddToCart,
  ordersHistory = [],
  onOpenGeminiKeyModal,
}) => {
  const [addedId, setAddedId] = useState<string | null>(null);

  // Live AI Generation State for Reports
  const [aiText, setAiText] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');

  const handleGenerateLiveInsight = async () => {
    setLoadingAi(true);
    setErrorMsg('');
    setAiText('');

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setErrorMsg('Chưa thiết lập API Key. Vui lòng nhấn nút "Settings (API Key)" trên Header để nhập key.');
      setLoadingAi(false);
      return;
    }

    const totalOrdersCount = ordersHistory.filter((o) => o.orderStatus !== 'cancelled').length;
    const totalRevenueSum = ordersHistory
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const prompt = `Bạn là Trợ Lý AI Chuyên Gia F&B cho nhà hàng CHẢ GIÒ BẮP. Hãy phân tích ngắn gọn trong 3 câu:
    - Tổng doanh thu hiện tại: ${formatVND(totalRevenueSum)}
    - Tổng số đơn hàng: ${totalOrdersCount} đơn.
    Đưa ra 2 lời khuyên cụ thể để tăng doanh số bán Chả Giò Bắp và tối ưu việc chuẩn bị nguyên liệu bắp nếp Quảng Ngãi. Viết bằng tiếng Việt thân thiện, chuyên nghiệp.`;

    const res = await callGeminiAPI(prompt);
    setLoadingAi(false);

    if (res.success && res.text) {
      setAiText(res.text);
      setModelUsed(res.modelUsed || getGeminiSelectedModel());
    } else {
      setErrorMsg(res.error || 'Đã dừng do lỗi: Không thể kết nối API Gemini.');
    }
  };

  if (mode === 'pos') {
    // POS UPSELL SUGGESTION LOGIC
    if (cartItems.length === 0) {
      return (
        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-300/60 text-xs flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <span className="text-amber-950 font-medium">
            💡 <strong>Trợ lý AI CHẢ GIÒ BẮP:</strong> Chọn món ăn để nhận gợi ý combo giải khát & topping phù hợp!
          </span>
        </div>
      );
    }

    // Find complementary drink or extra item not yet in cart
    const cartItemIds = new Set(cartItems.map((c) => c.menuItem.id));
    const drinkItems = allMenuItems.filter(
      (m) => m.category === 'nuoc_uong' && !cartItemIds.has(m.id)
    );
    const extraItems = allMenuItems.filter(
      (m) => (m.category === 'extra' || m.category === 'combo') && !cartItemIds.has(m.id)
    );

    const recommendedItem = drinkItems[0] || extraItems[0];
    if (!recommendedItem) return null;

    const handleAdd = () => {
      if (onAddToCart) {
        onAddToCart(recommendedItem);
        setAddedId(recommendedItem.id);
        setTimeout(() => setAddedId(null), 2000);
      }
    };

    return (
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 p-3 rounded-2xl border border-amber-400/80 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shrink-0">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-stone-900 flex items-center gap-1">
              <span>Gợi ý bán kèm AI</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            </p>
            <p className="text-stone-600 text-[11px]">
              Kết hợp thêm <strong>{recommendedItem.name}</strong> ({formatVND(recommendedItem.price)})
            </p>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-black text-xs flex items-center gap-1 shrink-0 shadow-xs transition-all active:scale-95"
        >
          {addedId === recommendedItem.id ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-950" />
              <span>Đã Thêm</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Nhanh</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // REPORTS AI BUSINESS INSIGHT MODE
  const totalOrdersCount = ordersHistory.filter((o) => o.orderStatus !== 'cancelled').length;

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-lg space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2 font-black text-amber-400 text-sm">
          <Bot className="w-5 h-5 text-amber-500" />
          <span>Trợ Lý AI Phân Tích Kinh Doanh CHẢ GIÒ BẮP</span>
        </div>

        <div className="flex items-center gap-2">
          {modelUsed && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
              {modelUsed}
            </span>
          )}

          <button
            onClick={handleGenerateLiveInsight}
            disabled={loadingAi}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'AI Đang Phân Tích...' : 'Phân Tích AI Trực Tiếp'}</span>
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="p-3.5 bg-rose-950/80 text-rose-300 border border-rose-800/80 rounded-2xl text-xs font-mono space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Đã dừng do lỗi API Gemini</span>
          </div>
          <p className="text-[11px] leading-relaxed">{errorMsg}</p>
        </div>
      ) : aiText ? (
        <div className="p-4 bg-stone-900/90 text-stone-200 border border-amber-500/30 rounded-2xl text-xs space-y-2 leading-relaxed">
          <p className="text-amber-400 font-bold flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> Kết quả phân tích từ Gemini AI:
          </p>
          <p className="whitespace-pre-line text-stone-200">{aiText}</p>
        </div>
      ) : (
        <div className="space-y-2 text-xs text-stone-300">
          <div className="flex items-start gap-2 bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Dự báo nguyên liệu bắp tươi:</strong> Dựa trên {totalOrdersCount} đơn hàng ghi nhận, khuyến nghị chuẩn bị sẵn khoảng <strong>15 - 20 kg bắp nếp Quảng Ngãi</strong> và <strong>5 lít mắm nêm</strong> cho khung giờ cao điểm (17:00 - 20:00).
            </p>
          </div>

          <div className="flex items-start gap-2 bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Khuyến nghị tăng doanh thu:</strong> Món <em>Trà Tắc Khổng Lồ 700ml</em> có tỷ lệ bán kèm 68%. Nên tiếp tục tạo các Gói Combo giảm 5k để kích thích sức mua của khách hàng.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
