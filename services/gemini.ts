
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Sanitizes the response string by removing potential markdown code block wrappers.
 */
const sanitizeJsonResponse = (text: string): string => {
  if (!text) return "";
  return text.replace(/```json\n?|```/g, '').trim();
};

export const analyzeStudyMaterial = async (text: string, questionCount: number = 10): Promise<{ 
  summary: string, 
  keyPoints: string[], 
  insights: string, 
  questions: any[] 
}> => {
  // Always use process.env.API_KEY directly for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      role: 'user',
      parts: [{
        text: `Perform a comprehensive academic analysis on this content. 
        Generate exactly ${questionCount} multiple choice questions.
        
        INPUT MATERIAL:
        ${text}`
      }]
    }],
    config: {
      systemInstruction: `You are an Elite Academic Intelligence Agent. Extract a high-level summary, 5-10 key points, 1 deep mnemonic insight, and EXACTLY ${questionCount} multiple-choice practice questions with detailed explanations. Format the entire response as a single valid JSON object. Ensure questions range from foundational to advanced application level. Do not include any text outside the JSON structure.`,
      responseMimeType: "application/json",
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
    throw new Error("Decoding Error: The system produced a non-standard report. This often happens with very large request counts. Try reducing question count.");
  }
};

export const ocrImage = async (base64Data: string, mimeType: string): Promise<string> => {
  // Always use process.env.API_KEY directly for initialization as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Act as a high-precision document scanner. Extract all legible text from this image and return it exactly as it appears. Maintain logical paragraph structures." }
      ]
    }]
  });
  
  return response.text || '';
};
