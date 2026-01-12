# Cloudflare Pages Deployment Guide

## Frontend Apps Deployment

### 1. Hub App (hub.ops.jimbo77.org)

**Cloudflare Pages Settings:**

- **Project name**: `jimbo77-hub`
- **Production branch**: `main`
- **Build command**: `cd gp4-project/frontend && pnpm install --frozen-lockfile && pnpm --filter @apps/hub build`
- **Build output directory**: `gp4-project/frontend/apps/hub/dist`
- **Root directory**: `/` (leave empty or root)

**Environment Variables:**

```
VITE_API_BASE=https://api.ops.jimbo77.org
VITE_ENV=prod
```

**Custom Domain:**
- Add custom domain: `hub.ops.jimbo77.org`
- DNS: CNAME `hub.ops.jimbo77.org` → `jimbo77-hub.pages.dev`

---

### 2. Project App - PUMO (pumo.ops.jimbo77.org)

**Cloudflare Pages Settings:**

- **Project name**: `jimbo77-pumo`
- **Production branch**: `main`
- **Build command**: `cd gp4-project/frontend && pnpm install --frozen-lockfile && pnpm --filter @apps/project build`
- **Build output directory**: `gp4-project/frontend/apps/project/dist`

**Environment Variables:**

```
VITE_API_BASE=https://api.ops.jimbo77.org
VITE_ENV=prod
VITE_PROJECT_ID=pumo
```

**Custom Domain:**
- Add custom domain: `pumo.ops.jimbo77.org`
- DNS: CNAME `pumo.ops.jimbo77.org` → `jimbo77-pumo.pages.dev`

---

### 3. Project App - ZENON (zenon.ops.jimbo77.org)

**Cloudflare Pages Settings:**

- **Project name**: `jimbo77-zenon`
- **Production branch**: `main`
- **Build command**: `cd gp4-project/frontend && pnpm install --frozen-lockfile && pnpm --filter @apps/project build`
- **Build output directory**: `gp4-project/frontend/apps/project/dist`

**Environment Variables:**

```
VITE_API_BASE=https://api.ops.jimbo77.org
VITE_ENV=prod
VITE_PROJECT_ID=zenon
```

**Custom Domain:**
- Add custom domain: `zenon.ops.jimbo77.org`
- DNS: CNAME `zenon.ops.jimbo77.org` → `jimbo77-zenon.pages.dev`

---

### 4. Project App - BLOGOPS (blogops.ops.jimbo77.org)

**Cloudflare Pages Settings:**

- **Project name**: `jimbo77-blogops`
- **Production branch**: `main`
- **Build command**: `cd gp4-project/frontend && pnpm install --frozen-lockfile && pnpm --filter @apps/project build`
- **Build output directory**: `gp4-project/frontend/apps/project/dist`

**Environment Variables:**

```
VITE_API_BASE=https://api.ops.jimbo77.org
VITE_ENV=prod
VITE_PROJECT_ID=blogops
```

**Custom Domain:**
- Add custom domain: `blogops.ops.jimbo77.org`
- DNS: CNAME `blogops.ops.jimbo77.org` → `jimbo77-blogops.pages.dev`

---

## Build Configuration Notes

### pnpm Installation

Cloudflare Pages automatically detects `pnpm-workspace.yaml` and uses pnpm. If not:

**Build command prefix:**
```bash
npm install -g pnpm@9.12.3 && cd gp4-project/frontend && pnpm install --frozen-lockfile && pnpm --filter @apps/hub build
```

### Node.js Version

Set in Cloudflare Pages environment variables:
```
NODE_VERSION=18
```

---

## Deployment Steps

1. **Connect GitHub Repository**:
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project" → "Connect to Git"
   - Select repository: `Bonzokoles/JIMBO_devz_inc_HUB`

2. **Create Pages Projects** (repeat for each app):
   - Hub: `jimbo77-hub`
   - PUMO: `jimbo77-pumo`
   - ZENON: `jimbo77-zenon`
   - BLOGOPS: `jimbo77-blogops`

3. **Configure Build Settings** (per project):
   - Set build command, output directory, env vars (see above)

4. **Add Custom Domains**:
   - In each Pages project → Custom domains
   - Add respective subdomain (e.g., `hub.ops.jimbo77.org`)

5. **Update DNS**:
   - In Cloudflare DNS for `jimbo77.org`
   - Add CNAME records pointing to `.pages.dev` domains

---

## Verification

After deployment, verify:

```bash
curl https://hub.ops.jimbo77.org
curl https://pumo.ops.jimbo77.org
curl https://zenon.ops.jimbo77.org
curl https://blogops.ops.jimbo77.org
```

All should return the React app HTML.

---

## Troubleshooting

### Build fails with "pnpm not found"

Add to build command:
```bash
npm install -g pnpm@9.12.3 &&
```

### Build fails with "workspace not found"

Ensure build command includes:
```bash
cd gp4-project/frontend &&
```

### App shows blank page

Check browser console for API errors. Verify `VITE_API_BASE` env var is set correctly.
