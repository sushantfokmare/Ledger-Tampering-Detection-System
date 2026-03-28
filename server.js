const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Node = require('./node');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Initialize node with peers
 * By default, connects to other nodes if they exist
 */
let node;

function initializeNode() {
  // Determine peers based on current port
  let peers = [];
  
  if (PORT !== 3001) peers.push('http://localhost:3001');
  if (PORT !== 3002) peers.push('http://localhost:3002');
  if (PORT !== 3003) peers.push('http://localhost:3003');
  
  node = new Node(`Node-${PORT}`, PORT, peers);
}

// ========== API ENDPOINTS ==========

/**
 * GET / - Serve frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * POST /addBlock - Add a new block to the blockchain
 * Expected body: { data: "string" }
 */
app.post('/addBlock', (req, res) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== 'string' || data.trim() === '') {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    const block = node.addBlock(data);

    res.json({
      success: true,
      message: 'Block added successfully',
      block: {
        index: block.index,
        timestamp: block.timestamp,
        data: block.data,
        previousHash: block.previousHash.substring(0, 16) + '...',
        hash: block.hash
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /chain - Get the entire blockchain
 */
app.get('/chain', (req, res) => {
  try {
    const chain = node.getBlockchain();
    const formattedChain = chain.map((block, index) => ({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash.substring(0, 16) + '...',
      hash: block.hash,
      isValid: block.isValid() ? '✅' : '❌'
    }));

    res.json({
      success: true,
      chainLength: formattedChain.length,
      chain: formattedChain,
      nodeInfo: node.getNodeInfo()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /validate - Validate the entire blockchain
 */
app.get('/validate', (req, res) => {
  try {
    const isValid = node.validateBlockchain();

    res.json({
      success: true,
      isValid: isValid,
      chainLength: node.blockchain.getChainLength(),
      message: isValid
        ? 'Blockchain is valid and intact'
        : 'Blockchain has been tampered with! Tampering detected.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /tamper - Intentionally tamper with a block (for demonstration)
 * Expected body: { blockIndex: number, newData: "string" }
 */
app.post('/tamper', (req, res) => {
  try {
    const { blockIndex, newData } = req.body;

    if (typeof blockIndex !== 'number' || !newData || typeof newData !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blockIndex or newData provided'
      });
    }

    if (blockIndex < 0 || blockIndex >= node.blockchain.getChainLength()) {
      return res.status(400).json({
        success: false,
        message: `Block index out of range (0-${node.blockchain.getChainLength() - 1})`
      });
    }

    node.tamperWithBlock(blockIndex, newData);

    res.json({
      success: true,
      message: `Block #${blockIndex} tampered. Run validation to detect tampering.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /status - Get node status
 */
app.get('/status', (req, res) => {
  try {
    const status = node.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /sync - Sync with peer nodes (consensus mechanism)
 */
app.post('/sync', async (req, res) => {
  try {
    await node.syncWithPeers();
    res.json({
      success: true,
      message: 'Sync completed',
      status: node.getStatus()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /receiveBlock - Internal endpoint for receiving blocks from peers
 */
app.post('/receiveBlock', (req, res) => {
  try {
    const { block } = req.body;
    node.receiveBlock(block);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /stream - Get detailed stream view with immutable data and tampering audit trail
 * Shows DLT-compliant view with before/after tampering
 */
app.get('/stream', (req, res) => {
  try {
    const chain = node.getBlockchain();
    const streamData = chain.map((block, index) => {
      const blockData = {
        index: block.index,
        timestamp: block.timestamp,
        originalData: block.originalData, // ← IMMUTABLE (as per DLT principles)
        currentData: block.data,
        previousHash: block.previousHash.substring(0, 16) + '...',
        hash: block.hash,
        isValid: block.isValid() ? '✅' : '❌',
        isTampered: block.isTampered || false,
        tamperedAttempts: block.tamperedAttempts || []
      };
      
      // Show tampering detection details
      if (block.tamperedAttempts && block.tamperedAttempts.length > 0) {
        blockData.tamperedAttempts = block.tamperedAttempts.map(attempt => ({
          timestamp: attempt.timestamp,
          attemptedData: attempt.attemptedData,
          storedHash: attempt.storedHash.substring(0, 16) + '...',
          calculatedHash: attempt.calculatedHash.substring(0, 16) + '...',
          detected: attempt.detected
        }));
      }
      
      return blockData;
    });

    res.json({
      success: true,
      chainLength: streamData.length,
      stream: streamData,
      dltCompliant: {
        immutabilityPreserved: true,
        auditTrailMaintained: true,
        originalDataProtected: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /demo - Get demo data to populate example
 */
app.get('/demo', (req, res) => {
  res.json({
    demoBlocks: [
      'Alice transfers 50 coins to Bob',
      'Bob transfers 25 coins to Charlie',
      'Charlie transfers 10 coins to Alice'
    ]
  });
});

// ========== ERROR HANDLING ==========

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// ========== START SERVER ==========

const server = app.listen(PORT, () => {
  try {
    initializeNode();
  } catch (err) {
    console.error('❌ Failed to initialize node:', err);
    process.exit(1);
  }
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║    Ledger Tampering Detection System - Node ${PORT}             ║
╚════════════════════════════════════════════════════════════════╝

✅ Server running on http://localhost:${PORT}
🌐 Open browser and navigate to http://localhost:${PORT}

📡 Node Configuration:
   - Node ID: Node-${PORT}
   - Port: ${PORT}
   - Peers: ${node.peers.length > 0 ? node.peers.join(', ') : 'None (standalone)'}

📚 API Endpoints:
   - GET  /              → Frontend Dashboard
   - POST /addBlock      → Add new block (requires: { "data": "string" })
   - GET  /chain        → Get full blockchain
   - GET  /validate     → Validate blockchain integrity
   - POST /tamper       → Tamper with block (requires: { "blockIndex": 0, "newData": "string" })
   - GET  /status       → Get node status
   - POST /sync         → Sync with peer nodes

💡 To demonstrate tampering detection:
   1. Add some blocks
   2. Click "Tamper with Block #1" (after viewing chain)
   3. Validate chain - tampering will be detected!

🚀 To run multiple nodes:
   - Node 1: node startNode.js 3001
   - Node 2: node startNode.js 3002
   - Node 3: node startNode.js 3003

═══════════════════════════════════════════════════════════════════
  `);
});

// Error handling for port conflicts
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`Solutions:`);
    console.error(`  1. Kill existing process: Get-Process node | Stop-Process -Force`);
    console.error(`  2. Use different port: PORT=3002 node server.js`);
    console.error(`  3. Wait a few seconds and try again\n`);
    process.exit(1);
  } else {
    console.error(`Server error: ${err.message}`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
