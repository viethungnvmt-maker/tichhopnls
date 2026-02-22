
import { GoogleGenAI, Type } from "@google/genai";
import { LessonPlanData, Skill } from "../types";

// Model fallback order as per AI_INSTRUCTIONS.md
const MODEL_FALLBACK_ORDER = [
  'gemini-2.5-flash',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.0-flash'
];

// Get API key from localStorage
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key');
  }
  return null;
};

// Set API key to localStorage
export const setApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key);
  }
};

// Get selected model from localStorage
export const getSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_model') || MODEL_FALLBACK_ORDER[0];
  }
  return MODEL_FALLBACK_ORDER[0];
};

// Set selected model to localStorage
export const setSelectedModel = (model: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_model', model);
  }
};

// Try to call API with model fallback
const tryWithFallback = async <T>(
  apiKey: string,
  startModel: string,
  apiCall: (ai: GoogleGenAI, model: string) => Promise<T>
): Promise<T> => {
  const startIndex = MODEL_FALLBACK_ORDER.indexOf(startModel);
  const modelsToTry = startIndex >= 0
    ? [...MODEL_FALLBACK_ORDER.slice(startIndex), ...MODEL_FALLBACK_ORDER.slice(0, startIndex)]
    : MODEL_FALLBACK_ORDER;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      return await apiCall(ai, model);
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to next model
    }
  }

  throw lastError || new Error('Tất cả các model đều thất bại');
};

export const analyzeLessonPlan = async (content: string, selectedSkill?: Skill): Promise<LessonPlanData> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Chưa có API Key. Vui lòng nhập API Key trong phần Cài đặt.");
  }

  const selectedModel = getSelectedModel();

  // Construct the system prompt based on the selected skill or use a default
  let roleContext = "";
  if (selectedSkill) {
    roleContext = `
    VAI TRÒ CỦA BẠN:
    ${selectedSkill.systemPrompt}
    
    HÃY ĐÓNG VAI CHUYÊN GIA NÀY ĐỂ PHÂN TÍCH GIÁO ÁN. Đừng chỉ đưa ra lời khuyên chung chung. Hãy đưa ra các ý tưởng đột phá, sáng tạo và mang đậm dấu ấn chuyên môn của bạn (ví dụ: Game Developer thì phải đề xuất Gamification, AI Architect thì đề xuất tư duy hệ thống/tool use).
    `;
  } else {
    roleContext = "VAI TRÒ: Bạn là một chuyên gia giáo dục số hàng đầu (Digital Pedagogy Expert).";
  }

  return tryWithFallback(apiKey, selectedModel, async (ai, model) => {
    const response = await ai.models.generateContent({
      model: model,
      contents: `${roleContext}

    Hãy phân tích giáo án sau và tích hợp năng lực số (Digital Competency) theo KHUNG NĂNG LỰC SỐ DÀNH CHO HỌC SINH PHỔ THÔNG VIỆT NAM.
    
    KHUNG NĂNG LỰC SỐ GỒM 6 MIỀN:
    1. Khai thác dữ liệu và thông tin (mã: 1.x)
       - 1.1: Duyệt, tìm kiếm, lọc dữ liệu và nội dung số
       - 1.2: Đánh giá dữ liệu, thông tin và nội dung số
       - 1.3: Quản lý dữ liệu, thông tin và nội dung số
    2. Giao tiếp và Hợp tác (mã: 2.x)
       - 2.1: Tương tác qua công nghệ số
       - 2.2: Chia sẻ qua công nghệ số
       - 2.3: Tham gia với tư cách công dân qua công nghệ số
       - 2.4: Hợp tác qua công nghệ số
       - 2.5: Chuẩn mực giao tiếp
       - 2.6: Quản lý định danh số
    3. Sáng tạo nội dung số (mã: 3.x)
       - 3.1: Phát triển nội dung số
       - 3.2: Tích hợp và tái tạo nội dung số
       - 3.3: Bản quyền và giấy phép
       - 3.4: Lập trình
    4. An toàn số (mã: 4.x)
       - 4.1: Bảo vệ thiết bị
       - 4.2: Bảo vệ dữ liệu cá nhân và quyền riêng tư
       - 4.3: Bảo vệ sức khỏe và phúc lợi
       - 4.4: Bảo vệ môi trường
    5. Giải quyết vấn đề (mã: 5.x)
       - 5.1: Giải quyết vấn đề kỹ thuật
       - 5.2: Xác định nhu cầu và giải pháp công nghệ
       - 5.3: Sử dụng công nghệ số một cách sáng tạo
       - 5.4: Xác định khoảng cách năng lực số
    6. Ứng dụng AI (mã: 6.x) - Năng lực mới
       - 6.1: Sử dụng công cụ AI hỗ trợ học tập
       - 6.2: Đánh giá và kiểm chứng thông tin từ AI

    QUY TẮC MÃ CHỈ THỊ (frameworkRef):
    Format: [Miền].[Năng lực].[Cấp độ][Số thứ tự][Ký hiệu]
    - Cấp độ: TC (Tiểu học 1-5), TH (THCS 6-9), PT (THPT 10-12)
    - Ví dụ: 1.3.TC1a, 2.1.TH2b, 3.1.PT1a, 5.3.TH1a...
    
    NỘI DUNG GIÁO ÁN:
    ${content}

    YÊU CẦU:
    1. Tóm tắt ngắn gọn giáo án.
    2. Đề xuất ít nhất 3 mục tiêu năng lực số cụ thể. VỚI MỖI MỤC TIÊU, BẮT BUỘC ghi rõ mã chỉ thị (frameworkRef) theo định dạng trên.
    3. Đề xuất các công cụ số phù hợp (ví dụ: Kahoot, Quizizz, Canva, Google Earth, Padlet...).
    4. Chia giáo án thành 4 hoạt động chính: Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng. Với mỗi hoạt động:
       a. Đề xuất 1 hoạt động số cụ thể giúp tích hợp CNTT hiệu quả.
       b. BẮT BUỘC phân loại loại NLS (nlsType) cho hoạt động đó. Chỉ chọn 1 trong 4 giá trị:
          - "TỔ CHỨC NLS" — nếu hoạt động liên quan đến tổ chức, sắp xếp, quản lý dữ liệu/thông tin số
          - "NỘI DUNG NLS" — nếu hoạt động liên quan đến nội dung, kiến thức số, ví dụ minh họa
          - "SẢN PHẨM NLS" — nếu hoạt động yêu cầu học sinh tạo ra sản phẩm số
          - "MỤC TIÊU NLS" — nếu hoạt động tập trung vào mục tiêu năng lực số cần đạt`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            grade: { type: Type.STRING },
            subject: { type: Type.STRING },
            summary: { type: Type.STRING },
            digitalGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  description: { type: Type.STRING },
                  frameworkRef: { type: Type.STRING }
                },
                required: ["id", "description"]
              }
            },
            recommendedTools: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  originalContent: { type: Type.STRING },
                  digitalActivity: { type: Type.STRING },
                  digitalTools: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  nlsType: { type: Type.STRING }
                },
                required: ["id", "name", "digitalActivity", "nlsType"]
              }
            }
          },
          required: ["title", "digitalGoals", "activities"]
        }
      }
    });

    // Handle markdown code blocks if the model includes them despite responseMimeType
    let text = response.text || "{}";
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "");
    }

    const data = JSON.parse(text);

    return {
      ...data,
      originalFullText: content
    } as LessonPlanData;
  });
};
