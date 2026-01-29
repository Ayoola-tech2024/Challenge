
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const summarizeAndAnalyze = async (text: string): Promise<{ summary: string, keyPoints: string[], insights: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following study material. 
    Provide a concise summary, a list of exactly 5 key bullet points, and a brief section on study insights (important concepts/definitions).
    
    Return in JSON format:
    {
      "summary": "...",
      "keyPoints": ["...", "...", "...", "...", "..."],
      "insights": "..."
    }

    Content:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          insights: { type: Type.STRING }
        },
        required: ["summary", "keyPoints", "insights"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateCBT = async (text: string, questionCount: number): Promise<any> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate exactly ${questionCount} multiple-choice questions from the study content below.

    Rules:
    - Each question must have 4 options
    - Only one correct answer
    - Difficulty: medium (exam standard)
    - No repeated or vague questions

    Return JSON in this exact format:
    {
      "questions": [
        {
          "question": "",
          "options": ["", "", "", ""],
          "correctIndex": 0,
          "explanation": ""
        }
      ]
    }

    Study Content:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const ocrImage = async (base64Data: string, mimeType: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Extract all legible text from this image as plain text. Do not summarize, just transcribe." }
      ]
    }
  });
  return response.text || '';
};
