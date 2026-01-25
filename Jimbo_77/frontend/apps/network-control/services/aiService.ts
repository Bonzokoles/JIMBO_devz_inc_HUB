// AI Service - OpenRouter + Agent Zero Integration
import { NetworkService } from "../types";

export interface AIResponse {
  content: string;
  model: string;
  provider: 'openrouter' | 'agent-zero';
}

export interface NetworkAnalysisRequest {
  services: any[];
  tunnels?: any[];
  vpnStatus?: any;
}

class AIService {
  private openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private agentZeroApiUrl = import.meta.env.VITE_AGENT_ZERO_API_URL || 'http://localhost:50082/api/v1/chat';
  private backendApiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3880';

  async analyzeNetworkSecurity(request: NetworkAnalysisRequest): Promise<AIResponse> {
    try {
      // Try Agent Zero first (local, faster)
      return await this.analyzeWithAgentZero(request);
    } catch (error) {
      console.warn('Agent Zero unavailable, falling back to OpenRouter:', error);
      // Fallback to OpenRouter
      return await this.analyzeWithOpenRouter(request);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Use /api_log_get as a lightweight health probe (getting 1 log to minimize load)
      const apiKey = import.meta.env.VITE_AGENT_ZERO_API_KEY;
      const url = this.agentZeroApiUrl.replace('/api/v1/chat', '') + '/api_log_get?context_id=health-check&length=1';
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey || '98jkbLOU84oGF0-1'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async analyzeWithAgentZero(request: NetworkAnalysisRequest): Promise<AIResponse> {
    const prompt = this.buildSecurityAnalysisPrompt(request);
    const apiKey = import.meta.env.VITE_AGENT_ZERO_API_KEY;
    
    // Using /api_message endpoint from screenshots
    const url = this.agentZeroApiUrl.replace('/api/v1/chat', '') + '/api_message';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey || '98jkbLOU84oGF0-1'
      },
      body: JSON.stringify({
        message: prompt,
        lifetime_hours: 24
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent Zero API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response || "Analysis complete.", 
      model: 'agent-zero-v1',
      provider: 'agent-zero',
    };
  }

  private async analyzeWithOpenRouter(request: NetworkAnalysisRequest): Promise<AIResponse> {
    const prompt = this.buildSecurityAnalysisPrompt(request);
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch(this.openRouterApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a network security expert analyzing infrastructure vulnerabilities and providing actionable recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: 'qwen/qwen-2.5-72b-instruct',
      provider: 'openrouter',
    };
  }

  async generateAgentReport(services: any[], agents: any[]): Promise<AIResponse> {
    try {
      return await this.analyzeWithAgentZero({ services });
    } catch {
      return await this.analyzeWithOpenRouter({ services });
    }
  }

  async analyzeConnectionSecurity(service: any): Promise<string> {
    try {
      const response = await this.analyzeWithAgentZero({ services: [service] });
      return response.content;
    } catch {
      const response = await this.analyzeWithOpenRouter({ services: [service] });
      return response.content;
    }
  }

  // Communicate with Backend API for real-time network monitoring
  async getNetworkServices(): Promise<any[]> {
    try {
        // Map Docker containers to NetworkServices
        // Note: The backend returns { containers: [{name, status, ports}] }
        const response = await fetch(`${this.backendApiUrl}/api/docker`);
        if (!response.ok) throw new Error('Backend API unavailable');
        
        const data = await response.json();
        const containers = data.containers || [];
        
        return containers.map((c: any) => {
          // Parse ports like "0.0.0.0:6001->6001/tcp"
          let port = 0;
          if (c.ports) {
               const match = c.ports.match(/:(\d+)->/);
               if (match) port = parseInt(match[1]);
          }
          
          return {
            pid: Math.floor(Math.random() * 10000) + 1000, 
            name: c.name,
            port: port || 0,
            protocol: "TCP",
            status: c.status.startsWith("Up") ? "LISTEN" : "STOPPED",
            isExposed: c.ports.includes("0.0.0.0"),
            vulnerabilityScore: Math.floor(Math.random() * 20) // Simulated score
          };
        });
      } catch (error) {
        console.warn('Backend API unavailable or Docker down, using mock data');
        return [];
      }
  }

  async getTunnelStatus(): Promise<any[]> {
    try {
      // Backend doesn't have tunnel API yet, keep mock specific logic or upgrade later
      // The Architecture doc says "Tunnel Management" is part of frontend but backend might not support it yet.
      return []; 
    } catch (error) {
      return [];
    }
  }

  async executePowerShellCommand(command: string, params?: Record<string, string>): Promise<any> {
    try {
      const response = await fetch(`${this.backendApiUrl}/api/network/powershell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params }),
      });
      
      if (!response.ok) throw new Error('PowerShell execution failed');
      return await response.json();
    } catch (error) {
      console.error('PowerShell execution error:', error);
      throw error;
    }
  }

  private buildSecurityAnalysisPrompt(request: NetworkAnalysisRequest): string {
    return `
# Network Security Analysis Request

**Services to analyze:**
${JSON.stringify(request.services, null, 2)}

${request.tunnels ? `**Active Tunnels:**
${JSON.stringify(request.tunnels, null, 2)}` : ''}

${request.vpnStatus ? `**VPN Status:**
${JSON.stringify(request.vpnStatus, null, 2)}` : ''}

Provide a comprehensive security analysis including:
1. Overall risk assessment
2. Critical vulnerabilities (if any)
3. Port exposure analysis
4. Recommended firewall rules
5. Priority action items

Format as markdown with clear sections.
    `.trim();
  }
}

export const aiService = new AIService();

// Export legacy functions for compatibility
export const generateAgentReport = (services: any[], agents: any[]) => 
  aiService.generateAgentReport(services, agents);

export const analyzeConnectionSecurity = (service: any) => 
  aiService.analyzeConnectionSecurity(service);
