
export enum AgentStatus {
  IDLE = 'IDLE',
  WORKING = 'WORKING',
  ALERT = 'ALERT',
  OFFLINE = 'OFFLINE'
}

export interface NetworkService {
  pid: number;
  name: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  status: string;
  tunnel?: string;
  isExposed: boolean;
  vulnerabilityScore: number;
}

export interface VpnStatus {
  isActive: boolean;
  location: string;
  ip: string;
  provider: string;
}

export interface SystemTask {
  id: string;
  name: string;
  cpu: number;
  memory: string;
  runtime: string;
  status: 'running' | 'idle' | 'warning';
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastActivity: string;
  log: string[];
}

export interface TunnelConfig {
  id: string;
  label: string;
  obfuscatedId: string;
  provider: 'Cloudflare' | 'ngrok' | 'Local';
  localPort: number;
  publicUrl?: string;
  isActive: boolean;
  isPersistent: boolean; // Utrzymywanie tunelu "ON"
  bandwidth?: string;
}

export interface SystemReport {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
