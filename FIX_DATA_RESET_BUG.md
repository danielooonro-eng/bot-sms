# 🔥 CRITICAL BUG FIX: Data Reset on Restart

## 📋 Problem Summary

**Users were losing all credits and logs every time the bot restarted on Railway!**

### Root Cause
The bot was loading users from an outdated `users.json` file at startup and then syncing this old data to Supabase, overwriting the current state:

```
1. Railway restarts
2. Bot loads old users.json from git repo (has old/stale data)
3. Bot syncs this old data to Supabase via cancelPendingOrders()
4. Supabase gets overwritten with old data ❌
5. Users lose credits and logs are lost
```

### Why This Happened
- The bot had `const users = loadUsers()` at startup
- `loadUsers()` read from `users.json` (a local JSON file)
- When Railway restarts, the container gets a fresh copy of the repo with the original `users.json`
- The bot then synced this stale data to Supabase, losing all current user data

---

## ✅ Solution Implemented

Changed the startup process to **read from Supabase first**, with JSON as a fallback only:

### New Initialization Flow
```
1. Bot starts
2. initializeBot() async function executes
3. Load from Supabase: SELECT * FROM users ✅
4. If Supabase fails or is empty, fallback to users.json
5. Cancel pending 5sim orders (don't sync data)
6. Users map is now loaded with CURRENT data from Supabase
7. All future changes sync to Supabase immediately
```

---

## 🔧 Code Changes

### Before (BROKEN)
```javascript
// ❌ BAD: Loads stale JSON data at startup
const users = loadUsers();

async function cancelPendingOrders() {
  for (const [id, user] of users.entries()) {
    // ... this syncs old JSON data to Supabase!
    syncUserToSupabase(id, user).catch(...);
  }
}

cancelPendingOrders(); // Called immediately, overwrites Supabase
```

### After (FIXED)
```javascript
// ✅ GOOD: Loads fresh data from Supabase
let users = new Map(); // Initialized asynchronously

async function initializeBot() {
  // Load from Supabase FIRST (source of truth)
  users = await loadUsersFromSupabase();
  
  // Only clean up 5sim orders, don't sync data
  await cancelPendingOrders();
}

initializeBot().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

### New Functions

#### `loadUsersFromSupabase()` (NEW - PRIMARY)
- Loads users from Supabase table
- If Supabase unavailable, falls back to JSON
- Source of truth on startup
- Prevents loading stale data

#### `loadUsersFromJSON()` (RENAMED - FALLBACK ONLY)
- Only called if Supabase is unavailable
- Never used as primary source
- Used only for disaster recovery

#### `cancelPendingOrders()` (MODIFIED)
- Now only cleans up pending 5sim orders
- Does NOT sync data from JSON to Supabase
- Restores credits if order cancellation succeeds
- Syncs individual changes to Supabase

---

## 📊 Data Flow Comparison

### Before (Broken)
```
startup
  ↓
loadUsers() from users.json ❌ (old data)
  ↓
cancelPendingOrders() syncs to Supabase 💥 (overwrites with old data)
  ↓
Users lose credits!
```

### After (Fixed)
```
startup
  ↓
loadUsersFromSupabase() ✅ (current data)
  ↓
If Supabase fails → fallback to JSON (only as fallback)
  ↓
cancelPendingOrders() (only cleans 5sim orders)
  ↓
All operations sync to Supabase ✅ (Supabase is source of truth)
```

---

## 🛡️ Data Protection Measures

1. **Supabase is Source of Truth**
   - On startup, data comes from Supabase, not JSON
   - All changes are immediately synced to Supabase
   - JSON is only a local cache and fallback

2. **Graceful Fallback**
   - If Supabase fails, bot can still operate with users.json
   - If Supabase is unavailable, JSON provides continuity
   - No data loss scenario

3. **No Accidental Overwrites**
   - `cancelPendingOrders()` no longer syncs all users
   - Only individual changes sync to Supabase
   - Old JSON data never overwrites Supabase

---

## 🧪 Testing the Fix

### Test 1: Verify Data Persistence
1. Add credits to a user with `/addcredits`
2. Check user credits in admin panel
3. Restart the bot
4. Verify credits are still there (not reset to 0) ✅

### Test 2: Verify Supabase is Primary Source
1. Check Supabase users table directly
2. Delete or clear users.json
3. Restart the bot
4. Verify bot loads users from Supabase (log should show)
5. Users should still be accessible ✅

### Test 3: JSON Fallback Works
1. Disconnect Supabase or set wrong credentials
2. Restart the bot
3. Bot should fallback to JSON and continue working ✅
4. Log should show "using fallback JSON"

### Test 4: New Users are Synced
1. New user interacts with bot (/start)
2. Check Supabase users table
3. New user should appear within seconds ✅

### Test 5: Credits Changes Sync
1. User buys a number (credits decrease)
2. Check Supabase immediately
3. Credits should be updated in Supabase ✅

---

## 📝 Logs to Look For

After deploying this fix, you should see:

**On startup:**
```
🚀 Inicializando bot...
🔄 Cargando usuarios desde Supabase...
✅ Cargados X usuarios desde Supabase
🔍 Revisando órdenes pendientes...
✅ Revisión de órdenes completada: 0 canceladas
✅ Bot inicializado correctamente
📊 X usuarios en memoria
```

**If Supabase fails:**
```
❌ Error cargando usuarios de Supabase: <error>
📄 Usando fallback JSON
📄 Usuarios cargados desde JSON (FALLBACK)
```

**When syncing changes:**
```
✅ Usuario 8349475987 sincronizado a Supabase
```

---

## ⚠️ Important Notes

1. **This fix requires Supabase environment variables** on Railway
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. **The Supabase users table must exist** with proper schema (see create_tables.sql)

3. **JSON fallback is for emergencies only** - it's NOT recommended to use JSON as primary storage in production

4. **No data migration needed** - Existing Supabase data is preserved

---

## 🚀 Deployment Checklist

- [ ] Pull latest code with this fix
- [ ] Verify Supabase environment variables are set on Railway
- [ ] Verify users table exists in Supabase with correct schema
- [ ] Restart the bot on Railway
- [ ] Check logs for successful initialization from Supabase
- [ ] Test by adding credits to a user and restarting
- [ ] Verify credits are NOT reset ✅

---

## 📞 Troubleshooting

**Problem: Bot won't start / throws error on initialization**
- Check Supabase environment variables are correct
- Check Supabase users table exists
- Check internet connection to Supabase

**Problem: Bot loads from JSON instead of Supabase**
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check Supabase connection
- Look at startup logs for specific error

**Problem: Users data missing after restart**
- Check if Supabase has the data (query directly in Supabase dashboard)
- If Supabase has data but bot doesn't show it, check loadUsersFromSupabase() logs
- If Supabase is empty, check when data was last synced

---

## ✨ Result

✅ **Users no longer lose credits on restart**
✅ **Supabase is the source of truth**
✅ **JSON is fallback only**
✅ **Data is safe and persistent**

---

*Commit: 7d8f00d - Critical fix for data reset on restart*
