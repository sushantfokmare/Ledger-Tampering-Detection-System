# 🔐 Ledger Tampering Detection System

A complete distributed ledger system with blockchain-like architecture demonstrated using Node.js, Express, and SHA-256 hashing. This system can detect tampering attacks on blockchain data and includes a web-based frontend for interactive testing.

## 📋 Features

- ✅ **Blockchain Implementation**: Proper block structure with index, timestamp, data, previousHash, and hash
- ✅ **SHA-256 Hashing**: Cryptographic hash for data integrity
- ✅ **Tampering Detection**: Automatically detects when block data is modified
- ✅ **Chain Validation**: Complete blockchain validation checking hash integrity and chain linkage
- ✅ **Distributed Nodes**: Run multiple nodes on different ports with peer synchronization
- ✅ **REST API**: Full API endpoints for all blockchain operations
- ✅ **Web Dashboard**: Interactive frontend to add blocks, view chain, validate, and simulate tampering
- ✅ **Consensus Mechanism**: Longest valid chain wins (basic consensus)
- ✅ **Peer Sync**: Automatic synchronization between nodes

## 🏗️ Project Structure

```
ledger-tampering-detection/
├── blockchain.js          # Core blockchain logic (Block & Blockchain classes)
├── node.js               # Node class with peer sync capability
├── server.js             # Express API server
├── startNode.js          # Script to start nodes on different ports
├── package.json          # npm dependencies
├── README.md             # This file
└── public/               # Frontend files
    ├── index.html        # Main dashboard
    └── script.js         # Frontend JavaScript
```

## 📦 Installation

### Prerequisites
- Node.js (v12.0.0 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Clone/Navigate to project directory**:
   ```bash
   cd "8th SEM\DLT mini project"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install:
   - `express` - Web framework
   - `body-parser` - JSON parsing
   - `axios` - HTTP client for peer communication

## 🚀 Running the System

### Quick Start (Single Node)

Run a single node on port 3001:

```bash
npm start
```

Then open your browser and navigate to: **http://localhost:3001**

### Multi-Node Setup (Distributed)

For a true distributed system, open 3 separate terminals and run:

**Terminal 1:**
```bash
npm run node1
```
Node 1 will run on http://localhost:3001

**Terminal 2:**
```bash
npm run node2
```
Node 2 will run on http://localhost:3002

**Terminal 3:**
```bash
npm run node3
```
Node 3 will run on http://localhost:3003

Or use the generic command:
```bash
node startNode.js 3001
node startNode.js 3002
node startNode.js 3003
```

## 💻 API Endpoints

All endpoints support CORS for frontend communication.

### 1. **GET /** 
- **Description**: Serve the web dashboard
- **Response**: HTML page

### 2. **POST /addBlock**
- **Description**: Add a new block to the blockchain
- **Request Body**:
  ```json
  {
    "data": "Alice transfers 50 coins to Bob"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Block added successfully",
    "block": {
      "index": 1,
      "timestamp": "2024-03-27T10:30:00.000Z",
      "data": "Alice transfers 50 coins to Bob",
      "previousHash": "a1b2c3d4...",
      "hash": "e5f6g7h8..."
    }
  }
  ```

### 3. **GET /chain**
- **Description**: Get the entire blockchain
- **Response**:
  ```json
  {
    "success": true,
    "chainLength": 4,
    "chain": [
      {
        "index": 0,
        "timestamp": "2024-03-27T10:00:00.000Z",
        "data": "Genesis Block",
        "previousHash": "0",
        "hash": "abc123...",
        "isValid": "✅"
      },
      ...
    ],
    "nodeInfo": {
      "nodeId": "Node-3001",
      "port": 3001,
      "chainLength": 4,
      "peers": []
    }
  }
  ```

### 4. **GET /validate**
- **Description**: Validate the entire blockchain integrity
- **Response (Valid)**:
  ```json
  {
    "success": true,
    "isValid": true,
    "chainLength": 4,
    "message": "Blockchain is valid and intact"
  }
  ```
- **Response (Tampered)**:
  ```json
  {
    "success": true,
    "isValid": false,
    "chainLength": 4,
    "message": "Blockchain has been tampered with! Tampering detected."
  }
  ```

### 5. **POST /tamper**
- **Description**: Intentionally tamper with a block (for demonstration)
- **Request Body**:
  ```json
  {
    "blockIndex": 1,
    "newData": "Tampered transaction"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Block #1 tampered. Run validation to detect tampering."
  }
  ```

### 6. **GET /status**
- **Description**: Get current node status
- **Response**:
  ```json
  {
    "success": true,
    "status": {
      "nodeId": "Node-3001",
      "port": 3001,
      "chainLength": 4,
      "latestBlockHash": "abc123...",
      "chainValid": true,
      "peersCount": 2,
      "peers": ["http://localhost:3002", "http://localhost:3003"]
    }
  }
  ```

### 7. **POST /sync**
- **Description**: Sync with peer nodes (consensus mechanism)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Sync completed",
    "status": { ... }
  }
  ```

### 8. **POST /receiveBlock** (Internal)
- **Description**: Internal endpoint for peer-to-peer block broadcasting
- **Used by**: Nodes to communicate with each other

## 🎯 How to Test Tampering Detection

### Manual Testing via Dashboard

1. **Start the server**: `npm start`
2. **Open browser**: http://localhost:3001
3. **Add some blocks**:
   - Click "Add: Alice → Bob"
   - Click "Add: Bob → Charlie"
   - Click "Add: Charlie → Alice"
4. **View the chain**: Click "Load All Blocks" to see all blocks
5. **Validate chain**: Click "Validate Chain" - should show ✅ VALID
6. **Tamper with a block**:
   - Set Block Index to "1"
   - Set New Data to "FORGED DATA"
   - Click "🔨 Tamper with Block"
7. **Validate again**: Click "Validate Chain" - should show ❌ TAMPERING DETECTED
8. **Check console**: The terminal will show detailed tampering detection logs

### Testing via cURL

Add a block:
```bash
curl -X POST http://localhost:3001/addBlock \
  -H "Content-Type: application/json" \
  -d '{"data":"Test transaction"}'
```

Validate chain:
```bash
curl http://localhost:3001/validate
```

Tamper (after adding blocks):
```bash
curl -X POST http://localhost:3001/tamper \
  -H "Content-Type: application/json" \
  -d '{"blockIndex":1,"newData":"Hacked"}'
```

Validate to detect:
```bash
curl http://localhost:3001/validate
```

## 🔍 Understanding the Tampering Detection

### How It Works

1. **Block Hash Calculation**: Each block's hash is calculated from its data + previous hash using SHA-256
2. **Immutability**: Once a block is created, its hash is stored and cannot be modified without recalculation
3. **Tampering Detection**: When validating:
   - The system recalculates what the hash SHOULD be based on current data
   - If actual hash ≠ calculated hash → **TAMPERING DETECTED**
   - If a block's previousHash doesn't match the previous block's hash → **CHAIN BROKEN**

### Example Output

When tampering is detected in the console:
```
[Node-3001] ❌ TAMPERING DETECTED at block #1:
    Stored hash:     a1b2c3d4...
    Calculated hash: x9y8z7w6...
    Block data has been tampered with!
```

## 📊 Distributed Node Example

When running 3 nodes:

1. **Node 1 (3001)** adds blocks
2. **Node 2 (3002)** syncs and receives blocks
3. **Node 3 (3003)** can validate all nodes' integrity

The consensus mechanism ensures:
- Each node maintains its own copy
- Longer valid chains are accepted
- Tampering on one node is detected and won't propagate
- Nodes can reach consensus on the valid chain

## 🔐 Security Features

- ✅ **SHA-256 Hashing**: Cryptographically secure
- ✅ **Chain Linkage**: Each block references the previous block's hash
- ✅ **Immutable History**: Changing past transactions requires recalculating all subsequent hashes
- ✅ **Tampering Logging**: All tampering attempts are logged with details
- ✅ **Distributed Validation**: Each node independently validates the chain

## 📝 Code Structure Explanation

### `blockchain.js`
- **Block Class**: Represents a single block with SHA-256 hashing
- **Blockchain Class**: Manages the chain of blocks with validation logic

### `node.js`
- **Node Class**: Represents a distributed node with peer sync capability
- **Peer Communication**: Broadcasting blocks and syncing chains

### `server.js`
- **Express Setup**: REST API endpoints
- **Request Handlers**: Process blockchain operations
- **Node Initialization**: Sets up peer connections

### `public/index.html`
- **Dashboard UI**: Beautiful interface for interactions
- **Forms**: Add blocks, tamper, validate
- **Display**: Shows blockchain and validation status

### `public/script.js`
- **API Integration**: Calls backend endpoints
- **UI Updates**: Real-time dashboard updates
- **Error Handling**: User-friendly error messages

## 🎮 Interactive Demo Scenario

Perfect demo script:

1. Start server: `npm start`
2. Go to http://localhost:3001
3. Execute: "Add: Alice → Bob"
4. Execute: "Add: Bob → Charlie"
5. Execute: "Load All Blocks"
6. Show validation: "Validate Chain" → ✅ Valid
7. Tamper block #2 with "HACKED DATA"
8. Revalidate: "Validate Chain" → ❌ Tampering Detected!
9. Show console logs showing exactly what went wrong

## 📋 System Requirements

- RAM: Minimum 512MB (256MB per node)
- CPU: Any modern processor
- Disk: ~50MB for project

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

### Dependencies Not Installing
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Frontend Not Loading
- Make sure server is running: `npm start`
- Check browser console for errors (F12)
- Verify URL: http://localhost:3001

### Peers Not Connecting
- Ensure all nodes are running on different ports
- Check firewalls aren't blocking localhost communication
- Verify peer URLs in logs

## 📚 References

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Crypto Module](https://nodejs.org/api/crypto.html)
- [Blockchain Basics](https://en.wikipedia.org/wiki/Blockchain)
- [SHA-256 Algorithm](https://en.wikipedia.org/wiki/SHA-2)

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author & Contributors

Built as a demonstration of distributed ledger systems and tampering detection.

### Contributors
- 👤 **Gauri Patil**
- 👤 **Aditya Siras**
- 👤 **Sushant Fokmare**

---

**Happy Testing! 🚀 Detect tampering with confidence!**

For issues or questions, check the console logs for detailed error messages.
