
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Sanitizes the response string by removing potential markdown code block wrappers.
 */
const sanitizeJsonResponse = (text: string): string => {
  if (!text) return "";
  return text.replace(/```json\n?|```/g, '').trim();
};

export const analyzeStudyMaterial = async (text: string): Promise<{ 
  summary: string, 
  keyPoints: string[], 
  insights: string, 
  questions: any[] 
}> => {
  const apiKey = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) {
    throw new Error("System Error: AI credentials missing. Please refresh or contact admin.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      role: 'user',
      parts: [{
        text: `Perform an academic analysis on this content and return a structured JSON report.
        
        INPUT MATERIAL:
        ${text}`
      }]
    }],
    config: {
      systemInstruction: "You are an Elite Academic Intelligence Agent. Extract a summary, 5 key points, 1 mnemonic insight, and 5 MCQ practice questions. Format as JSON. No conversational text.",
      responseMimeType: "application/json",
      // Removed thinkingConfig because explicit 0 value can trigger errors on some models
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
    throw new Error("The Intelligence Core failed to synthesize a report.");
  }

  try {
    const cleanJson = sanitizeJsonResponse(outputText);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Critical JSON failure:", e, "Payload:", outputText);
    throw new Error("Decoding Error: The system produced a non-standard report.");
  }
};

export const ocrImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const apiKey = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) throw new Error("Credentials missing.");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "OCR transcription only. Return raw text found in image." }
      ]
    }]
  });
  
  return response.text || '';
};
