
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateAgentReport(context: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Wygeneruj profesjonalny, techniczny raport w formacie Markdown dla inżyniera DevOps. 
    Kontekst: ${context}. 
    Użyj języka polskiego. Raport powinien zawierać: 
    1. Podsumowanie incydentu/stanu. 
    2. Szczegóły techniczne portów i procesów. 
    3. Rekomendacje bezpieczeństwa.`,
    config: {
      temperature: 0.7,
      systemInstruction: "Jesteś agentem 'Raportier' w systemie Jimbo_net_cntrl. Twoim celem jest dostarczanie precyzyjnych i zwięzłych raportów sieciowych."
    }
  });
  return response.text || "Błąd podczas generowania raportu.";
}

export async function analyzeConnectionSecurity(services: any[]): Promise<any> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Przeanalizuj listę usług i zwróć JSON z oceną ryzyka dla każdej z nich: ${JSON.stringify(services)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pid: { type: Type.INTEGER },
            riskScore: { type: Type.INTEGER },
            reason: { type: Type.STRING }
          },
          required: ["pid", "riskScore", "reason"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}
