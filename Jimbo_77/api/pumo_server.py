#!/usr/bin/env python3
"""
Prosty serwer HTTP dla danych PUMO
"""

import http.server
import socketserver
import json
import os

PORT = 8003

class PUMOHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    
    def do_GET(self):
        print(f"REQUEST: {self.path}")
        
        if 'pumo-kpis' in self.path:
            self.serve_json('static_data/pumo-kpis.json')
        elif 'pumo-products' in self.path:
            self.serve_json('static_data/pumo-products.json')
        elif 'pumo-hub-data' in self.path:
            self.serve_json('static_data/pumo-hub-data.json')
        elif 'pumo-revenue-trend' in self.path:
            self.serve_json('static_data/pumo-revenue-trend.json')
        elif self.path == '/':
            self.serve_html()
        else:
            self.send_error(404)
    
    def serve_json(self, filepath):
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                self.wfile.write(content.encode('utf-8'))
                print(f"✅ Served: {filepath}")
        except Exception as e:
            print(f"❌ Error serving {filepath}: {e}")
            self.send_error(500)
    
    def serve_html(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>PUMO API Server</title>
        </head>
        <body>
            <h1>🏪 PUMO API Server</h1>
            <p><strong>Status:</strong> ✅ Online</p>
            <h2>Dostępne endpointy:</h2>
            <ul>
                <li><a href="/v1/shop-sync/pumo-kpis" target="_blank">KPIs</a></li>
                <li><a href="/v1/shop-sync/pumo-products" target="_blank">Produkty</a></li>
                <li><a href="/v1/shop-sync/pumo-hub-data" target="_blank">Hub Data</a></li>
                <li><a href="/v1/shop-sync/pumo-revenue-trend" target="_blank">Revenue Trend</a></li>
            </ul>
        </body>
        </html>
        """
        self.wfile.write(html.encode('utf-8'))

if __name__ == "__main__":
    print(f"🚀 PUMO Server starting on port {PORT}")
    print(f"📡 URL: http://localhost:{PORT}")
    print(f"🧪 Test: http://localhost:{PORT}/v1/shop-sync/pumo-kpis")
    
    try:
        with socketserver.TCPServer(("", PORT), PUMOHandler) as httpd:
            print(f"✅ Server ready! Press Ctrl+C to stop")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")