# Network Control - Orchestration Quick Start

## 🚀 One-Command Start

### **Option 1: VS Code Tasks** (Recommended)

1. Press `Ctrl+Shift+P`
2. Type: "Tasks: Run Task"
3. Select: **"Network Control: Start Full Stack"**

This will start:

- ✅ Backend API (port 3885)
- ✅ Frontend Dev Server (port 5173)
- ✅ Agent Zero (port 50100) - Optional

---

### **Option 2: Manual Start**

```powershell
# Terminal 1 - Backend API
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\api
python -m uvicorn app.main:app --port 3885 --reload

# Terminal 2 - Network Control Frontend
cd U:\The_yellow_hub\JIMBO_devz_inc_HUB\Jimbo_77\frontend\apps\network-control
npm run dev

# Terminal 3 - Agent Zero (Optional)
cd U:\The_yellow_hub\agents\agent-zero
python main.py --port 50100
```

---

## ✅ Verify Installation

### **1. Backend API**

```
http://localhost:3885/docs
```

Look for endpoints:

- `POST /api/network/orchestrate`
- `GET /api/network/orchestration/status`

### **2. Frontend**

```
http://localhost:5173
```

Click **"🎯 Orchestration"** tab in sidebar.

### **3. Test Orchestration**

**Task Example:**

```
Analyze network security and recommend improvements
```

**Expected Flow:**

1. Jimbo decomposes task ✅
2. Brain creates strategy ✅
3. Pinky validates (APPROVE) ✅
4. Workers execute (placeholder) ✅
5. Elwirka finalizes with checklist ✅

---

## 🔧 Configuration

### **OpenRouter API Key** (for fallback)

Edit [api/app/routes/network.py](../../../../api/app/routes/network.py) line ~15:

```python
OPENROUTER_KEY = "sk-or-v1-YOUR-KEY-HERE"
```

**Or use environment variable:**

```bash
set OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY
```

---

## 🎯 First Test

1. Open http://localhost:5173
2. Click **🎯 Orchestration** tab
3. Enter task: `Check system health and security`
4. Click **Start Orchestration**
5. Watch flow: Jimbo → Brain → Pinky → Workers → Elwirka

---

## 📖 Documentation

- [ORCHESTRATION_INTEGRATION.md](./ORCHESTRATION_INTEGRATION.md) - Full integration guide
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Original network control docs
- [README.md](./README.md) - App overview

---

## 🆘 Troubleshooting

### **Error: "Both Agent Zero and OpenRouter unavailable"**

**Solution:** Set OpenRouter API key in network.py

### **Error: "CORS"**

**Solution:** Backend CORS already configured in main.py (allow_origins: ["*"])

### **Error: "Cannot connect to backend"**

**Solution:** Verify backend is running on port 3885:

```powershell
curl http://localhost:3885/health
```

---

## 🎉 You're Ready!

Network Control + Orchestration = **Complete Infrastructure Management Platform**
