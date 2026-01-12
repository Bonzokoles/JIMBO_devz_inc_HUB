import { Env } from '../types';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface ReportEmailData {
  report: any;
  recipient: string;
  recipientName?: string;
}

export class EmailService {
  constructor(private env: Env) {}

  async sendReportEmail(data: ReportEmailData): Promise<boolean> {
    console.log(`📧 Sending report email to: ${data.recipient}`);

    try {
      const template = this.buildReportEmailTemplate(data.report, data.recipientName);
      
      const emailPayload = {
        personalizations: [{
          to: [{ email: data.recipient, name: data.recipientName || data.recipient }],
          dkim_domain: 'mybonzoaiblog.com',
          dkim_selector: 'mailchannels',
          dkim_private_key: this.env.DKIM_PRIVATE_KEY
        }],
        from: {
          email: 'analytics@mybonzoaiblog.com',
          name: 'Pumo Analytics System'
        },
        subject: template.subject,
        content: [
          { type: 'text/plain', value: template.text },
          { type: 'text/html', value: template.html }
        ]
      };

      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MailChannels API error: ${response.status} - ${errorText}`);
      }

      console.log('✅ Email sent successfully');
      await this.logEmailSent(data.recipient, data.report.id, 'success');

      return true;

    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      await this.logEmailSent(data.recipient, data.report.id, 'failed', error.message);
      return false;
    }
  }

  private buildReportEmailTemplate(report: any, recipientName?: string): EmailTemplate {
    const subject = `📊 ${report.type.toUpperCase()} Analytics Report - ${report.period_start}`;
    const text = this.buildTextEmail(report, recipientName);
    const html = this.buildHTMLEmail(report, recipientName);

    return { subject, html, text };
  }

  private buildTextEmail(report: any, recipientName?: string): string {
    const greeting = recipientName ? `Cześć ${recipientName}` : 'Cześć';
    
    return `
${greeting},

Oto Twój raport analityczny Pumo za okres: ${report.period_start} - ${report.period_end}

=== PODSUMOWANIE ===

Przychody ogółem: ${this.formatCurrency(report.summary.total_revenue)}
Liczba kliknięć: ${report.summary.total_clicks}
Współczynnik konwersji: ${report.summary.conversion_rate.toFixed(2)}%
Udział AI SEO w przychodach: ${report.summary.ai_revenue_share.toFixed(1)}%

Najlepsza kategoria: ${report.summary.top_category}
Najlepszy produkt: ${report.summary.best_product}

=== KLUCZOWE INSIGHTS ===

${report.summary.key_insights.map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}

=== TOP 5 PRODUKTÓW ===

${report.data.top_products.slice(0, 5).map((p: any, i: number) => `
${i + 1}. ${p.product_name}
   Kategoria: ${p.category}
   Kliknięcia: ${p.clicks} | CTR: ${p.ctr.toFixed(2)}% | Przychód: ${this.formatCurrency(p.revenue)}
`).join('\n')}

---

Pełny raport dostępny w dashboardzie: https://analytics.mybonzoaiblog.com/report/${report.id}

Pozdrawiam,
Pumo Analytics System
Powered by MyBonzo AI
`.trim();
  }

  private buildHTMLEmail(report: any, recipientName?: string): string {
    const greeting = recipientName ? `Cześć ${recipientName}` : 'Cześć';
    
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Courier New', Monaco, monospace; background-color: #0a0a0a; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #141414; border: 2px solid #00ff41; }
    .header { background: linear-gradient(135deg, #00ff41 0%, #0affff 100%); color: #0a0a0a; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
    .header p { margin: 10px 0 0 0; font-size: 12px; opacity: 0.8; }
    .content { padding: 30px 20px; }
    .greeting { font-size: 16px; margin-bottom: 20px; color: #00ff41; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; color: #00ff41; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .kpi-card { background: #0a0a0a; border: 1px solid #333; padding: 15px; text-align: center; }
    .kpi-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .kpi-value { font-size: 24px; color: #00ff41; font-weight: bold; }
    .insight { background: #0a0a0a; border-left: 3px solid #00ff41; padding: 12px 15px; margin-bottom: 10px; font-size: 13px; line-height: 1.6; }
    .product-item { background: #0a0a0a; border: 1px solid #333; padding: 15px; margin-bottom: 10px; }
    .product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .product-name { font-size: 14px; color: #00ff41; font-weight: bold; }
    .product-revenue { font-size: 16px; color: #0affff; font-weight: bold; }
    .product-meta { font-size: 11px; color: #666; display: flex; gap: 15px; }
    .progress-bar { width: 100%; height: 8px; background: #0a0a0a; border: 1px solid #333; margin-top: 10px; position: relative; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #00ff41, #0affff); }
    .cta-button { display: inline-block; background: #00ff41; color: #0a0a0a; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #333; }
    .footer a { color: #00ff41; text-decoration: none; }
    @media only screen and (max-width: 600px) { .kpi-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 PUMO ANALYTICS</h1>
      <p>${report.type.toUpperCase()} REPORT | ${report.period_start} - ${report.period_end}</p>
    </div>

    <div class="content">
      <div class="greeting">${greeting},</div>
      
      <p style="line-height: 1.6; margin-bottom: 30px;">
        Oto Twój raport analityczny za ostatni okres. System wygenerował szczegółową analizę 
        wydajności sklepu Meble Pumo, ze szczególnym uwzględnieniem wpływu AI SEO.
      </p>

      <div class="section">
        <div class="section-title">📈 Podsumowanie KPI</div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Przychody Ogółem</div>
            <div class="kpi-value">${this.formatCurrency(report.summary.total_revenue)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Liczba Kliknięć</div>
            <div class="kpi-value">${this.formatNumber(report.summary.total_clicks)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Współczynnik Konwersji</div>
            <div class="kpi-value">${report.summary.conversion_rate.toFixed(2)}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Udział AI SEO</div>
            <div class="kpi-value">${report.summary.ai_revenue_share.toFixed(1)}%</div>
          </div>
        </div>

        <div style="margin-top: 15px; padding: 15px; background: #0a0a0a; border: 1px solid #333;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-size: 12px;">AI SEO Performance</span>
            <span style="font-size: 12px; color: #00ff41;">${report.summary.ai_revenue_share.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.summary.ai_revenue_share}%;"></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🔍 Kluczowe Insights</div>
        ${report.summary.key_insights.map((insight: string) => `<div class="insight">${insight}</div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">🏆 Top 5 Produktów</div>
        ${report.data.top_products.slice(0, 5).map((product: any, index: number) => `
          <div class="product-item">
            <div class="product-header">
              <div>
                <span style="color: #666; font-size: 12px;">#${index + 1}</span>
                <div class="product-name">${product.product_name}</div>
              </div>
              <div class="product-revenue">${this.formatCurrency(product.revenue)}</div>
            </div>
            <div class="product-meta">
              <span>Kategoria: ${product.category}</span>
              <span>Kliknięcia: ${product.clicks}</span>
              <span>CTR: ${product.ctr.toFixed(2)}%</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://analytics.mybonzoaiblog.com/report/${report.id}" class="cta-button">
          📊 Zobacz Pełny Raport
        </a>
      </div>

      <div style="background: #0a0a0a; border: 1px solid #333; padding: 15px; margin-top: 30px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
          <strong style="color: #00ff41;">Najlepsza kategoria:</strong> ${report.summary.top_category}
        </div>
        <div style="font-size: 12px; color: #666;">
          <strong style="color: #00ff41;">Najlepszy produkt:</strong> ${report.summary.best_product}
        </div>
      </div>
    </div>

    <div class="footer">
      <p>
        Raport wygenerowany automatycznie przez <strong>Pumo Analytics System</strong><br>
        Powered by <a href="https://www.mybonzoaiblog.com">MyBonzo AI</a> | 
        WHITECAT v1.0 (MOA: DeepSeek + Claude + GPT-4)
      </p>
      <p style="margin-top: 10px;">
        <a href="https://www.meblepumo.pl">www.meblepumo.pl</a> | 
        <a href="https://analytics.mybonzoaiblog.com">Dashboard</a>
      </p>
      <p style="margin-top: 15px; font-size: 10px;">
        Nie chcesz otrzymywać raportów? 
        <a href="https://analytics.mybonzoaiblog.com/unsubscribe?email=${data.recipient}">Wypisz się</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pl-PL').format(value);
  }

  private async logEmailSent(recipient: string, reportId: string, status: 'success' | 'failed', error?: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO email_log (recipient, report_id, status, error, sent_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(recipient, reportId, status, error || null, new Date().toISOString()).run();
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  }

  async sendBulkReportEmails(report: any, recipients: string[]): Promise<{ sent: number; failed: number }> {
    console.log(`📧 Sending bulk emails to ${recipients.length} recipients...`);
    
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        const success = await this.sendReportEmail({ report, recipient });
        if (success) sent++; else failed++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        failed++;
      }
    }

    console.log(`✅ Bulk email complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }
}
