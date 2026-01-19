// AI Service - OpenRouter + Agent Zero Integration
// Zastępuje geminiService.ts

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
  private agentZeroApiUrl = 'http://localhost:50100/api/v1/chat';
  private backendApiUrl = 'http://localhost:3885';

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

  private async analyzeWithAgentZero(request: NetworkAnalysisRequest): Promise<AIResponse> {
    const prompt = this.buildSecurityAnalysisPrompt(request);
    
    const response = await fetch(this.agentZeroApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        context: 'network_security_analysis',
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent Zero API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response || data.message,
      model: 'agent-zero-local',
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
    const prompt = `
Analyze the following network services and AI agents status:

**Network Services:**
${JSON.stringify(services, null, 2)}

**AI Agents:**
${JSON.stringify(agents, null, 2)}

Provide:
1. Security assessment
2. Performance insights
3. Recommended actions
4. Priority issues

Format as markdown with sections.
    `.trim();

    try {
      return await this.analyzeWithAgentZero({ services });
    } catch {
      return await this.analyzeWithOpenRouter({ services });
    }
  }

  async analyzeConnectionSecurity(service: any): Promise<string> {
    const prompt = `
Analyze this network service for security vulnerabilities:

Service: ${service.name}
Port: ${service.port}
Protocol: ${service.protocol}
Status: ${service.status}
Exposed: ${service.isExposed ? 'Yes' : 'No'}
Vulnerability Score: ${service.vulnerabilityScore}/100

Provide:
1. Risk level (Low/Medium/High/Critical)
2. Specific vulnerabilities
3. Mitigation steps
4. Recommended firewall rules

Be concise and actionable.
    `.trim();

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
      const response = await fetch(`${this.backendApiUrl}/api/network/services`);
      if (!response.ok) throw new Error('Backend API unavailable');
      return await response.json();
    } catch (error) {
      console.warn('Backend API unavailable, using mock data');
      return [];
    }
  }

  async getTunnelStatus(): Promise<any[]> {
    try {
      const response = await fetch(`${this.backendApiUrl}/api/network/tunnels`);
      if (!response.ok) throw new Error('Backend API unavailable');
      return await response.json();
    } catch (error) {
      console.warn('Backend API unavailable, using mock data');
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
