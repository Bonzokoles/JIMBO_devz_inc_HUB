
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface Metric {
  timestamp: number;
  event: string;
  data: any;
}

class MetricsService {
  private metrics: Metric[] = [];

  constructor() {}

  trackEvent(event: string, data: any) {
    const metric: Metric = {
      timestamp: Date.now(),
      event,
      data,
    };
    this.metrics.push(metric);
    console.log("Metric tracked:", metric);
  }

  getMetrics(): Metric[] {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }

  exportToJson(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  exportToCsv(): string {
    if (this.metrics.length === 0) {
      return "";
    }
    const headers = Object.keys(this.metrics[0]);
    const csvRows = [headers.join(',')];

    for (const metric of this.metrics) {
      const values = headers.map(header => {
        const value = metric[header as keyof Metric];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  async exportToPDF(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;
    const margin = 50;
    let y = height - margin;

    // Title
    page.drawText('Jimbo_net Control Center - Usage Metrics Report', {
      x: margin,
      y,
      font: boldFont,
      size: 18,
      color: rgb(0.2, 0.6, 1),
    });

    y -= 30;

    // Report info
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y,
      font,
      size: fontSize,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 30;

    // Summary statistics
    const eventCounts = this.getEventCounts();
    page.drawText('Summary Statistics:', {
      x: margin,
      y,
      font: boldFont,
      size: 12,
      color: rgb(0, 0, 0),
    });

    y -= 20;
    
    Object.entries(eventCounts).forEach(([event, count]) => {
      page.drawText(`• ${event}: ${count} occurrences`, {
        x: margin + 20,
        y,
        font,
        size: fontSize,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 15;
    });

    y -= 20;

    // Detailed events
    page.drawText('Detailed Event Log:', {
      x: margin,
      y,
      font: boldFont,
      size: 12,
      color: rgb(0, 0, 0),
    });

    y -= 20;

    for (const metric of this.metrics) {
      if (y < margin + 50) {
        const newPage = pdfDoc.addPage();
        page.drawText('Jimbo_net Metrics Report (continued)', {
          x: margin,
          y: newPage.getHeight() - margin,
          font: boldFont,
          size: 14,
          color: rgb(0.2, 0.6, 1),
        });
        y = newPage.getHeight() - margin - 40;
      }

      // Event header
      page.drawText(`[${new Date(metric.timestamp).toLocaleString()}]`, {
        x: margin,
        y,
        font: boldFont,
        size: fontSize,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawText(metric.event, {
        x: margin + 150,
        y,
        font: boldFont,
        size: fontSize,
        color: rgb(0.1, 0.1, 0.1),
      });

      y -= 12;

      // Event data
      const dataText = JSON.stringify(metric.data, null, 2);
      const lines = dataText.split('\n');
      for (const line of lines) {
        if (y < margin + 10) {
          const newPage = pdfDoc.addPage();
          page.drawText('Jimbo_net Metrics Report (continued)', {
            x: margin,
            y: newPage.getHeight() - margin,
            font: boldFont,
            size: 14,
            color: rgb(0.2, 0.6, 1),
          });
          y = newPage.getHeight() - margin - 40;
        }
        
        page.drawText(line, {
          x: margin + 20,
          y,
          font,
          size: fontSize - 1,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 10;
      }

      y -= 10;
    }

    return pdfDoc.save();
  }

  getEventCounts(): Record<string, number> {
    return this.metrics.reduce((counts, metric) => {
      counts[metric.event] = (counts[metric.event] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }
}

const metricsService = new MetricsService();
export default metricsService;
