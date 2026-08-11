import { GoogleGenAI } from '@google/genai';

export interface AIModelOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
  isDefault?: boolean;
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Khuyên Dùng',
    description: 'Model mặc định với tốc độ phản hồi cực nhanh, tối ưu cho POS & tư vấn tức thì.',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Cao Cấp',
    description: 'Model thông minh cao cấp cho phân tích dữ liệu kinh doanh & suy luận chuyên sâu.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Ổn Định',
    description: 'Model thế hệ 2.5 ổn định, dự phòng hiệu quả khi các model khác hết quota.',
  },
];

export const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

const LOCAL_KEY_STORAGE = 'chagiobap_gemini_api_key';
const LOCAL_MODEL_STORAGE = 'chagiobap_gemini_model';

export function getGeminiApiKey(): string {
  return localStorage.getItem(LOCAL_KEY_STORAGE) || '';
}

export function saveGeminiApiKey(apiKey: string): void {
  localStorage.setItem(LOCAL_KEY_STORAGE, apiKey.trim());
}

export function getGeminiSelectedModel(): string {
  return localStorage.getItem(LOCAL_MODEL_STORAGE) || 'gemini-3-flash-preview';
}

export function saveGeminiSelectedModel(modelId: string): void {
  localStorage.setItem(LOCAL_MODEL_STORAGE, modelId);
}

export interface GeminiCallResult {
  success: boolean;
  text?: string;
  error?: string;
  modelUsed?: string;
}

/**
 * Call Gemini API with automatic fallback mechanism & retry logic
 */
export async function callGeminiAPI(
  prompt: string,
  userApiKey?: string,
  userModel?: string
): Promise<GeminiCallResult> {
  const apiKey = userApiKey || getGeminiApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'CHƯA CÓ API KEY: Vui lòng nhập Gemini API Key của bạn để sử dụng tính năng AI.',
    };
  }

  const primaryModel = userModel || getGeminiSelectedModel();
  // Build model attempt list starting with primaryModel, followed by remaining fallback models
  const modelAttempts = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastErrorMsg = '';

  for (const modelId of modelAttempts) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
      });

      if (response && response.text) {
        return {
          success: true,
          text: response.text,
          modelUsed: modelId,
        };
      }
    } catch (err: any) {
      console.warn(`Lỗi API Gemini với model ${modelId}:`, err);
      lastErrorMsg = err.message || String(err);
      if (lastErrorMsg.includes('API_KEY_INVALID') || lastErrorMsg.includes('API key not valid')) {
        return {
          success: false,
          error: 'API KEY KHÔNG HỢP LỆ: Vui lòng kiểm tra lại API key từ Google AI Studio.',
        };
      }
      // Continue to next model in fallback list
    }
  }

  return {
    success: false,
    error: `Đã thử tất cả các model đều thất bại. Nguyên nhân: ${lastErrorMsg || '429 RESOURCE_EXHAUSTED / Hết quota'}`,
  };
}
