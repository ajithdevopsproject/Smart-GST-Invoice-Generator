import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractInvoiceData = async (base64Image: string, mimeType: string): Promise<Partial<InvoiceData> | null> => {
  try {
    const prompt = `
      Analyze this invoice image and extract the data into a structured JSON format.
      Identify the Seller (Company), the Buyer (Client), the Invoice Details, and the Line Items.
      
      For Line Items, extract description, HSN code (if present, else empty), quantity, unit price, and GST rate (if explicitly stated, infer if possible, else 0).
      
      Format strictly as JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                gstin: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              }
            },
            client: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                companyName: { type: Type.STRING },
                address: { type: Type.STRING },
                gstin: { type: Type.STRING },
              }
            },
            details: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.STRING },
                date: { type: Type.STRING },
                dueDate: { type: Type.STRING },
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  hsn: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  price: { type: Type.NUMBER },
                  gstRate: { type: Type.NUMBER },
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<InvoiceData>;
    }
    return null;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};
