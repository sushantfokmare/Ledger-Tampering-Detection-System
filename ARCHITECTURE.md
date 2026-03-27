# 🏗️ SYSTEM ARCHITECTURE & TECHNICAL DOCUMENTATION

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Cryptography & Hashing](#cryptography--hashing)
6. [Consensus Mechanism](#consensus-mechanism)
7. [API Flow Diagrams](#api-flow-diagrams)
8. [Security Model](#security-model)

---

## System Overview

The Ledger Tampering Detection System is a distributed blockchain-based application that:
- Maintains a chain of cryptographically linked blocks
- Detects any unauthorized modification of historical data
- Achieves consensus across multiple nodes
- Provides a REST API for blockchain operations

**Key Technologies:**
- Node.js: Runtime environment
- Express.js: HTTP server framework
- Crypto (native): SHA-256 hashing
- Axios: HTTP client for peer communication

---

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│            ┌──────────────────────────────────┐             │
│            │     Frontend Dashboard           │             │
│            │  (HTML + CSS + JavaScript)       │             │
│            └──────────────────────────────────┘             │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────┐
│          Express Server (REST API)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes Handler                                       │   │
│  │  • /addBlock    • /chain    • /validate             │   │
│  │  • /tamper      • /status   • /sync                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                        ▼
         ┌──────────────┐        ┌──────────────┐
         │  Node Class  │        │ Blockchain   │
         │              │        │   Class      │
         │ • addBlock   │        │              │
         │ • sync       │        │ • Chain      │
         │ • broadcast  │        │ • Validate   │
         │ • receive    │        │              │
         └──────────────┘        └──────────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
         ┌──────────────────────────────────┐
         │    Block & Block Chain Data      │
         │    (In Memory)                   │
         └──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                        ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │  Node on Port 3001   │  │  Node on Port 3002   │
    │   (Peer Network)     │  │   (Peer Network)     │
    └──────────────────────┘  └──────────────────────┘
              │                       │
              └───────────┬───────────┘
                          ▼
         ┌──────────────────────────────┐
         │   Peer-to-Peer Sync via API  │
         │   (Consensus: Longest Chain) │
         └──────────────────────────────┘
```

### Component Interaction

```
User Action
    │
    ├─→ Add Block
    │   ├─→ Blockchain.addBlock()
    │   ├─→ Create new Block with SHA-256 hash
    │   ├─→ Broadcast to peers
    │   └─→ Return block info
    │
    ├─→ Validate Chain
    │   ├─→ Blockchain.isChainValid()
    │   ├─→ Check each block's hash
    │   ├─→ Verify chain linkage
    │   ├─→ Log tampering if detected
    │   └─→ Return true/false
    │
    ├─→ Tamper (Demo)
    │   ├─→ Modify block data
    │   ├─→ Keep hash unchanged (creates mismatch)
    │   └─→ Wait for validation to detect
    │
    ├─→ Sync with Peers
    │   ├─→ Node.syncWithPeers()
    │   ├─→ Query peer chains
    │   ├─→ Compare lengths
    │   ├─→ If longer valid chain found, replace
    │   └─→ Achieve consensus
    │
    └─→ Get Status
        ├─→ Retrieve node info
        ├─→ Chain length & validity
        ├─→ Peer count
        └─→ Return metadata
```

---

## Core Components

### 1. Block Class (`blockchain.js`)

**Purpose:** Represents a single block in the ledger

**Properties:**
```javascript
{
  index: number,           // Position in chain
  timestamp: string,       // ISO timestamp
  data: string,           // Transaction data
  previousHash: string,   // Hash of previous block
  hash: string           // SHA-256 of this block
}
```

**Key Methods:**
- `calculateHash()`: Computes SHA-256 hash of block content
- `isValid()`: Verifies if stored hash matches calculated hash

**Hash Calculation:**
```
SHA-256({
  index: 1,
  timestamp: "2024-03-27T10:30:00Z",
  data: "Alice → Bob: 50 coins",
  previousHash: "a1b2c3d4..."
})
```

### 2. Blockchain Class (`blockchain.js`)

**Purpose:** Manages the chain of blocks and validation logic

**Properties:**
```javascript
{
  chain: Block[],          // Array of all blocks
  nodeId: string,          // Identifier for this chain
  difficulty: number       // Proof-of-work (currently 0)
}
```

**Key Methods:**
- `addBlock(data)`: Creates and adds new block
- `isChainValid()`: Complete chain validation
- `getChain()`: Returns all blocks
- `tampering(index, data)`: Simulates attack for demo
- `replaceChain(newChain)`: Replaces with longer valid chain

**Genesis Block:**
```javascript
{
  index: 0,
  timestamp: "2024-03-27T10:00:00Z",
  data: "Genesis Block",
  previousHash: "0",
  hash: "calculated-sha256"
}
```

### 3. Node Class (`node.js`)

**Purpose:** Represents a distributed node with peer capabilities

**Properties:**
```javascript
{
  nodeId: string,              // Unique node identifier
  port: number,                // Server port
  blockchain: Blockchain,      // Internal blockchain
  peers: string[]              // Peer node URLs
}
```

**Key Methods:**
- `addBlock(data)`: Add block with broadcasting
- `broadcastBlock(block)`: Send block to all peers
- `receiveBlock(blockData)`: Receive block from peer
- `syncWithPeers()`: Consensus via longest chain
- `validateBlockchain()`: Check chain integrity
- `tamperWithBlock()`: Demo tampering

### 4. Express Server (`server.js`)

**Purpose:** HTTP API for blockchain operations

**Running on:** Port 3001 (or specified PORT)

**Static Files:** Serves `public/` directory

---

## Data Flow

### Adding a Block

```
Frontend Input
    │
    ▼
POST /addBlock
    │ {data: "transaction"}
    ▼
Server Handler
    │
    ├─→ Validate input
    ├─→ Call node.addBlock(data)
    │
    ▼
Node.addBlock()
    │
    ├─→ Call blockchain.addBlock(data)
    │
    ▼
Blockchain.addBlock()
    │
    ├─→ Create new Block object
    │   └─→ index: chain.length
    │   └─→ timestamp: now
    │   └─→ previousHash: last block's hash
    │
    ├─→ Calculate hash
    │   └─→ SHA-256(index + timestamp + data + previousHash)
    │
    ├─→ Add to chain array
    │
    ▼
Node broadcasts to peers
    │
    ├─→ Iterate through peers array
    ├─→ Send POST /receiveBlock to each
    └─→ Peer receives and adds if valid
    
    ▼
Response to frontend
    │
    └─→ Return block details
```

### Validating Chain

```
Frontend Click: "Validate"
    │
    ▼
GET /validate
    │
    ▼
Server Handler
    │
    ├─→ Call node.validateBlockchain()
    │
    ▼
Blockchain.isChainValid()
    │
    ├─→ Check Genesis Block
    │   └─→ index === 0?
    │   └─→ previousHash === "0"?
    │
    ├─→ For each block i from 1 to length-1:
    │
    │   ├─→ Check: block[i].hash === block[i].calculateHash()?
    │   │   ├─→ NO → 🚨 TAMPERING DETECTED! Return false
    │   │   └─→ YES → Continue
    │   │
    │   └─→ Check: block[i].previousHash === block[i-1].hash?
    │       ├─→ NO → 🚨 CHAIN BROKEN! Return false
    │       └─→ YES → Continue
    │
    ▼
All checks passed
    │
    └─→ Return true (Chain is valid)
    
    OR
    
    └─→ Return false (Tampering/Chain break detected)
```

### Tampering Detection

```
Attacker modifies Block #2 data:
    │
    Current state:
    ├─→ block[2].data = "Alice → Bob: 50"
    ├─→ block[2].hash = "a1b2c3d4e5f6..." (calculated from original data)
    │
    ▼
Attacker changes data:
    │
    block[2].data = "Alice → Bob: 500" (10x amount!)
    
    ▼
Validation occurs:
    │
    ├─→ Recalculate hash from current data
    │   └─→ SHA-256(...500...) = "x9y8z7w6..."
    │
    ├─→ Compare with stored hash
    │   └─→ Stored: "a1b2c3d4e5f6..."
    │   └─→ Current: "x9y8z7w6..."
    │   └─→ NOT EQUAL!
    │
    ▼
🚨 TAMPERING DETECTED!
    │
    └─→ Log details and return false
```

---

## Cryptography & Hashing

### SHA-256 Algorithm

**What it is:** Secure Hash Algorithm, produces 256-bit (32-byte) hash

**Properties:**
- ✅ **Deterministic**: Same input always produces same hash
- ✅ **One-way**: Cannot reverse hash to get original data
- ✅ **Avalanche Effect**: Tiny change → completely different hash
- ✅ **Collision Resistant**: Virtually impossible to find two inputs with same hash

**Example:**
```
Input:  {'data': 'Alice transfers 50 coins to Bob'}
Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

Input:  {'data': 'Alice transfers 50 coins to Bob'} [unchanged]
Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

Input:  {'data': 'Alice transfers 51 coins to Bob'} [changed 1 digit]
Output: x1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6
        ^ Completely different!
```

### Implementation in Node.js

```javascript
const crypto = require('crypto');

function sha256Hash(data) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');  // Hexadecimal format
}
```

---

## Consensus Mechanism

### Longest Chain Rule

**Principle:** In case of disagreement, the longest valid chain is the source of truth

**Algorithm:**
```
When syncing with peers:

1. Query each peer: GET /chain
2. Validate received chain
3. Compare lengths:
   - If peer chain longer AND valid
   - Replace local chain with peer chain
   - Broadcast new chain to other peers
4. All nodes converge to same longest chain
```

**Example:**
```
Node A: [Block0] [Block1] [Block2] [Block3] (length: 4)
Node B: [Block0] [Block1] [Block2]          (length: 3)

After sync:
Node B receives Node A's chain
Node B validates and sees it's longer
Node B replaces its chain with Node A's
Both nodes now have: [Block0] [Block1] [Block2] [Block3]
```

**Network Resilience:**
- If one node is compromised/attack fails
- Other honest nodes maintain correct chain
- On sync, majority consensus wins
- Works with 2-3+ nodes effectively

---

## API Flow Diagrams

### Block Addition Flow

```
User Types: "Alice → Bob: 50"
         │
         ▼
   [Add Block Button]
         │
         ▼
   validateInput()
    ✓ Not empty? ✓ String?
         │
         ▼
   POST /addBlock
         │
    ┌────┴─────┐
    ▼          ▼
 Success    Error
  ║          ║
  ║ ✓ Show   ║ ✗ Show Error
  ║  Success ║  Message
  ║  Message ║
  ║  ║       ║
  ║  ▼ Auto  ║
  ║  Load    ║
  ║  Chain   ║
  │          │
  └─[Update Display]─┘
```

### Validation Flow

```
User Clicks: "Validate Chain"
         │
         ▼
   [Validate Button]
         │
         ▼
   Show Loading Spinner
         │
         ▼
   GET /validate
         │
    ┌────┴─────────┐
    ▼              ▼
 Valid (true)    Invalid (false)
    │              │
    ▼              ▼
 ✅ Green      ❌ Red Box
  Box: Valid    "Tampering
  "All blocks   Detected"
  verified"

(In both cases):
         │
         ▼
   Auto-load chain
   to highlight
   invalid blocks
```

### Tampering Simulation Flow

```
User enters:
├─ Block Index: 2
└─ New Data: "HACKED"
         │
         ▼
   [Tamper Button]
         │
         ▼
   Validate input
         │
         ▼
   POST /tamper
         │
         ▼
   Server:
   ├─ Modify block[2].data = "HACKED"
   ├─ Leave block[2].hash unchanged
   ├─ Now hash ≠ calculateHash() (mismatch!)
         │
         ▼
   Return success
         │
         ▼
   Show message:
   "Block tampered!
    Click Validate to detect"
         │
         ▼
   User clicks Validate
         │
         ▼
   System detects hash mismatch
         │
         ▼
   ❌ TAMPERING DETECTED!
```

---

## Security Model

### Threat Model

**Attacked Party's Goal:** Modify historical transaction data

**Attack Scenarios:**

#### Scenario 1: Direct Block Modification
```
Attacker: "I'll change block #5 to steal coins"

Attempt:
├─ Modify block[5].data
└─ Leave block[5].hash unchanged

On Validation:
├─ System recalculates: SHA-256(modified data)
├─ Gets different hash
├─ Comparison: calculated ≠ stored
└─ ❌ Attack FAILS - Tampering Detected!
```

#### Scenario 2: Block + Hash Modification
```
Attacker: "I'll change both data and hash"

Attempt:
├─ Modify block[5].data
└─ Recalculate & update block[5].hash

But then:
├─ block[6].previousHash still points to OLD hash
├─ On Validation: block[6].previousHash ≠ block[5].hash
└─ ❌ Attack FAILS - Chain Linkage Broken!
```

#### Scenario 3: Full Chain Modification
```
Attacker: "I'll modify multiple blocks and update all hashes"

Attempt:
├─ Modify blocks[5...10]
├─ Recalculate all hashes
├─ Update all previousHash values
└─ Send to network

But then:
├─ Honest nodes validate original chain
├─ Their copy is still valid
├─ Attacker's chain vs. Honest chain
└─ Honest chain wins (first/majority)
    ❌ Attack FAILS - Consensus Protects!
```

### Why Blockchain is Secure

1. **Hash Chain Linkage**: Can't modify past without breaking chain
2. **Cryptographic Hashing**: Can't create false hashes
3. **Distributed Copies**: Can't attack all nodes simultaneously
4. **Consensus**: Majority rule prevents false takeover
5. **Immutability**: Historical data is permanent record

### Attack Complexity Analysis

To successfully attack N consecutive blocks:

```
Required Actions:
├─ Modify block data (N times)
├─ Recalculate hashes (N times)
├─ Update all subsequent blocks (N times)
└─ Do this FASTER than new blocks are created

Required Computational Power:
└─ > 50% of network's hashing power (51% attack)

Required Node Takeover:
└─ Control > 50% of nodes simultaneously

Practical Result:
└─ Practically IMPOSSIBLE for secure networks
└─ Exponentially harder as network grows
```

---

## Performance Characteristics

### Time Complexity
- **Add Block**: O(1) - constant time
- **Validate Chain**: O(n) - linear with chain length
- **Sync with Peers**: O(n) - linear with chain length
- **Hash Calculation**: O(m) - linear with block data length

### Space Complexity
- **Chain Storage**: O(n) - linear with block count
- **Hash Storage**: O(n*32) - 32 bytes per SHA-256 hash
- **Memory per Node**: O(n) where n = number of blocks

### Scalability
- Current: In-memory only (no persistence)
- Recommended: Add database for production
- Network throughput: Limited by API speed (not cryptography)

---

## Future Enhancements

1. **Persistence**: Add MongoDB/PostgreSQL for data persistence
2. **Proof of Work**: Implement difficulty adjustments
3. **Merkle Trees**: Optimize validation of large chains
4. **Smart Contracts**: Execute code on blockchain
5. **Sharding**: Partition chain for scalability
6. **Light Clients**: Verify blocks without full chain
7. **Transaction Mempool**: Queue pending transactions
8. **State Channels**: Off-chain transactions for speed

---

**This architecture ensures that the system is secure, distributed, and verifiable!** 🔐

