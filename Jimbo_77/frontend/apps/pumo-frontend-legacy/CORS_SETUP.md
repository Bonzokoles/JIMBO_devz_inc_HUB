# PUMO Worker CORS Configuration

## Update ALLOWED_ORIGINS in Cloudflare Dashboard

### Step 1: Go to Cloudflare Dashboard

1. Open https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on **jimbo-like-pumo-api**
4. Go to **Settings** → **Variables**

### Step 2: Update ALLOWED_ORIGINS

Find the `ALLOWED_ORIGINS` variable and update it to:

```
https://www.mybonzoaiblog.com,http://localhost:4656,http://localhost:3002,https://pumo.jimbo77.com,https://jimbo77.com
```

**Added:**
- `http://localhost:3002` - PUMO dashboard (development)
- `https://pumo.jimbo77.com` - PUMO dashboard (production)
- `https://jimbo77.com` - Main Hub

### Step 3: Save and Deploy

Click **Save and Deploy** to apply changes.

## Test CORS

### From Browser Console (localhost:3002)

```javascript
fetch('https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/analytics/kpis')
  .then(r => r.json())
  .then(data => console.log('KPIs:', data))
  .catch(err => console.error('Error:', err));
```

### From Terminal

```bash
# Test with CORS headers
curl -H "Origin: http://localhost:3002" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/analytics/kpis
```

## Expected Response

Should return CORS headers:
```
Access-Control-Allow-Origin: http://localhost:3002
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Troubleshooting

### CORS Error in Browser

**Error:** `Access to fetch at '...' from origin 'http://localhost:3002' has been blocked by CORS policy`

**Solution:**
1. Verify ALLOWED_ORIGINS includes `http://localhost:3002`
2. Check worker is deployed (not just saved)
3. Clear browser cache
4. Wait 1-2 minutes for Cloudflare to propagate changes

### 401 Unauthorized

**Error:** API returns 401

**Solution:**
- Some endpoints may require authentication
- Check if `PUMO_API_KEY` is needed in headers
- For public endpoints (KPIs, charts), no auth should be required

## Next Steps

After CORS is configured:

1. ✅ Run PUMO dashboard: `pnpm dev`
2. ✅ Open http://localhost:3002
3. ✅ Dashboard should load data from worker
4. ✅ Charts should populate with real data
5. ✅ AI chat should work

## Production Deployment

When deploying to Cloudflare Pages:

1. Set environment variable in Pages dashboard:
   ```
   VITE_API_BASE=https://jimbo-like-pumo-api.stolarnia-ams.workers.dev
   ```

2. CORS already configured for `https://pumo.jimbo77.com`

3. Deploy and test!
