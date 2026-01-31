
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Sanitizes the response string by removing potential markdown code block wrappers.
 */
const sanitizeJsonResponse = (text: string): string => {
  if (!text) return "";
  // Removes ```json ... ``` and any leading/trailing whitespace
  return text.replace(/```json\n?|```/g, '').trim();
};

export const analyzeStudyMaterial = async (text: string): Promise<{ 
  summary: string, 
  keyPoints: string[], 
  insights: string, 
  questions: any[] 
}> => {
  if (!process.env.API_KEY) {
    throw new Error("System Error: AI credentials missing. Please refresh or contact admin.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{
      role: 'user',
      parts: [{
        text: `Analyze this material and return a structured JSON report.
        
        INPUT MATERIAL:
        ${text}`
      }]
    }],
    config: {
      systemInstruction: "You are an Elite Academic Intelligence Agent. Extract the core summary, 5 key points, 1 deep insight, and 5 multiple choice questions. Format: JSON only. No prose. No conversational filler.",
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          insights: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"],
              propertyOrdering: ["question", "options", "correctIndex", "explanation"]
            }
          }
        },
        required: ["summary", "keyPoints", "insights", "questions"],
        propertyOrdering: ["summary", "keyPoints", "insights", "questions"]
      }
    }
  });

  const outputText = response.text;
  if (!outputText) {
    throw new Error("The Intelligence Core failed to synthesize a report. The content may be too short or complex.");
  }

  try {
    const cleanJson = sanitizeJsonResponse(outputText);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Critical JSON failure:", e, "Payload:", outputText);
    throw new Error("Decoding Error: The system produced a non-standard report. Please retry.");
  }
};

export const ocrImage = async (base64Data: string, mimeType: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("Credentials missing.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Act as a high-precision OCR engine. Transcribe every word in this image exactly." }
      ]
    }]
  });
  
  return response.text || '';
};
