# Vercel Deployment Guide

**Project**: Battery Circular Economy - Supply Chain Traceability Platform
**Date**: December 26, 2024

---

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Repository**
   - Click "Import Project"
   - Select GitHub
   - Choose repository: `Fragar1910/supply-chain-battery-circular-economy`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Environment Variables**
   Add these in Vercel dashboard:

   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = [Get from https://cloud.walletconnect.com/]
   NEXT_PUBLIC_ENABLE_TESTNETS = true
   NEXT_PUBLIC_CHAIN_ID = 31337
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get deployment URL: `https://your-project.vercel.app`

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Web Directory**
   ```bash
   cd web
   ```

4. **Deploy**
   ```bash
   # First deployment
   vercel

   # Follow prompts:
   # - Setup and deploy? Y
   # - Which scope? [Your account]
   # - Link to existing project? N
   # - Project name? supply-chain-battery-circular-economy
   # - Directory? ./
   # - Override settings? N
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## ⚙️ Configuration Details

### Project Structure

```
supply-chain-battery-circular-economy/
├── web/                  # Frontend application (deploy this)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.ts
├── sc/                   # Smart contracts (not deployed)
├── vercel.json           # Vercel configuration
└── .env.example          # Environment variables template
```

### Vercel Configuration (`vercel.json`)

The project includes a `vercel.json` file with optimal settings:

```json
{
  "version": 2,
  "name": "supply-chain-battery-circular-economy",
  "buildCommand": "cd web && npm install && npm run build",
  "outputDirectory": "web/.next",
  "framework": "nextjs"
}
```

---

## 🔐 Environment Variables

### Required Variables

1. **NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID**
   - **Required**: YES (for wallet connections)
   - **Get it from**: https://cloud.walletconnect.com/
   - **Steps**:
     1. Sign up at WalletConnect Cloud
     2. Create new project
     3. Copy Project ID
     4. Add to Vercel environment variables

2. **NEXT_PUBLIC_ENABLE_TESTNETS**
   - **Value**: `true`
   - **Purpose**: Enable testnet support

3. **NEXT_PUBLIC_CHAIN_ID** (Optional)
   - **Value**: `31337` (Anvil local) or `137` (Polygon Mainnet)
   - **Default**: Auto-detected from deployed-addresses.json

### How to Add in Vercel Dashboard

1. Go to project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - Key: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - Value: Your WalletConnect Project ID
   - Environment: Production, Preview, Development
4. Click "Save"
5. Redeploy if needed

---

## 🛠️ Build Settings

### Framework Detection

Vercel auto-detects Next.js. Verify these settings:

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `web` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node Version | 18.x or higher |

### Custom Build Command (if needed)

If build fails, try custom command:
```bash
cd web && npm ci && npm run build
```

---

## 📝 Pre-Deployment Checklist

- [x] ✅ Code pushed to GitHub
- [x] ✅ `vercel.json` configured
- [x] ✅ `.env.example` created
- [ ] ⏭️ Get WalletConnect Project ID
- [ ] ⏭️ Configure environment variables in Vercel
- [ ] ⏭️ Test build locally: `cd web && npm run build`
- [ ] ⏭️ Deploy to Vercel
- [ ] ⏭️ Test deployment URL
- [ ] ⏭️ Configure custom domain (optional)

---

## 🧪 Local Build Test

Before deploying, test the build locally:

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

**Expected Output**:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XX kB          XXX kB
├ ○ /dashboard                           XX kB          XXX kB
└ ○ /passport/[bin]                      XX kB          XXX kB
```

---

## 🔍 Troubleshooting

### Build Fails - Module Not Found

**Error**: `Module not found: Can't resolve 'xyz'`

**Solution**:
```bash
cd web
npm install
npm run build
```

### Build Fails - Type Errors

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Check and fix type errors locally
npm run lint
```

### Environment Variables Not Working

**Problem**: Variables not available in production

**Solution**:
1. All public variables must start with `NEXT_PUBLIC_`
2. Add variables in Vercel dashboard
3. Redeploy after adding variables

### Build Timeout

**Error**: Build exceeds 45 minutes

**Solution**:
1. Check for large dependencies
2. Optimize build command
3. Contact Vercel support for timeout increase (if needed)

---

## 🌐 Post-Deployment

### Verify Deployment

1. **Visit Deployment URL**
   - Check homepage loads
   - Check dashboard page
   - Test wallet connection

2. **Test Critical Features**
   - ✅ Connect wallet button works
   - ✅ Dashboard shows "Connect Wallet Required" (without wallet)
   - ✅ Navigation between pages works
   - ✅ No console errors

3. **Check Performance**
   - Run Lighthouse audit
   - Target: Performance > 90, Accessibility > 95

### Configure Custom Domain (Optional)

1. Go to project settings
2. Navigate to "Domains"
3. Add custom domain
4. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Enable Analytics (Optional)

1. Go to project settings
2. Enable "Analytics"
3. Enable "Speed Insights"
4. Monitor performance metrics

---

## 📊 Expected Deployment Metrics

| Metric | Expected Value |
|--------|---------------|
| Build Time | 2-4 minutes |
| Bundle Size | ~800 KB - 1.5 MB |
| First Load JS | ~200-300 KB |
| Lighthouse Performance | 85-95 |
| Lighthouse Accessibility | 95+ |
| Time to Interactive (TTI) | < 3 seconds |

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **Next.js on Vercel**: https://vercel.com/docs/frameworks/nextjs
- **WalletConnect Cloud**: https://cloud.walletconnect.com/
- **GitHub Repository**: https://github.com/Fragar1910/supply-chain-battery-circular-economy

---

## ⚠️ Important Notes

### Security Considerations

1. **Never commit `.env.local`** to Git
2. **WalletConnect Project ID** is public (safe to expose)
3. **RPC URLs** should use HTTPS in production
4. **Contract addresses** are loaded from `deployed-addresses.json`

### Production Blockchain

⚠️ **Current Configuration**: Using Anvil local (development)

**For Production Deployment**:
1. Deploy contracts to Polygon Mainnet or Mumbai testnet
2. Update `deployed-addresses.json` with production addresses
3. Update `NEXT_PUBLIC_CHAIN_ID` to `137` (Polygon) or `80001` (Mumbai)
4. Use production RPC URL (Alchemy/Infura)

### Limitations

- 📱 **Wallet Mock**: Only works in local development (for automated testing)
- 🔗 **Blockchain**: Requires deployed contracts on accessible network
- 💰 **Transactions**: Users need wallet with test/real tokens

---

## 🎉 Success Criteria

✅ Deployment is successful when:

1. Build completes without errors
2. Application loads at Vercel URL
3. Homepage renders correctly
4. Wallet connection modal opens
5. Dashboard shows appropriate message
6. No critical console errors
7. Pages navigate correctly

---

## 📞 Support

**Issues**:
- Vercel Build Issues: Check Vercel logs
- Blockchain Issues: Check RPC endpoint
- Wallet Issues: Verify WalletConnect ID

**Resources**:
- Project README: [README.md](README.md)
- Manual Testing Guide: [MANUAL_TESTING_GUIDE.md](MANUAL_TESTING_GUIDE.md)
- Test Results: [TEST_RESULTS_E2E.md](TEST_RESULTS_E2E.md)

---

**Created**: December 26, 2024
**Author**: Francisco Hipolito Garcia Martinez
**Status**: Ready for deployment
