# Cloudflare Workers Deployment Checklist

Follow these steps in order to deploy your AI Portal to Cloudflare Workers.

## Prerequisites ✅

- [ ] Cloudflare account with Workers enabled
- [ ] `wrangler` CLI installed: `npm install -g wrangler`
- [ ] GitHub repository for the project
- [ ] Domain `kaileh.dev` configured in Cloudflare

## Step 1: Initial Setup 🚀

1. [ ] Run the setup script from project root:
   ```bash
   chmod +x scripts/setup-workers.sh
   ./scripts/setup-workers.sh
   ```

2. [ ] Create production environment file:
   ```bash
   echo 'VITE_BACKEND_URL=https://aiapi.kaileh.dev' > .env.production
   ```

3. [ ] Install backend worker dependencies:
   ```bash
   cd backend-worker
   npm install
   cd ..
   ```

## Step 2: Configure Cloudflare 🔧

1. [ ] Login to Wrangler:
   ```bash
   wrangler login
   ```

2. [ ] Create API Token at https://dash.cloudflare.com/profile/api-tokens with permissions:
   - Account: Cloudflare Workers Scripts:Edit
   - Zone: Zone:Read, Workers Routes:Edit

3. [ ] Save the API token for GitHub Actions

## Step 3: Backend Worker Deployment 🔌

1. [ ] Navigate to backend-worker:
   ```bash
   cd backend-worker
   ```

2. [ ] Test locally:
   ```bash
   wrangler dev
   # Visit http://localhost:8787/health
   ```

3. [ ] Deploy backend:
   ```bash
   wrangler deploy --env production
   ```

4. [ ] Configure secrets in Cloudflare Dashboard:
   - Go to Workers & Pages → ai-portal-backend → Settings → Variables
   - Add encrypted variables:
     - `OPENROUTER_API_KEY`: xxxx
     - `GEMINI_API_KEY`: xxxx
     - `BRAVE_API_KEY`: xxxx

## Step 4: Frontend Deployment 🎨

1. [ ] Return to project root and build frontend:
   ```bash
   cd ..
   npm run build
   ```

2. [ ] Test frontend locally:
   ```bash
   wrangler dev
   # Visit http://localhost:8788
   ```

3. [ ] Deploy frontend:
   ```bash
   wrangler deploy --env production
   ```

## Step 5: Domain Configuration 🌐

1. [ ] In Cloudflare Dashboard → Workers & Pages:
   
   **For Backend (ai-portal-backend):**
   - [ ] Go to Custom Domains tab
   - [ ] Add domain: `aiapi.kaileh.dev`
   - [ ] Wait for DNS propagation (few minutes)
   
   **For Frontend (ai-portal-frontend):**
   - [ ] Go to Custom Domains tab
   - [ ] Add domain: `ai.kaileh.dev`
   - [ ] Wait for DNS propagation (few minutes)

## Step 6: GitHub Actions Setup 🔄

1. [ ] In your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add new repository secret:
     - Name: `CF_API_TOKEN`
     - Value: [Your Cloudflare API token from Step 2]

2. [ ] Commit and push deployment files:
   ```bash
   git add .
   git commit -m "Add Cloudflare Workers deployment configuration"
   git push origin main
   ```

3. [ ] Verify GitHub Actions deployment:
   - Go to Actions tab in GitHub
   - Check "Deploy to Cloudflare Workers" workflow

## Step 7: Testing & Verification ✅

1. [ ] Test backend endpoints:
   ```bash
   # Health check
   curl https://aiapi.kaileh.dev/health
   
   # Models list
   curl https://aiapi.kaileh.dev/api/models
   ```

2. [ ] Test frontend:
   - [ ] Visit https://ai.kaileh.dev
   - [ ] Test chat functionality
   - [ ] Test image generation
   - [ ] Test RSS feeds
   - [ ] Check browser console for errors

3. [ ] Verify CORS:
   - [ ] Check network tab for CORS headers
   - [ ] Ensure no CORS errors in console

## Step 8: Monitoring 📊

1. [ ] Set up monitoring in Cloudflare Dashboard:
   - Workers & Pages → Your Workers → Analytics
   - Monitor:
     - [ ] Request count
     - [ ] Error rate
     - [ ] Response times

2. [ ] Set up alerts (optional):
   - [ ] Configure email alerts for errors
   - [ ] Set up uptime monitoring

## Common Issues & Solutions 🔧

### CORS Errors
- Check `ALLOWED_ORIGINS` in backend wrangler.toml
- Verify domain matches exactly

### API Key Errors
- Ensure secrets are set in Cloudflare dashboard (not wrangler.toml)
- Check secret names match exactly in code

### Build Failures
- Check for Node.js-specific APIs (fs, path, etc.)
- Ensure all dependencies are Workers-compatible

### Domain Not Working
- Wait 5-10 minutes for DNS propagation
- Check domain is active in Cloudflare DNS

## Post-Deployment 🎉

- [ ] Update any external services with new API URL
- [ ] Update documentation with new URLs
- [ ] Test all features thoroughly
- [ ] Monitor logs for first 24 hours

## Rollback Plan 🔄

If issues occur:
1. Revert to previous deployment in Workers dashboard
2. Or redeploy previous git commit:
   ```bash
   git checkout <previous-commit>
   git push origin main
   ```

---

**Success!** Your AI Portal is now running on Cloudflare Workers at:
- Frontend: https://ai.kaileh.dev
- Backend API: https://aiapi.kaileh.dev 