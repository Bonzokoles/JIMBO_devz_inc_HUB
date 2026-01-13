#!/usr/bin/env python3
"""
Simple HTTP Server for PUMO JSON Data
Serwuje statyczne pliki JSON na porcie 8003
"""

import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

class PUMOHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for PUMO API endpoints"""
    
    def end_headers(self):
        # CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path.lstrip('/')
        
        print(f"📡 Request: {path}")
        
        # API endpoints mapping
        endpoint_mapping = {
            'v1/shop-sync/pumo-kpis': 'static_data/pumo-kpis.json',
            'v1/shop-sync/pumo-revenue-trend': 'static_data/pumo-revenue-trend.json',
            'v1/shop-sync/pumo-products': 'static_data/pumo-products.json', 
            'v1/shop-sync/pumo-hub-data': 'static_data/pumo-hub-data.json',
            'pumo-kpis.json': 'static_data/pumo-kpis.json',
            'pumo-revenue-trend.json': 'static_data/pumo-revenue-trend.json',
            'pumo-products.json': 'static_data/pumo-products.json',
            'pumo-hub-data.json': 'static_data/pumo-hub-data.json',
            '': 'index.html'  # Root
        }
        
        # Find matching endpoint
        json_file = endpoint_mapping.get(path)
        
        if json_file and json_file.endswith('.json') and os.path.exists(json_file):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.send_response(200)
                self.end_headers()
                
                json_response = json.dumps(data, ensure_ascii=False, indent=2)
                self.wfile.write(json_response.encode('utf-8'))
                
                print(f"✅ Served: {json_file}")
                return
                
            except Exception as e:
                print(f"❌ Error reading {json_file}: {e}")
                self.send_error(500, f"Error reading file: {e}")
                return
        
        # Health check
        if path == 'health':
            self.send_response(200)
            self.end_headers()
            response = {"status": "ok", "message": "PUMO Data Server running"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        # Root - API documentation
        if path == '' or path == 'index.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = """
<!DOCTYPE html>
<html>
<head>
    <title>PUMO Data Server</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; max-width: 800px; }
        h1 { color: #2c3e50; }
        .endpoint { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .endpoint a { color: #3498db; text-decoration: none; font-weight: bold; }
        .endpoint a:hover { text-decoration: underline; }
        .status { color: #27ae60; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏪 PUMO Data Server</h1>
        <p class="status">✅ Server Status: ACTIVE</p>
        
        <h2>📊 Available Endpoints:</h2>
        
        <div class="endpoint">
            <strong>KPIs Dashboard:</strong><br>
            <a href="/v1/shop-sync/pumo-kpis">/v1/shop-sync/pumo-kpis</a><br>
            <small>Główne wskaźniki - zamówienia, przychody, ROI AI</small>
        </div>
        
        <div class="endpoint">
            <strong>Revenue Trend:</strong><br>
            <a href="/v1/shop-sync/pumo-revenue-trend">/v1/shop-sync/pumo-revenue-trend</a><br>
            <small>Trend przychodów ostatnie 30 dni</small>
        </div>
        
        <div class="endpoint">
            <strong>Products:</strong><br>
            <a href="/v1/shop-sync/pumo-products">/v1/shop-sync/pumo-products</a><br>
            <small>Lista produktów z cenami i stanem magazynu</small>
        </div>
        
        <div class="endpoint">
            <strong>Hub Data:</strong><br>
            <a href="/v1/shop-sync/pumo-hub-data">/v1/shop-sync/pumo-hub-data</a><br>
            <small>Pełne dane dla PUMO Diagnosis Hub</small>
        </div>
        
        <div class="endpoint">
            <strong>Health Check:</strong><br>
            <a href="/health">/health</a><br>
            <small>Status serwera</small>
        </div>
        
        <h2>🔧 PUMO Hub Configuration:</h2>
        <code>
        API_BASE = "http://localhost:8003"<br>
        Endpoints: /v1/shop-sync/pumo-*
        </code>
        
        <p><strong>💡 Tip:</strong> Wszystkie endpointy zwracają JSON z CORS headers</p>
    </div>
</body>
</html>
            """
            self.wfile.write(html.encode('utf-8'))
            return
        
        # 404
        self.send_error(404, f"Endpoint not found: /{path}")


def start_pumo_server():
    """Uruchom PUMO Data Server"""
    
    PORT = 8003
    
    print("🏪 PUMO Data Server")
    print("=" * 50)
    
    # Check if data files exist
    required_files = [
        'static_data/pumo-kpis.json',
        'static_data/pumo-revenue-trend.json', 
        'static_data/pumo-products.json',
        'static_data/pumo-hub-data.json'
    ]
    
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("❌ BRAKUJE PLIKÓW DANYCH!")
        print("💡 Uruchom najpierw: python static_data_generator.py")
        for f in missing_files:
            print(f"   📄 {f}")
        return False
    
    print("✅ Wszystkie pliki danych gotowe")
    
    try:
        with socketserver.TCPServer(("", PORT), PUMOHandler) as httpd:
            print(f"\n🚀 Server uruchomiony na porcie {PORT}")
            print(f"🌐 URL: http://localhost:{PORT}")
            print(f"📊 Dashboard: http://localhost:{PORT}")
            print(f"🔍 Test API: http://localhost:{PORT}/v1/shop-sync/pumo-kpis")
            print(f"\n💡 PUMO Hub: Zmień API_BASE na http://localhost:{PORT}")
            print(f"\n⏹️  Ctrl+C aby zatrzymać serwer")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Serwer zatrzymany")
        return True
    except OSError as e:
        if "address already in use" in str(e).lower():
            print(f"❌ Port {PORT} jest już używany!")
            print(f"💡 Spróbuj: netstat -ano | findstr :{PORT}")
        else:
            print(f"❌ Błąd serwera: {e}")
        return False


if __name__ == "__main__":
    start_pumo_server()