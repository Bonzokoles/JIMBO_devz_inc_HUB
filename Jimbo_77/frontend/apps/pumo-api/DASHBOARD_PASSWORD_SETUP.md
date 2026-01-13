# Dashboard Password Setup Guide

## Quick Setup

The JIMBO-LIKE-PUMO dashboard requires password authentication in production.

### Using the Helper Script (Recommended)

```bash
cd src/workers/pumo-whitecat
./add-dashboard-password.sh
```

### Manual Setup via Wrangler CLI

```bash
cd src/workers/pumo-whitecat
echo '#HAOS77#' | npx wrangler secret put DASHBOARD_PASSWORD
```

### Manual Setup via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to: **Workers & Pages** → **jimbo-like-pumo-api** → **Settings** → **Variables**
3. Click **Add variable** under "Environment Variables"
4. Select **"Encrypt"** (secret)
5. Name: `DASHBOARD_PASSWORD`
6. Value: `#HAOS77#`
7. Click **Save**

## Accessing the Dashboard

After setting the password:

- **Production URL**: https://jimbo-like-pumo-api.workers.dev/dashboard
- **Local Dev**: http://127.0.0.1:8787/dashboard (no password required)

### Login Credentials

When prompted by the browser:
- **Username**: any value (e.g., `admin`, `user` - not validated)
- **Password**: `#HAOS77#` (required)

## Deployment Status

### Checking Deployment

After merging this PR, the worker will auto-deploy via GitHub Actions when changes are pushed to `main` branch.

To verify deployment:

```bash
# Check worker status
npx wrangler deployments list

# Test dashboard access
curl -I https://jimbo-like-pumo-api.workers.dev/dashboard
```

### Current Status

- ✅ Password authentication code added (commits: 909332d, 59d9c5f)
- ✅ Route configuration fixed (no more zone errors)
- ⏳ Waiting for PR merge to trigger auto-deployment
- ⏳ Password needs to be set via Wrangler/Dashboard after deployment

## Security Features

The password authentication includes:
- ✅ Constant-time comparison (timing attack resistant)
- ✅ Base64 credential validation
- ✅ Proper error handling
- ✅ CodeQL verified (0 vulnerabilities)

## Troubleshooting

### "Deployment failed - zone does not exist"

This was fixed in commit `f5e46fd` by commenting out the custom route:
```toml
# routes = [
#   { pattern = "api.jimbolikepumo.dev/*", zone_name = "jimbolikepumo.dev" }
# ]
```

Worker now deploys to: `jimbo-like-pumo-api.workers.dev`

### "Unauthorized" when accessing dashboard

Make sure you've set the `DASHBOARD_PASSWORD` secret as described above.

### Local development doesn't require password

Correct! Authentication is automatically disabled on `localhost` for development convenience.

## Next Steps

1. ✅ Merge this PR to `main`
2. Wait for GitHub Actions deployment to complete
3. Set `DASHBOARD_PASSWORD` secret using one of the methods above
4. Access dashboard at production URL
