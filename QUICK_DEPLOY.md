# 🚀 Quick Deployment Commands

## Copy & Paste These Commands

### 1️⃣ Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/tracktove.git
git branch -M main
git push -u origin main
```

**Or if you already have a remote:**

```bash
git push
```

---

### 2️⃣ Deploy with Vercel CLI

```bash
# Install Vercel CLI (one time only)
npm i -g vercel

# Deploy to production
vercel --prod
```

---

### 3️⃣ OR Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repo
4. In Environment Variables, add from your `.env.local`:
   - `EBAY_APP_ID` 
   - `EBAY_DEV_ID`
   - `EBAY_CERT_ID`
   - `EBAY_NOTIFICATION_TOKEN`
5. Click "Deploy"

---

### 4️⃣ Test After Deployment

```bash
# Test connection
curl https://tracktove.vercel.app/api/test/ebay-connection

# Test search
curl "https://tracktove.vercel.app/api/ebay/search?q=watches&country=USA"

# Test notification endpoint
curl "https://tracktove.vercel.app/api/ebay/notifications?challenge=test123"
```

---

### 5️⃣ Add to eBay Developer Portal

**Go to:** https://developer.ebay.com/my/notifications

**Fill in:**
- **Endpoint:** `https://tracktove.vercel.app/api/ebay/notifications`
- **Verification Token:** From your `.env.local` file

**Click Save** → Wait for ✓ confirmation

---

## 📊 Your Endpoint

```
https://tracktove.vercel.app/api/ebay/notifications
```

---

## ✅ Verification Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel (https://tracktove.vercel.app)
- [ ] Environment variables set in Vercel
- [ ] Connection test passes: `curl https://tracktove.vercel.app/api/test/ebay-connection`
- [ ] Endpoint responds: `curl "https://tracktove.vercel.app/api/ebay/notifications?challenge=test"`
- [ ] Added to eBay Developer Portal
- [ ] eBay shows ✓ verification confirmation
- [ ] App works at https://tracktove.vercel.app

---

## 🎯 Next Steps

1. **Run the deployment commands above**
2. **Wait 2-3 minutes for Vercel to deploy**
3. **Test the endpoints with curl**
4. **Add endpoint to eBay Developer Portal**
5. **Verify with ✓ checkmark**
6. **Test in app at https://tracktove.vercel.app**

Done! 🎉
