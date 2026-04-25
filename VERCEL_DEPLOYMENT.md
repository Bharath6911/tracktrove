# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] Environment variables created (`.env.local`)
- [x] All secrets removed from code
- [x] Project builds successfully
- [x] Git repository initialized and committed

---

## 📋 Deployment Steps

### Step 1: Connect to GitHub (If not already done)

```bash
# Push to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/tracktove.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

You have two options:

#### **Option A: Using Vercel CLI (Fastest)**

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

#### **Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Set environment variables (see below)
5. Click "Deploy"

---

## 🔐 Environment Variables Setup in Vercel

After connecting your repository to Vercel, add these environment variables:

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add these variables:**

| Variable Name | Value |
|---|---|
| `EBAY_APP_ID` | From your `.env.local` |
| `EBAY_DEV_ID` | From your `.env.local` |
| `EBAY_CERT_ID` | From your `.env.local` |
| `EBAY_NOTIFICATION_TOKEN` | From your `.env.local` |

3. **Make sure they are set for:**
   - ✓ Production
   - ✓ Preview
   - ✓ Development

4. **Click "Save"** and redeploy

---

## 🎯 Your eBay Notification Endpoint

Once deployed to Vercel, your endpoint will be:

```
https://tracktove.vercel.app/api/ebay/notifications
```

---

## ⚙️ Configure eBay Notifications

### Steps to add notification endpoint to eBay Developer Portal:

1. **Go to:** https://developer.ebay.com/my/notifications

2. **Click "Event Subscriptions"** (or "Production Alerts & Notifications")

3. **Select "Marketplace Account Deletion"** (or the event you want)

4. **Set Notification Delivery Method:**
   - Radio button: **"Marketplace Account Deletion"** (select this)
   
5. **Fill in the fields:**

| Field | Value |
|---|---|
| **Endpoint URL** | `https://tracktove.vercel.app/api/ebay/notifications` |
| **Verification Token** | From your `.env.local` |

6. **Click "Save"**

7. **eBay will send a challenge request** to verify the endpoint
   - Your code automatically responds to this
   - If successful, you'll see a ✓ confirmation

---

## 🧪 Testing the Deployment

### 1. **Test API Connection**

```bash
curl https://tracktove.vercel.app/api/test/ebay-connection
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "eBay API connection is working",
  "timestamp": "2026-04-25T10:30:00.000Z"
}
```

### 2. **Test Search Endpoint**

```bash
curl "https://tracktove.vercel.app/api/ebay/search?q=watches&country=USA&sort=newlyListed"
```

**Expected Response:** Real eBay listings in JSON format

### 3. **Test in Browser**

1. Open https://tracktove.vercel.app
2. Click "Add Bookmark"
3. Enter: `vintage watches`
4. Select country: `USA`
5. Click "Add Bookmark"
6. Should show **REAL eBay listings** (not mock data)

### 4. **Test Notification Endpoint**

```bash
# Test challenge verification
curl https://tracktove.vercel.app/api/ebay/notifications?challenge=test123
```

**Expected Response:**
```json
{
  "challengeResponse": "test123"
}
```

---

## 📊 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create/verify Vercel project connection
- [ ] Add all environment variables to Vercel
- [ ] Trigger deployment (redeploy if needed)
- [ ] Test `/api/test/ebay-connection` endpoint
- [ ] Test search endpoint with sample query
- [ ] Add notification endpoint to eBay Developer Portal
- [ ] Verify eBay accepts the notification endpoint
- [ ] Test in browser app - add bookmark and see real listings

---

## 🔍 Monitoring & Debugging

### View Deployment Logs

```bash
vercel logs --follow
```

### View API Errors

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on any API route to see logs
3. Check `console.error` messages

### Debug Locally First

```bash
# Run locally with environment variables
pnpm dev

# Test locally before deploying
curl http://localhost:3000/api/test/ebay-connection
```

---

## ❌ Troubleshooting

### "Missing eBay credentials" Error

**Solution:** Make sure environment variables are set in Vercel Dashboard

```bash
# Check if variables exist
vercel env ls
```

### Notifications not working

**Solution:** 

1. Verify endpoint is public (no auth required)
- Check verification token matches: Check your `.env.local`
3. Test with: `curl https://tracktove.vercel.app/api/ebay/notifications?challenge=test123`

### Search returns no results

**Solution:**

1. Check eBay API is working: `curl https://tracktove.vercel.app/api/test/ebay-connection`
2. Try different search term
3. Check logs in Vercel Functions tab

---

## 📝 File Structure

```
.
├── .env.local                          # Local env (not in git ✓)
├── .env.example                        # Template for env vars
├── .gitignore                          # Ignores node_modules, .env, etc
├── lib/
│   ├── ebay-api-service.ts            # ✓ Uses env variables now
│   ├── ebay-service.ts
│   └── scrapers/ebay-scraper.ts
├── app/
│   ├── api/
│   │   ├── ebay/
│   │   │   ├── search/route.ts        # Search endpoint
│   │   │   └── notifications/route.ts # ✓ Uses env variables now
│   │   └── test/
│   │       └── ebay-connection/route.ts
│   └── page.tsx
├── package.json
└── README.md
```

---

## 🎉 Success!

Once deployed and working:

1. ✅ Visit https://tracktove.vercel.app
2. ✅ Add a bookmark (search keyword)
3. ✅ See **REAL eBay listings** with real prices and locations
4. ✅ Endpoint is ready for eBay notifications

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **eBay Developer Portal:** https://developer.ebay.com/my/notifications
- **eBay Keys:** https://developer.ebay.com/my/keys
- **Your App:** https://tracktove.vercel.app
- **Notification Endpoint:** https://tracktove.vercel.app/api/ebay/notifications

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test endpoints locally first with `pnpm dev`
4. Check eBay Developer Portal for any error messages

