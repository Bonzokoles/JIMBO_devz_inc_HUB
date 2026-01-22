#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PORT = int(os.getenv('PORT', 8003))

class PUMOHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Handle CORS with Credentials support
        origin = self.headers.get('Origin')
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
            
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Title, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        path = self.path.strip('/')
        print(f"[POST] Request: {path}")
        
        if 'v1/agent/chat' in path or 'v1/publish/brainstorm' in path:
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Determine Context based on Endpoint
                is_brainstorm = 'v1/publish/brainstorm' in path
                user_message = data.get('category', '') if is_brainstorm else data.get('message', '')
                
                # --- CONFIG LAYER ---
                # Check for API Key (Prioritize DeepSeek Direct)
                deepseek_key = os.getenv("DEEPSEEK_API_KEY")
                openrouter_key = os.getenv("OPENROUTER_API_KEY") # Backup
                
                api_key = deepseek_key or openrouter_key
                is_direct_deepseek = bool(deepseek_key)

                # --- MEMORY LAYER (Simple JSON Store) ---
                memory_dir = "memory/sessions"
                os.makedirs(memory_dir, exist_ok=True)
                session_id = data.get('sessionId', 'default-session')
                memory_file = os.path.join(memory_dir, f"{session_id}.json")
                
                # Load existing context
                context_history = []
                if os.path.exists(memory_file):
                    try:
                        with open(memory_file, 'r', encoding='utf-8') as f:
                            saved_data = json.load(f)
                            context_history = saved_data.get('messages', [])[-10:] # Keep last 10 turns
                    except: pass # Corrupt file or empty

                # --- AGENT EXECUTION ---
                if not api_key:
                    # Fallback to Mock
                    print("[WARN] No API Key found. Using Mock.")
                    mock_reply = (
                        f"# 🧠 Brainstorm: {user_message}\n\n"
                        f"**Status:** Mock Mode (No Keys)\n"
                        f"**Model:** Simulation\n"
                        f"> Please add DEEPSEEK_API_KEY to api/.env"
                    ) if is_brainstorm else f"Echo: {user_message} (No API Key)"
                    
                    response = {
                        "status": "success",
                        "agent": "Jimbo_Mock",
                        "content": mock_reply,
                        "reply": mock_reply,
                        "logs": "⚠️ System: API Keys missing. Using simulation."
                    }
                else:
                    # Actual Call
                    import httpx
                    
                    # Prepare Messages with Memory
                    messages = [{"role": "system", "content": system_prompt}]
                    messages.extend(context_history) # Add history
                    messages.append({"role": "user", "content": f"{'Topic: ' if is_brainstorm else ''}{user_message}"})

                    if is_direct_deepseek:
                       print(f"🚀 Calling DeepSeek Direct (Budget: $40)...")
                       endpoint = "https://api.deepseek.com/chat/completions"
                       headers = {
                           "Authorization": f"Bearer {api_key}",
                           "Content-Type": "application/json"
                       }
                       payload = {
                           "model": "deepseek-chat", # DeepSeek-V3
                           "messages": messages,
                           "stream": False
                       }
                    else:
                       print(f"🚀 Calling OpenRouter...")
                       endpoint = "https://openrouter.ai/api/v1/chat/completions"
                       headers = {
                           "Authorization": f"Bearer {api_key}",
                           "Content-Type": "application/json",
                           "HTTP-Referer": "http://localhost:8003",
                           "X-Title": "Jimbo77 Hub"
                       }
                       payload = {
                           "model": "deepseek/deepseek-chat",
                           "messages": messages
                       }
                    
                    with httpx.Client(timeout=120.0) as client:
                        api_res = client.post(endpoint, json=payload, headers=headers)
                    
                    if api_res.status_code == 200:
                        json_res = api_res.json()
                        ai_reply = json_res['choices'][0]['message']['content']
                        
                        # --- SAVE MEMORY ---
                        new_history = context_history + [
                            {"role": "user", "content": user_message},
                            {"role": "assistant", "content": ai_reply}
                        ]
                        with open(memory_file, 'w', encoding='utf-8') as f:
                            json.dump({"updated": "now", "messages": new_history}, f, indent=2)
                        
                        # --- LOCAL EMBEDDINGS (Hugging Face) ---
                        try:
                            # Load model only once if possible, or lazy load
                            # For now, simplistic implementation to demonstrate capability
                            # In production, model should be loaded globally at startup
                            from sentence_transformers import SentenceTransformer
                            
                            # Use a very small, fast model
                            model_name = 'all-MiniLM-L6-v2' 
                            model = SentenceTransformer(model_name) 
                            
                            # Embed the AI reply (and user query for retrieval later)
                            vector = model.encode(ai_reply).tolist()
                            
                            # Implement a simple JSON-based Vector Store for now
                            vector_file = os.path.join(memory_dir, f"{session_id}_vectors.json")
                            vector_entry = {
                                "text": ai_reply[:50] + "...", # Snippet
                                "vector": vector[:5], # Store preview only to keep logs clean
                                "full_vector_dim": len(vector)
                            }
                            
                            # Append to vector file
                            existing_vectors = []
                            if os.path.exists(vector_file):
                                with open(vector_file, 'r') as vf: existing_vectors = json.load(vf)
                            
                            existing_vectors.append(vector_entry)
                            
                            with open(vector_file, 'w') as vf:
                                json.dump(existing_vectors, vf)
                                
                            print(f"[EMBED] Embedded response (Dim: {len(vector)})")
                            
                        except Exception as emb_err:
                            print(f"[WARN] Embedding Error: {emb_err} (Is sentence-transformers installed?)")

                        response = {
                            "status": "success",
                            "agent": "DeepSeek-V3",
                            "content": ai_reply,
                            "reply": ai_reply,
                            "logs": f"✅ Agent: Success. (Memory Saved: {memory_file})"
                        }
                    else:
                        raise Exception(f"API Error {api_res.status_code}: {api_res.text}")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"[SUCCESS] Served Response")
                
            except Exception as e:
                print(f"[ERROR] Error: {e}")
                self.send_error(500, f"Server Error: {e}")
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        path = self.path.strip('/')
        print(f"[GET] Request: {path}")
        
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
            print(f"[SERVED] Served: {filename}")
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
    print("[SERVER] PUMO Data Server")
    print(f"[START] Starting on port {PORT}")
    print(f"[TEST] Test: http://localhost:{PORT}/v1/shop-sync/pumo-kpis")
    print(f"[INFO] Dashboard: http://localhost:{PORT}")
    
    with socketserver.TCPServer(("", PORT), PUMOHandler) as httpd:
        httpd.serve_forever()