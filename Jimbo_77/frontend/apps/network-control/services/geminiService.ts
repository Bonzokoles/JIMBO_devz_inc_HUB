
import { GoogleGenAI, Type } from "@google/genai";

interface AIServiceConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

interface SecurityAnalysis {
  pid: number;
  riskScore: number;
  reason: string;
}

class AIService {
  private ai: GoogleGenAI;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async generateAgentReport(context: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await this.ai.models.generateContent({
        model: this.config.model,
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
      
      clearTimeout(timeoutId);
      return response.text || "Błąd podczas generowania raportu.";
    } catch (error) {
      console.error('Error generating AI report:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        return "Przekroczono limit czasu generowania raportu.";
      }
      return "Wystąpił błąd podczas generowania raportu AI.";
    }
  }

  async analyzeConnectionSecurity(services: any[]): Promise<SecurityAnalysis[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await this.ai.models.generateContent({
        model: this.config.model,
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
      
      clearTimeout(timeoutId);
      
      try {
        return JSON.parse(response.text || "[]");
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error analyzing connection security:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      return [];
    }
  }
}

// Create singleton instance with configuration
const aiService = new AIService({
  apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '',
  model: 'gemini-3-flash-preview',
  timeout: 30000 // 30 seconds
});

export async function generateAgentReport(context: string): Promise<string> {
  return aiService.generateAgentReport(context);
}

export async function analyzeConnectionSecurity(services: any[]): Promise<SecurityAnalysis[]> {
  return aiService.analyzeConnectionSecurity(services);
}
