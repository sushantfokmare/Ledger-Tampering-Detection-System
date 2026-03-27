# ⚡ Quick Start Guide

## 🎯 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```
Wait for completion (~30 seconds)

### Step 2: Run the Server
```bash
npm start
```

Expected output:
```
╔════════════════════════════════════════════════════════════════╗
║    Ledger Tampering Detection System - Node 3001              ║
╚════════════════════════════════════════════════════════════════╝

✅ Server running on http://localhost:3001
```

### Step 3: Open Browser
Navigate to: **http://localhost:3001**

You should see the dashboard!

## 🧪 Quick Test (Takes 1 Minute)

1. **Add a block**: Type "Alice sends 100 coins to Bob" → Click "Add Block"
2. **View chain**: Click "Load All Blocks"
3. **Validate**: Click "Validate Chain" → Should show ✅ VALID
4. **Tamper**: Set block index to "1", new data to "HACKED" → Click "Tamper with Block"
5. **Detect tampering**: Click "Validate Chain" → Shows ❌ TAMPERING DETECTED!

Done! ✅

## 🚀 Run Multiple Nodes

Open 3 terminals:

**Terminal 1:**
```bash
node startNode.js 3001
```

**Terminal 2:**
```bash
node startNode.js 3002
```

**Terminal 3:**
```bash
node startNode.js 3003
```

Then:
- Go to http://localhost:3001 and add a block
- Go to http://localhost:3002 → click "Sync Peers" 
- Block should appear! (if nodes are running)

## 📡 API Quick Test

```bash
# Add block
curl -X POST http://localhost:3001/addBlock \
  -H "Content-Type: application/json" \
  -d '{"data":"Test block"}'

# View chain
curl http://localhost:3001/chain

# Validate
curl http://localhost:3001/validate

# Tamper
curl -X POST http://localhost:3001/tamper \
  -H "Content-Type: application/json" \
  -d '{"blockIndex":1,"newData":"Tampered"}'
```

## ❓ Issues?

### Port 3001 already in use?
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### npm install fails?
```bash
npm cache clean --force
npm install
```

### Dependencies missing?
```bash
npm install express body-parser axios
```

## 📚 Full Documentation
See `README.md` for complete documentation.

---

**Ready to start? Run: `npm start` 🚀**
