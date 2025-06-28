# DNS Setup Instructions for AI Portal on Cloudflare

## Overview

To make your custom domains work with Cloudflare Workers, you need to add DNS records in your Cloudflare dashboard. The Workers are already deployed and configured with routes, but the DNS records are missing.

## Required DNS Records

### 1. Frontend Domain (ai.kaileh.dev)

**Type:** AAAA  
**Name:** `ai`  
**IPv6 address:** `100::`  
**Proxy status:** ✅ Proxied (Orange Cloud ON)  
**TTL:** Auto  

### 2. Backend API Domain (aiapi.kaileh.dev)

**Type:** AAAA  
**Name:** `aiapi`  
**IPv6 address:** `100::`  
**Proxy status:** ✅ Proxied (Orange Cloud ON)  
**TTL:** Auto  

## Step-by-Step Instructions

1. **Log into Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Log in with your credentials

2. **Select Your Domain**
   - Click on the `kaileh.dev` domain from your domain list

3. **Navigate to DNS Section**
   - Click on "DNS" in the left sidebar

4. **Add Frontend DNS Record**
   - Click the "Add record" button
   - Select **AAAA** as the Type
   - Enter `ai` in the Name field (just `ai`, not the full domain)
   - Enter `100::` in the IPv6 address field
   - Ensure Proxy status is **Proxied** (orange cloud icon)
   - Click "Save"

5. **Add Backend DNS Record**
   - Click the "Add record" button again
   - Select **AAAA** as the Type
   - Enter `aiapi` in the Name field (just `aiapi`, not the full domain)
   - Enter `100::` in the IPv6 address field
   - Ensure Proxy status is **Proxied** (orange cloud icon)
   - Click "Save"

## Important Notes

- The `100::` IPv6 address is a special Cloudflare address for Worker routes
- The orange cloud (Proxied) MUST be enabled for Workers to function
- DNS propagation usually takes 1-5 minutes within Cloudflare's network
- If you're using external DNS providers, this won't work - the domain must be on Cloudflare

## Testing Your Setup

After adding the DNS records, you can test:

1. Wait 1-2 minutes for DNS propagation
2. Visit https://ai.kaileh.dev in your browser
3. The frontend should load successfully
4. Check the browser console - it should now connect to https://aiapi.kaileh.dev/api

## Troubleshooting

If the domains don't work after adding DNS records:

1. **Clear browser cache** - Use Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Check DNS propagation** - Use `nslookup ai.kaileh.dev` to verify
3. **Verify Worker deployment** - Check that Workers show the routes in Cloudflare dashboard
4. **Check Proxy status** - Ensure the orange cloud is ON for both records

## Current Worker URLs (for reference)

While waiting for DNS:
- Frontend: https://ai-portal-frontend-production.kellenhe.workers.dev
- Backend: https://ai-portal-backend-production.kellenhe.workers.dev 