# eBay Developer Portal Setup

## Your Endpoint Details

### 🎯 Notification Endpoint URL

```
https://tracktove.vercel.app/api/ebay/notifications
```

**This is what you'll enter in eBay Developer Portal under:**
- Settings → Alerts & Notifications → Event Notification Delivery Method

---

## 📋 eBay Portal Configuration

### Location: Developer.eBay.com → My Account → Alerts & Notifications

**Follow these steps:**

### 1. Select Event Type
- Choose: **"Marketplace Account Deletion"**

### 2. Select Notification Method
- Choose: **"Marketplace Account Deletion"** (radio button)

### 3. Fill in the Endpoint Details

#### **Marketplace account deletion notification endpoint:**
```
https://tracktove.vercel.app/api/ebay/notifications
```

#### **Verification token:**
Check your `.env.local` file for the `EBAY_NOTIFICATION_TOKEN` value

#### **Email to notify if endpoint is down:**
```
drawing@gmail.com
```

### 4. Click "Save"

---

## ✅ What Happens After Saving

1. **eBay sends a challenge request** to your endpoint
2. **Your code automatically responds** with the correct verification
3. **You'll see a ✓ checkmark** in the eBay portal confirming it's working
4. **Your endpoint is now active** and will receive notifications

---

## 🧪 Quick Test (Before Adding to eBay)

### Test locally:
```bash
pnpm dev
curl "http://localhost:3000/api/ebay/notifications?challenge=test123"
```

### Test after deployment:
```bash
curl "https://tracktove.vercel.app/api/ebay/notifications?challenge=test123"
```

**Expected response:**
```json
{
  "challengeResponse": "test123"
}
```

---

## 📊 Your Credentials (Already Configured)

These are already set in Vercel environment variables:

| Name | Value |
|---|---|
| **EBAY_APP_ID** | From `.env.local` |
| **EBAY_CERT_ID** | From `.env.local` |
| **EBAY_NOTIFICATION_TOKEN** | From `.env.local` |

✅ **All secrets are now in `.env` files, NOT in code**

---

## 🔄 What the Endpoint Does

When eBay sends a notification to your endpoint:

1. **Challenge Request** → Your code echoes back the challenge (automatic verification)
2. **Marketplace Account Deletion** → Logged to console, ready to handle user deletion
3. **Other Events** → Returned with `{status: "event_received"}`

---

## ✨ Supported Notification Events

Currently configured for:
- ✅ Marketplace Account Deletion
- ✅ Challenge Verification
- ✅ Generic Events

---

## 📝 Screenshots Guide

### Step 1: Go to eBay Notifications
Navigate to: https://developer.ebay.com/my/notifications

### Step 2: Event Subscriptions
Click on "Event Subscriptions" or look for "Marketplace Account Deletion"

### Step 3: Delivery Method
Select: **"Marketplace Account Deletion"** (radio button at top)

### Step 4: Fill Endpoint
Paste your endpoint: `https://tracktove.vercel.app/api/ebay/notifications`

### Step 5: Fill Verification Token
Paste token from your `.env.local` file

### Step 6: Save
Click "Save" button

### Step 7: Wait for Confirmation
Look for a ✓ checkmark confirming your endpoint is verified

---

## 🚀 Deployment Checklist

- [ ] Code deployed to Vercel at https://tracktove.vercel.app
- [ ] Environment variables set in Vercel dashboard
- [ ] `/api/test/ebay-connection` returns `{status: "ok"}`
- [ ] `/api/ebay/notifications?challenge=test123` echoes back the challenge
- [ ] Endpoint URL added to eBay Developer Portal
- [ ] Verification token matches the value in your `.env.local`
- [ ] eBay shows ✓ confirmation for notification endpoint

---

## 🔗 Important Links

| Link | Purpose |
|---|---|
| https://tracktove.vercel.app | Your live app |
| https://tracktove.vercel.app/api/ebay/notifications | Notification endpoint |
| https://tracktove.vercel.app/api/test/ebay-connection | Connection test |
| https://developer.ebay.com/my/notifications | eBay Notifications Setup |
| https://developer.ebay.com/my/keys | Your eBay API Keys |

---

## ⚠️ Common Issues

### Issue: "Endpoint verification failed"

**Solution:**
- Make sure Vercel deployment is complete
- Verify endpoint is publicly accessible (no auth)
- Check URL matches exactly: `https://tracktove.vercel.app/api/ebay/notifications`
- Test with curl first

### Issue: "Verification token mismatch"

**Solution:**
- Token must be exactly the value from your `.env.local` file
- Make sure it's set in `.env` and Vercel
- No extra spaces or characters

### Issue: "Endpoint is down"

**Solution:**
- Check Vercel deployment status
- Make sure environment variables are set
- Test with curl to verify endpoint is responding

---

## 🎯 Testing After Setup

### 1. Verify in eBay Portal
- Look for ✓ checkmark next to endpoint
- Check "Last Response" timestamp (should be recent)

### 2. Test Locally
```bash
# Start dev server
pnpm dev

# Test in another terminal
curl "http://localhost:3000/api/test/ebay-connection"
```

### 3. Test in Production
```bash
curl "https://tracktove.vercel.app/api/test/ebay-connection"
```

---

## 📞 Need Help?

1. Check logs in Vercel Functions tab
2. Verify all environment variables are set
3. Test endpoints with curl before adding to eBay
4. Make sure endpoint is publicly accessible (no firewall blocking)

