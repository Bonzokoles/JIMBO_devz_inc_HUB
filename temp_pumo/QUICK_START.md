# QUICK START GUIDE - PUMO Dashboard

## 🚀 Błyskawiczny Start (5 minut)

### 1. **Dostęp do Dashboard**
```
URL: https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/dashboard
Login: Bonzo
Password: #HAOS77#
```

### 2. **Co zobaczysz**
- 📊 6 KPI kart (Revenue, AI Share, Konwersje, etc.)
- 📈 Wykres Revenue Trend (30 dni) 
- 🥧 Pie chart Traffic Sources
- 🏆 Tabela Top Products
- 🤖 AI Analyst Chat

### 3. **Testowanie funkcji**
- Poczekaj 5 sec → KPI się załadują
- Scroll down → Zobacz wykresy Chart.js
- Wpisz w AI chat: "Analiza sprzedaży materacy"
- Auto-refresh co 30s

### 4. **API Test**
```bash
curl -u "Bonzo:#HAOS77#" \
"https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/analytics/kpis"
```

## 🛠️ Development Setup

```bash
# Clone i setup
cd pumo-whitecat/
npm install
npm run dev

# Local: http://localhost:8787/dashboard
```

## 📱 Features Checklist
- ✅ Neon UI (#00ff41 + #0affff)
- ✅ Chart.js wykresy
- ✅ Real-time data 
- ✅ AI chat
- ✅ Mobile responsive
- ✅ Auto-refresh (30s)

## 🔧 Customization
Edytuj `dashboard-export.html`:
- Colors: Zmień `#00ff41` na swój kolor
- API: Modify endpoint URLs w JavaScript
- Layout: CSS Grid + Flexbox

**That's it! Ready to go!** 🎉