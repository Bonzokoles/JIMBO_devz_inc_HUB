#!/usr/bin/env python3
import http.server
import socketserver
import json
import os

PORT = 8003

class PUMOHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        path = self.path.strip('/')
        print(f"📡 Request: {path}")
        
        # Mapowanie endpoints
        if 'pumo-kpis' in path:
            self.serve_json('static_data/pumo-kpis.json')
        elif 'pumo-products' in path:
            self.serve_json('static_data/pumo-products.json')
        elif 'pumo-hub-data' in path:
            self.serve_json('static_data/pumo-hub-data.json')
        elif 'pumo-revenue-trend' in path:
            self.serve_json('static_data/pumo-revenue-trend.json')
        elif path == '' or path == 'health':
            self.serve_status()
        else:
            self.send_error(404, f"Unknown endpoint: {path}")
    
    def serve_json(self, filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = f.read()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(data.encode('utf-8'))
            print(f"✅ Served: {filename}")
        except Exception as e:
            self.send_error(500, f"Error: {e}")
    
    def serve_status(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        
        html = """
        <html>
        <head><title>PUMO API</title></head>
        <body>
        <h1>🏪 PUMO Data Server</h1>
        <p>✅ Status: ACTIVE</p>
        <h2>Endpoints:</h2>
        <ul>
        <li><a href="/v1/shop-sync/pumo-kpis">KPIs</a></li>
        <li><a href="/v1/shop-sync/pumo-products">Products</a></li>
        <li><a href="/v1/shop-sync/pumo-hub-data">Hub Data</a></li>
        <li><a href="/v1/shop-sync/pumo-revenue-trend">Revenue Trend</a></li>
        </ul>
        <p>💡 PUMO Hub: API_BASE = "http://localhost:8003"</p>
        </body>
        </html>
        """
        self.wfile.write(html.encode('utf-8'))

if __name__ == "__main__":
    print("🏪 PUMO Data Server")
    print(f"🚀 Starting on port {PORT}")
    print(f"📊 Test: http://localhost:{PORT}/v1/shop-sync/pumo-kpis")
    print(f"💡 Dashboard: http://localhost:{PORT}")
    
    with socketserver.TCPServer(("", PORT), PUMOHandler) as httpd:
        httpd.serve_forever()