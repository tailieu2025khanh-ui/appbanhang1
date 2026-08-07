import { GoogleGenAI } from '@google/genai';
import { MenuItem, StoreConfig } from '../types/pos';

const MODELS_FALLBACK_LIST = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

export interface AIMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || '';
  } catch (e) {
    return '';
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem('gemini_api_key', key.trim());
  } catch (e) {
    console.error(e);
  }
}

/**
 * Call Gemini AI with automatic Model Fallback & Retry
 */
export async function askGeminiAIAssistant(
  userPrompt: string,
  menuItems: MenuItem[],
  storeConfig: StoreConfig,
  customApiKey?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = customApiKey || getStoredApiKey();

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      'Chưa cấu hình API Key. Vui lòng lấy API key từ https://aistudio.google.com/api-keys và nhập vào ô cài đặt API Key!'
    );
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // System instruction describing the app and menu
  const menuSummary = menuItems
    .map(
      (m) =>
        `- [${m.sku}] ${m.name} (${m.category}): ${m.price.toLocaleString('vi-VN')}đ - ${m.description || 'Không có mô tả'}`
    )
    .join('\n');

  const systemInstruction = `
Bạn là Trợ Lý AI Chuyên Nghiệp Bán Hàng & Tư Vấn Thực Đơn của cửa hàng "${storeConfig.storeName}".
Địa chỉ: ${storeConfig.address}
Hotline: ${storeConfig.phone}

Danh sách thực đơn hiện tại của quán:
${menuSummary}

Nhiệm vụ của bạn:
1. Tư vấn món ăn, combo phù hợp cho khách (ví dụ: nhóm 2 người, 4 người, tiệc 10 người, suất ăn chay, đồ uống giải nhiệt).
2. Gợi ý phối món (Chả giò mặn + Nước mía tắc / Trà tắc xí muội).
3. Tính toán nhanh tổng chi phí suất ăn theo ngân sách khách đưa ra.
4. Trả lời bằng tiếng Việt thân thiện, lịch sự, hào hứng và ngắn gọn rõ ràng.
`;

  let lastError: any = null;

  for (const modelName of MODELS_FALLBACK_LIST) {
    try {
      console.log(`Đang thử gọi Gemini API với model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { text: `Câu hỏi từ thu ngân/khách hàng: ${userPrompt}` },
            ],
          },
        ],
      });

      if (response && response.text) {
        return {
          text: response.text,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} gặp lỗi:`, err.message || err);
      lastError = err;
      // Continue loop to try next model in fallback list
    }
  }

  const errorMsg = lastError?.message || lastError?.statusText || String(lastError);
  throw new Error(`Tất cả các model AI đều thất bại. Chi tiết lỗi: ${errorMsg}`);
}
