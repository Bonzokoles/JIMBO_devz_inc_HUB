# MEBLE PUMO - IdoSell Integration Plan
**Data**: 13 stycznia 2026
**Cel**: Połączenie sklepu MeblePumo.pl z dashboard analytics

## 📊 Obecny Stan - MeblePumo.pl (IdoSell)

### Dane ze sklepu (XML Feed):
- **Products**: 529,361 linii XML produktów
- **Format**: IdoSell IOF (Internet Open Format)  
- **URL**: `https://www.meblepumo.pl/pl/products/*.feed10009`
- **Categories**: Łóżka, stelaże, materace, komfort snu
- **Pricing**: Retail vs Wholesale pricing
- **Delivery**: 1-day delivery times

### Przykład produktu:
```xml
<product id="609" currency="PLN">
  <producer name="RECTICEL Komfort Snu Sp. z o.o."/>
  <category name="Łóżka i części/Stelaże do łóżek"/>
  <name>Stelaż Power42 NV</name>
  <price gross="400" net="325" vat="23.0"/>
  <price_wholesale gross="250" net="203" vat="23.0"/>
  <delivery_time days="1"/>
  <card url="https://www.meblepumo.pl/pl/products/stelaz-power42-nv-609.feed10009"/>
</product>
```

## 🎯 Integration Goals

1. **Real-time Analytics Dashboard**
   - Sprzedaż w czasie rzeczywistym
   - Top produkty, kategorie  
   - Marże retail vs wholesale
   - Stock levels i delivery times

2. **AI Business Intelligence**
   - Trend analysis produktów
   - Pricing optimization suggestions
   - Customer behavior insights
   - Automated reporting

3. **Inventory Management**  
   - Stock alerts
   - Demand forecasting
   - Supplier performance
   - Seasonal trends

## 🔧 Technical Architecture

### Current JIMBO77 Stack (Ready):
- ✅ API Server: FastAPI on port 8001
- ✅ Frontend: React dashboards (Hub + Project)
- ✅ Database: PostgreSQL + Redis
- ✅ Real-time: WebSocket capabilities
- ✅ AI Integration: OpenAI/Mistral ready

### IdoSell Integration Requirements:

1. **Data Ingestion Layer**
   ```python
   # XML Feed Parser
   class IdosellFeedParser:
       def parse_xml_feed(self, feed_url: str) -> List[Product]
       def extract_product_data(self, product_xml) -> ProductModel
       def sync_product_changes(self) -> UpdateResult
   ```

2. **Analytics API Endpoints**
   ```python
   # New API routes for business analytics
   /v1/meble-pumo/products           # Product catalog
   /v1/meble-pumo/sales              # Sales data  
   /v1/meble-pumo/analytics/trends   # Trend analysis
   /v1/meble-pumo/analytics/margins  # Margin analysis
   /v1/meble-pumo/inventory          # Stock levels
   ```

3. **Real-time Dashboard**
   - Live sales monitoring
   - Product performance charts
   - Margin analysis graphs  
   - Inventory alerts

## 📈 Implementation Steps

### Phase 1: Data Integration (Week 1)
1. **XML Feed Parser**
   - Parse 529k+ products from XML
   - Extract: name, price, category, stock, delivery
   - Store in PostgreSQL with proper indexing

2. **Database Schema**
   ```sql
   -- Products table
   CREATE TABLE meble_pumo_products (
       id INTEGER PRIMARY KEY,
       name VARCHAR(255),
       producer VARCHAR(255), 
       category VARCHAR(255),
       price_retail DECIMAL(10,2),
       price_wholesale DECIMAL(10,2),
       vat_rate DECIMAL(5,2),
       delivery_days INTEGER,
       url VARCHAR(500),
       last_updated TIMESTAMP
   );
   
   -- Analytics aggregates
   CREATE TABLE product_analytics (
       product_id INTEGER,
       date DATE,
       views INTEGER DEFAULT 0,
       sales INTEGER DEFAULT 0,
       revenue DECIMAL(12,2) DEFAULT 0,
       margin_percent DECIMAL(5,2)
   );
   ```

### Phase 2: Business Analytics (Week 2)  
1. **Sales Analytics API**
   - Daily/weekly/monthly reports
   - Top selling products
   - Category performance
   - Margin analysis

2. **AI Insights Engine**
   - Trend detection algorithms
   - Price optimization suggestions  
   - Demand forecasting models
   - Automated business reports

### Phase 3: Dashboard UI (Week 3)
1. **Real-time Business Dashboard**
   - Sales KPI widgets
   - Product performance charts
   - Inventory management panel
   - Profit margin visualizations

2. **Mobile Responsive Design**
   - Manager mobile view
   - Push notifications for alerts
   - Offline capability for key metrics

## 🛠️ Next Actions

1. **Start XML Parser Development**
   - Create `meble_pumo_integration/` module in API
   - Implement IdosellFeedParser class  
   - Test with sample XML data

2. **Setup Database Schema**
   - Create migrations for product tables
   - Add indexes for fast analytics queries
   - Setup data sync scheduling

3. **Build Analytics API**
   - Implement business intelligence endpoints
   - Add real-time WebSocket updates
   - Create export capabilities

4. **Dashboard Development**
   - Extend existing JIMBO77 frontend
   - Add MeblePumo-specific widgets
   - Implement user access control

## 💡 Business Value

- **Real-time visibility** into shop performance
- **Data-driven decisions** for pricing and inventory
- **Automated insights** reducing manual analysis
- **Scalable architecture** for future integrations
- **AI-powered recommendations** for business optimization

---

**Status**: Ready to implement - JIMBO77 platform prepared
**Priority**: High - Direct business impact
**Timeline**: 3 weeks to full implementation