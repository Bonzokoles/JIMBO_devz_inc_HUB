# Cloudflare Access Setup Guide

## Overview

Cloudflare Access zabezpiecza OPS domain (`jimbo77.org`) przed nieautoryzowanym dostępem. Każda subdomena wymaga uwierzytelnienia przez Cloudflare Access z 2FA.

---

## 1. Cloudflare Access Application Setup

### Global Policy (All OPS Subdomains)

**Application Name**: `JIMBO77 OPS - Global`

**Application Domain**: `*.ops.jimbo77.org`

**Policy Name**: `OPS Access - Authenticated Users`

**Policy Rules**:
- **Include**: Emails ending in `@jimbo77.com` OR specific emails (owner, admin, dev)
- **Require**: One-time PIN (2FA)

**Session Duration**: 24 hours

---

### Per-Subdomain Policies (Optional - Fine-grained Control)

#### Hub (hub.ops.jimbo77.org)

**Application Name**: `JIMBO77 Hub`

**Policy**: Same as global (all authenticated users)

---

#### Project Dashboards (pumo/zenon/blogops.ops.jimbo77.org)

**Application Name**: `JIMBO77 Project - {PROJECT_ID}`

**Policy**: 
- **Include**: Users with role `owner`, `admin`, `dev` for this project
- **Require**: One-time PIN

---

## 2. JWT Configuration for API

### Get JWKS URL and Audience

1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Select your application (e.g., `JIMBO77 OPS - Global`)
3. Click "Configure" → "Overview"
4. Copy:
   - **Team Domain**: `YOUR_TEAM.cloudflareaccess.com`
   - **Application Audience (AUD) Tag**: `YOUR_AUDIENCE_TAG`

### JWKS URL Format

```
https://YOUR_TEAM.cloudflareaccess.com/cdn-cgi/access/certs
```

### Issuer Format

```
https://YOUR_TEAM.cloudflareaccess.com
```

---

## 3. API Environment Variables

Update `gp4-project/api/.env`:

```env
# Cloudflare Access
CF_JWKS_URL=https://YOUR_TEAM.cloudflareaccess.com/cdn-cgi/access/certs
CF_AUDIENCE=YOUR_AUDIENCE_TAG
CF_ISSUER=https://YOUR_TEAM.cloudflareaccess.com

# RBAC
OWNERS=bonzo@jimbo77.com
ADMINS=admin@jimbo77.com
DEVS=dev@jimbo77.com
```

---

## 4. Testing Access

### Test Authentication Flow

1. Navigate to `https://hub.ops.jimbo77.org`
2. Should redirect to Cloudflare Access login
3. Enter email → Receive OTP → Enter OTP
4. Should redirect back to Hub with JWT cookie

### Verify JWT in API

API should receive JWT in header:
```
Cf-Access-Jwt-Assertion: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

API verifies JWT and extracts user email for RBAC.

---

## 5. RBAC Roles

### Role Hierarchy

- **owner**: Full access (all permissions)
- **admin**: Project configuration + service control
- **dev**: Service restart + deploy
- **viewer**: Read-only (status, logs)

### Permissions Map

```
viewer: ["status.read", "logs.read"]
dev:    ["status.read", "logs.read", "service.restart", "deploy.run"]
admin:  ["status.read", "logs.read", "service.restart", "deploy.run", "project.configure"]
owner:  ["*"]
```

### Role Assignment

Roles are assigned in API based on email:
- Email in `OWNERS` env var → `owner`
- Email in `ADMINS` env var → `admin`
- Email in `DEVS` env var → `dev`
- Otherwise → `viewer`

---

## 6. Security Best Practices

1. **Always use 2FA** (One-time PIN or hardware key)
2. **Limit session duration** to 24 hours max
3. **Rotate JWKS keys** periodically (Cloudflare handles this)
4. **Monitor audit logs** for suspicious activity
5. **Use service tokens** for API-to-API communication (if needed)

---

## 7. Troubleshooting

### "Access Denied" on subdomain

- Verify email is in Access policy
- Check session hasn't expired
- Clear cookies and re-authenticate

### API returns 401 Unauthorized

- Verify `CF_JWKS_URL`, `CF_AUDIENCE`, `CF_ISSUER` are correct
- Check JWT is being sent in `Cf-Access-Jwt-Assertion` header
- Verify API can reach JWKS URL (network/firewall)

### User has wrong role

- Check email matches exactly in env vars (`OWNERS`, `ADMINS`, `DEVS`)
- Restart API after changing env vars
