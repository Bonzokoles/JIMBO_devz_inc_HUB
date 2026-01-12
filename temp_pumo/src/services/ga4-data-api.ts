import { Env } from '../types';

type ServiceAccountJson = {
  client_email: string;
  private_key: string;
};

type RunReportBody = {
  dateRanges?: Array<{ startDate: string; endDate: string }>;
  dimensions?: Array<{ name: string }>;
  metrics?: Array<{ name: string }>;
  dimensionFilter?: any;
  metricFilter?: any;
  orderBys?: any[];
  limit?: number | string;
  offset?: number | string;
  metricAggregations?: string[];
  currencyCode?: string;
  keepEmptyRows?: boolean;
  returnPropertyQuota?: boolean;
};

function base64UrlEncodeBytes(bytes: ArrayBuffer): string {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeString(s: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(s).buffer);
}

function pemToDer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function importPrivateKey(pkcs8Pem: string): Promise<CryptoKey> {
  const keyData = pemToDer(pkcs8Pem);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );
}

async function signJwtRs256(payload: Record<string, any>, privateKeyPem: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncodeString(JSON.stringify(header));
  const payloadB64 = base64UrlEncodeString(JSON.stringify(payload));
  const unsigned = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(privateKeyPem);
  const sig = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(unsigned)
  );
  const sigB64 = base64UrlEncodeBytes(sig);
  return `${unsigned}.${sigB64}`;
}

export class GA4DataAPI {
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly scope = 'https://www.googleapis.com/auth/analytics.readonly';

  constructor(private env: Env) {}

  private getServiceAccount(): ServiceAccountJson {
    const raw = String((this.env as any).GA4_SERVICE_ACCOUNT_JSON || '').trim();
    if (!raw) {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON missing');
    }
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    const client_email = String(parsed.client_email || '').trim();
    const private_key = String(parsed.private_key || '').trim();
    if (!client_email || !private_key) {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON missing client_email/private_key');
    }
    return { client_email, private_key };
  }

  private getPropertyId(): string {
    const pid = String((this.env as any).GA4_PROPERTY_ID || '').trim();
    if (!pid) throw new Error('GA4_PROPERTY_ID missing');
    return pid;
  }

  private async getAccessToken(): Promise<string> {
    const sa = this.getServiceAccount();
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: sa.client_email,
      scope: this.scope,
      aud: this.tokenUrl,
      iat: now,
      exp: now + 3600
    };

    const jwt = await signJwtRs256(payload, sa.private_key);

    const body = new URLSearchParams();
    body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    body.set('assertion', jwt);

    const res = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    const txt = await res.text();
    let data: any = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
    if (!res.ok) {
      const msg = data?.error_description || data?.error || txt || `HTTP ${res.status}`;
      throw new Error(`GA4 OAuth token error: ${msg}`);
    }

    const token = String(data?.access_token || '').trim();
    if (!token) throw new Error('GA4 OAuth token missing access_token');
    return token;
  }

  async runReport(body: RunReportBody): Promise<any> {
    const propertyId = this.getPropertyId();
    const token = await this.getAccessToken();

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`;

    const payload: RunReportBody = {
      dateRanges: body.dateRanges || [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: body.dimensions || [],
      metrics: body.metrics || [],
      dimensionFilter: body.dimensionFilter,
      metricFilter: body.metricFilter,
      orderBys: body.orderBys,
      limit: body.limit,
      offset: body.offset,
      metricAggregations: body.metricAggregations,
      currencyCode: body.currencyCode,
      keepEmptyRows: body.keepEmptyRows,
      returnPropertyQuota: body.returnPropertyQuota
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const txt = await res.text();
    let data: any = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || txt || `HTTP ${res.status}`;
      throw new Error(`GA4 runReport error: ${msg}`);
    }

    return data;
  }
}
