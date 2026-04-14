# 🚀 Deployment Guide: Data Reset Bug Fix

## Quick Summary

✅ **What was fixed:** Users were losing credits every time the bot restarted on Railway  
✅ **Root cause:** Bot was loading old `users.json` and overwriting Supabase data  
✅ **Solution:** Bot now loads from Supabase first, uses JSON only as fallback  
✅ **Status:** Code is ready to deploy  

---

## 📋 Pre-Deployment Checklist

Before deploying to Railway, verify:

- [ ] Supabase project is set up
- [ ] `users` table exists in Supabase (run create_tables.sql if needed)
- [ ] Railway environment variables are set:
  - `SUPABASE_URL` 
  - `SUPABASE_ANON_KEY`
  - `TELEGRAM_TOKEN`
  - `FIVESIM_API`

---

## 🚢 Deployment Steps

### Option 1: Push to GitHub (Recommended for Railway)

```bash
cd /home/ubuntu/bot-sms-project

# Verify changes are committed
git log --oneline -1

# Output should show:
# 7d8f00d 🔥 CRITICAL FIX: Supabase as primary data source...

# Push to GitHub
git push origin main
```

Railway will automatically pull and restart the bot with the fix.

### Option 2: Manual Update on Railway

1. Login to Railway dashboard
2. Go to your bot service
3. Open the code editor or terminal
4. Replace `bot.js` with the fixed version
5. Restart the service

---

## ✅ Post-Deployment Verification

### Step 1: Check Bot Initialization Logs

```bash
# In Railway logs, you should see:
🚀 Inicializando bot...
🔄 Cargando usuarios desde Supabase...
✅ Cargados X usuarios desde Supabase
🔍 Revisando órdenes pendientes...
✅ Bot inicializado correctamente
```

**If you see these logs, the fix is working! ✅**

### Step 2: Test Data Persistence

1. **Add credits to a user**
   ```
   Send to bot: /addcredits 8349475987 50
   ```

2. **Verify in admin panel**
   - Open admin panel
   - Go to Users
   - Check user shows 50 credits

3. **Restart the bot**
   - Stop bot on Railway
   - Wait 30 seconds
   - Restart bot

4. **Verify credits are still there**
   - Check admin panel again
   - Credits should still show 50 (not reset to 0) ✅

### Step 3: Verify Supabase Connection

1. Open Supabase dashboard
2. Go to users table
3. Should see user records with current credits
4. Compare with admin panel - should match ✅

---

## 🔍 Troubleshooting

### Problem: Bot shows "Error: Supabase not configured"

**Cause:** Environment variables not set on Railway

**Solution:**
1. Go to Railway dashboard
2. Click your bot service
3. Go to Variables
4. Add:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```
5. Restart bot

### Problem: Bot loads from JSON instead of Supabase

**Look for this log:**
```
❌ Error cargando usuarios de Supabase: ...
📄 Usando fallback JSON
```

**Cause:** Supabase connection failed

**Solution:**
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
2. Check Supabase project is online
3. Check if users table exists
4. Restart bot

### Problem: Users table doesn't exist

**Cause:** create_tables.sql hasn't been run

**Solution:**
1. Go to Supabase dashboard
2. Click SQL Editor
3. Create new query
4. Paste contents of `create_tables.sql`
5. Run it
6. Restart bot

### Problem: Credits still reset after restart

**Possible causes:**
1. Supabase table is empty (no data)
2. Wrong Supabase keys
3. Network issue connecting to Supabase

**Debug steps:**
1. Check Supabase users table directly in dashboard
2. Run: `SELECT * FROM users;` to see if data exists
3. If empty, bot is working correctly (loading empty data)
4. Check Railway logs for sync errors

---

## 📊 What Changed in bot.js

### Summary of Changes:
- **NEW:** `loadUsersFromSupabase()` - loads data from Supabase (PRIMARY)
- **RENAMED:** `loadUsers()` → `loadUsersFromJSON()` - fallback only
- **NEW:** `initializeBot()` async function - coordinates startup
- **MODIFIED:** `cancelPendingOrders()` - no longer syncs old data
- **UNCHANGED:** All user operations (getting, updating, syncing) still work the same

### Key Improvement:
```
BEFORE: loadUsers() from JSON → sync to Supabase ❌ (overwrites with old data)
AFTER:  loadUsersFromSupabase() first → fallback to JSON ✅ (preserves current data)
```

---

## 🔐 Data Safety

After this deployment:

✅ **Supabase is the source of truth**
- On startup, bot loads from Supabase, not JSON
- Current user data is preserved on restart

✅ **JSON is backup only**
- Used only if Supabase is unavailable
- Never overwrites Supabase data

✅ **All changes sync immediately**
- Credits, orders, logs all go to Supabase
- Fallback to JSON for persistence if needed

---

## 📞 Support

If you encounter issues:

1. Check the logs in Railway dashboard
2. Look for the initialization messages
3. Verify Supabase credentials
4. Check if users table exists
5. Try restarting the bot
6. Check `FIX_DATA_RESET_BUG.md` for detailed troubleshooting

---

## 🎉 Success Indicators

After successful deployment, you should see:

- ✅ Bot starts with "Inicializando bot..." log
- ✅ "Cargados X usuarios desde Supabase" in logs
- ✅ Users don't lose credits on restart
- ✅ New credits are visible in admin panel
- ✅ Logs appear in the logs section

---

## ⏮️ Rollback Plan

If needed, you can rollback to the previous version:

```bash
cd /home/ubuntu/bot-sms-project
git revert 7d8f00d
git push origin main
```

But this isn't recommended - the fix is important for data integrity!

---

*Last updated: 2025-04-13*
