# 🚀 AI MARKETPLACE - DEPLOYMENT GUIDE

## Quick Start (5 minutes)

### Prerequisites
```bash
node >= 18
npm or yarn
wrangler CLI
```

### 1. Install & Setup
```bash
# Clone or create project
git clone <repo> ai-marketplace
cd ai-marketplace

# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create ai-marketplace
```

### 2. Setup Database
```bash
# Apply schema
wrangler d1 execute ai-marketplace --file=schema.sql

# Seed initial data
wrangler d1 execute ai-marketplace --file=seed.sql
```

### 3. Configure Environment
Create `.env.local`:
```env
OPENAI_API_KEY=sk_live_...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=your-key
JWT_SECRET=your-super-secret-key-change-this
ENVIRONMENT=development
```

### 4. Deploy to Cloudflare
```bash
# Development
npm run dev

# Production
npm run deploy:prod
```

---

## 📁 Project Structure

```
ai-marketplace/
├── src/
│   ├── index.ts              # Main Hono app
│   ├── routes/
│   │   ├── auth.ts           # Authentication
│   │   ├── tasks.ts          # Task execution
│   │   ├── analytics.ts      # User analytics
│   │   └── models.ts         # Model management
│   └── utils/
│       └── db.ts             # Database helpers
├── public/
│   └── index.html            # Frontend (from previous dashboard)
├── wrangler.toml             # Cloudflare config
├── schema.sql                # Database schema
├── seed.sql                  # Initial data
├── package.json
└── tsconfig.json
```

---

## 🔑 Environment Variables

**Production (wrangler.toml):**
```toml
[env.production]
vars = { 
  ENVIRONMENT = "production"
  OPENAI_API_KEY = "sk_live_..."
  ANTHROPIC_API_KEY = "sk-ant-..."
  MISTRAL_API_KEY = "..."
  JWT_SECRET = "your-secret"
  STRIPE_SECRET_KEY = "sk_live_..."
}
```

---

## 🗄️ Database Setup

### Create Database
```bash
wrangler d1 create ai-marketplace
```

### Get Database ID
```bash
wrangler d1 list
# Copy database_id from output
```

### Update wrangler.toml
```toml
[[d1_databases]]
binding = "DB"
database_name = "ai-marketplace"
database_id = "your-database-id"
```

### Migrate Schema
```bash
wrangler d1 execute ai-marketplace --file=schema.sql --remote
```

### Seed Data
```bash
wrangler d1 execute ai-marketplace --file=seed.sql --remote
```

---

## 🚀 Deployment Steps

### Step 1: Build
```bash
npm run build
```

### Step 2: Test Locally
```bash
npm run dev
# Visit http://localhost:8787
```

### Step 3: Deploy to Staging
```bash
npm run deploy
```

### Step 4: Deploy to Production
```bash
npm run deploy:prod
```

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify-token` - Verify JWT

### Tasks
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks/:id/rate` - Rate task

### Analytics
- `GET /api/analytics/summary` - Dashboard summary
- `GET /api/analytics/costs` - Cost breakdown
- `GET /api/analytics/hourly` - Hourly costs
- `GET /api/analytics/quality` - Quality ratings

### Models
- `GET /api/models` - List models
- `GET /api/models/recommendations/:taskType` - Model suggestions
- `GET /api/models/compare` - Compare models

---

## 🔐 Authentication

### Register
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure_password"
  }'
```

### Use Token
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8787/api/tasks
```

---

## 💰 Cost Calculation

Models are automatically selected based on task type and tier:

**Budget Tier:** Fastest & Cheapest
- Copywriting: $0.02 (Mistral x2)
- Blog: $0.05 (Mistral)
- Code: $0.03 (Mistral)

**Standard Tier:** Recommended (balanced)
- Copywriting: $0.50 (GPT-4 + Mistral)
- Blog: $2.50 (GPT-4)
- Code: $3.00 (GPT-4)

**Premium Tier:** High Quality
- Copywriting: $3.00 (GPT-4 + Claude + voting)
- Blog: $8.00 (GPT-4 + Claude + editing)
- Code: $6.00 (GPT-4 + Mistral)

**Enterprise Tier:** Maximum Quality
- Full 3-4 model ensemble
- $12-25 per task

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Local Testing
```bash
npm run dev
# Test endpoints with curl or Postman
```

### Database Testing
```bash
wrangler d1 execute ai-marketplace --file=test.sql
```

---

## 📈 Monitoring

### Logs
```bash
wrangler tail
```

### Analytics
Dashboard at `/api/analytics/summary` provides:
- Monthly budget usage
- Task completion stats
- Average quality scores
- Cost trends

---

## 🎯 Next Steps

1. **Frontend Integration** - Connect React/Vue to API
2. **Payment Processing** - Add Stripe for subscriptions
3. **Webhooks** - Real-time notifications
4. **API Rate Limiting** - Protect endpoints
5. **Advanced Caching** - KV store optimization
6. **Email Notifications** - Alert system

---

## 📞 Support

For issues or questions:
1. Check logs: `wrangler tail`
2. Debug locally: `npm run dev`
3. Test API: Use curl/Postman examples above
4. Database issues: `wrangler d1 query`

---

## 🔄 Updates & Maintenance

### Update Dependencies
```bash
npm update
npm run build
npm run deploy:prod
```

### Database Migrations
```bash
# Create new migration file
wrangler d1 execute ai-marketplace --file=migrations/001-add-column.sql

# Apply to remote
wrangler d1 execute ai-marketplace --file=migrations/001-add-column.sql --remote
```

---

## 💡 Tips

- Use `wrangler dev --local` for offline development
- Enable D1 local mode for faster iteration
- Monitor costs with `/api/analytics/costs`
- Test model combinations before production
- Use API keys for programmatic access

Enjoy your AI Marketplace! 🚀
