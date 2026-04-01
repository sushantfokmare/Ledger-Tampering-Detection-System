const crypto = require('crypto');

/**
 * MerkleTree class - represents a Merkle tree for efficient data verification
 * Used to verify the integrity of all blocks in the blockchain
 */
class MerkleTree {
  constructor(blocks) {
    this.tree = [];
    this.root = null;
    if (blocks && blocks.length > 0) {
      this.buildTree(blocks);
    }
  }

  /**
   * Hash a value using SHA-256
   * @param {string} value - Value to hash
   * @returns {string} - SHA-256 hash
   */
  static hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Build Merkle tree from blocks
   * @param {Array} blocks - Array of blocks
   */
  buildTree(blocks) {
    // Create leaf nodes - hash of each block
    let currentLevel = blocks.map(block => 
      MerkleTree.hash(block.hash)
    );

    this.tree.push([...currentLevel]);

    // Build tree upwards
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      // If odd number of nodes, duplicate the last one
      if (currentLevel.length % 2 !== 0) {
        currentLevel.push(currentLevel[currentLevel.length - 1]);
      }

      // Combine pairs of hashes
      for (let i = 0; i < currentLevel.length; i += 2) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        const parentHash = MerkleTree.hash(combined);
        nextLevel.push(parentHash);
      }

      this.tree.push([...nextLevel]);
      currentLevel = nextLevel;
    }

    // Root is the last element
    this.root = currentLevel.length > 0 ? currentLevel[0] : null;
  }

  /**
   * Verify a specific block in the tree
   * @param {number} blockIndex - Index of block to verify
   * @returns {boolean} - true if block is valid in tree
   */
  verifyBlock(blockIndex) {
    if (!this.root || this.tree.length === 0) return false;
    
    // Check if block hash exists in the first level (leaves)
    return this.tree[0][blockIndex] !== undefined;
  }

  /**
   * Get tree depth
   * @returns {number} - Depth of tree
   */
  getDepth() {
    return this.tree.length;
  }

  /**
   * Get root hash
   * @returns {string} - Merkle root hash
   */
  getRoot() {
    return this.root;
  }
}

/**
 * Block class - represents a single block in the blockchain
 */
class Block {
  constructor(index, timestamp, data, previousHash = '0') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.originalData = data; // ← IMMUTABLE COPY (DLT Principle: Write Once, Read Many)
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.tamperedAttempts = []; // ← AUDIT TRAIL of all tampering attempts
    this.isTampered = false; // Flag indicating if tampering was detected
    this.cascadeTampered = false; // Flag for cascade tampering effect
  }

  /**
   * Calculate SHA-256 hash of the block
   * @returns {string} - SHA-256 hash
   */
  calculateHash() {
    const blockString = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash
    });

    return crypto
      .createHash('sha256')
      .update(blockString)
      .digest('hex');
  }

  /**
   * Verify if block's hash is correct
   * @returns {boolean} - true if hash is valid
   */
  isValid() {
    return this.hash === this.calculateHash();
  }
}

/**
 * Blockchain class - maintains the entire chain of blocks with Merkle tree
 */
class Blockchain {
  constructor(nodeId = 'default') {
    this.chain = [];
    this.nodeId = nodeId;
    this.difficulty = 0; // Simplified - no proof of work
    this.merkleTree = new MerkleTree([]); // Initialize empty Merkle tree
    
    // Create genesis block
    const genesisBlock = new Block(
      0,
      new Date().toISOString(),
      'Genesis Block',
      '0'
    );
    this.chain.push(genesisBlock);
    this.updateMerkleTree(); // Build merkle tree with genesis block
    console.log(`[${this.nodeId}] Genesis block created:`, genesisBlock.hash.substring(0, 8) + '...');
  }

  /**
   * Update Merkle tree after chain changes
   */
  updateMerkleTree() {
    this.merkleTree = new MerkleTree(this.chain);
  }

  /**
   * Get the latest block in the chain
   * @returns {Block} - last block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new block to the blockchain
   * @param {string} data - Data to store in the block
   * @returns {Block} - the newly added block
   */
  addBlock(data) {
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      data,
      this.getLatestBlock().hash
    );

    this.chain.push(newBlock);
    this.updateMerkleTree(); // Update merkle tree
    console.log(`[${this.nodeId}] ✅ Block #${newBlock.index} added:`, newBlock.hash.substring(0, 8) + '...');
    console.log(`    Data: "${data}"`);
    
    return newBlock;
  }

  /**
   * Validate the entire blockchain with Merkle tree verification
   * Checks:
   * 1. Genesis block has index 0 and previousHash '0'
   * 2. Each block's hash is valid
   * 3. Each block's previousHash matches the previous block's hash
   * 4. Merkle tree integrity
   * @returns {boolean} - true if chain is valid
   */
  isChainValid() {
    // Check genesis block
    if (this.chain[0].index !== 0 || this.chain[0].previousHash !== '0') {
      console.log(`[${this.nodeId}] ❌ TAMPERING DETECTED: Invalid genesis block`);
      return false;
    }

    // Check all subsequent blocks
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify current block's hash
      if (!currentBlock.isValid()) {
        console.log(
          `[${this.nodeId}] ❌ TAMPERING DETECTED at block #${i}:`
        );
        console.log(`    Stored hash:    ${currentBlock.hash}`);
        console.log(`    Calculated hash: ${currentBlock.calculateHash()}`);
        console.log(`    Block data has been tampered with!`);
        
        // 🔗 CASCADE EFFECT: Mark all subsequent blocks as cascading tampered
        console.log(`\n🔗 CASCADE TAMPERING EFFECT:`);
        for (let j = i; j < this.chain.length; j++) {
          this.chain[j].cascadeTampered = true;
          console.log(`    Block #${j} marked as CASCADING_TAMPERED`);
        }
        console.log();
        
        return false;
      }

      // Verify hash chain linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(
          `[${this.nodeId}] ❌ TAMPERING DETECTED at block #${i}:`
        );
        console.log(`    Expected previousHash: ${previousBlock.hash}`);
        console.log(`    Actual previousHash:   ${currentBlock.previousHash}`);
        console.log(`    Chain linkage broken!`);
        
        // 🔗 CASCADE EFFECT: Mark all subsequent blocks
        console.log(`\n🔗 CASCADE TAMPERING EFFECT:`);
        for (let j = i; j < this.chain.length; j++) {
          this.chain[j].cascadeTampered = true;
          console.log(`    Block #${j} marked as CASCADING_TAMPERED`);
        }
        console.log();
        
        return false;
      }
    }

    // Verify Merkle tree
    if (!this.merkleTree.root) {
      console.log(`[${this.nodeId}] ❌ Merkle tree invalid`);
      return false;
    }

    console.log(`[${this.nodeId}] ✅ Chain is valid! All ${this.chain.length} blocks verified.`);
    console.log(`    Merkle Root: ${this.merkleTree.root.substring(0, 8)}...`);
    return true;
  }

  /**
   * Get the full chain as JSON with Merkle tree info
   * @returns {Object} - object with chain and merkle tree data
   */
  getChain() {
    return {
      blocks: this.chain,
      merkleTree: {
        root: this.merkleTree.root,
        depth: this.merkleTree.getDepth(),
        verified: !!this.merkleTree.root
      }
    };
  }

  /**
   * Get chain length
   * @returns {number} - number of blocks
   */
  getChainLength() {
    return this.chain.length;
  }

  /**
   * Intentionally tamper with a block for testing (DLT-Enhanced with audit trail)
   * Now includes CASCADE TAMPERING effect and Merkle tree updates
   * @param {number} blockIndex - index of block to tamper
   * @param {string} newData - new data to insert
   */
  tampering(blockIndex, newData) {
    if (blockIndex < 0 || blockIndex >= this.chain.length) {
      console.log(`[${this.nodeId}] ⚠️  Block index out of range`);
      return;
    }

    const block = this.chain[blockIndex];
    const oldHash = block.hash;
    const newHash = block.calculateHash();

    // Record tampering attempt in audit trail (DLT Principle: Immutability)
    block.tamperedAttempts.push({
      timestamp: new Date().toISOString(),
      attemptedData: newData,
      storedHash: oldHash,
      calculatedHash: crypto.createHash('sha256')
        .update(JSON.stringify({
          index: block.index,
          timestamp: block.timestamp,
          data: newData,
          previousHash: block.previousHash
        }))
        .digest('hex'),
      detected: true
    });

    block.isTampered = true; // Mark block as tampered
    block.data = newData; // Keep tampered data visible for demonstration
    
    console.log(`[${this.nodeId}] 🔨 TAMPERING SIMULATION (DLT-Compliant Audit):`);
    console.log(`    Block #${blockIndex} tampering attempt recorded`);
    console.log(`    Original data (IMMUTABLE): "${block.originalData}"`);
    console.log(`    Attempted data: "${newData}"`);
    console.log(`    Original hash: ${oldHash.substring(0, 8)}...`);
    console.log(`    Tampered data hash: ${crypto.createHash('sha256')
      .update(JSON.stringify({
        index: block.index,
        timestamp: block.timestamp,
        data: newData,
        previousHash: block.previousHash
      }))
      .digest('hex').substring(0, 8)}...`);
    
    // 🔗 CASCADE TAMPERING EFFECT: Mark all subsequent blocks
    console.log(`\n🔗 CASCADE TAMPERING EFFECT - Marking subsequent blocks:`);
    for (let i = blockIndex + 1; i < this.chain.length; i++) {
      this.chain[i].cascadeTampered = true;
      this.chain[i].isTampered = true;
      console.log(`    Block #${i} marked as CASCADING_TAMPERED (invalid due to broken chain)`);
    }
    
    // Update Merkle tree
    this.updateMerkleTree();
    console.log(`    ⚠️  Merkle tree invalidated! Previous root: ${oldHash.substring(0, 8)}...`);
    console.log(`    ⚠️  Attempt logged in audit trail. Immutable original preserved!\n`);
  }

  /**
   * Replace the chain with a new one
   * Used for consensus mechanism
   * @param {Array} newChain - new chain to replace with
   * @returns {boolean} - true if replacement successful
   */
  replaceChain(newChain) {
    if (!Array.isArray(newChain)) {
      return false;
    }

    // Create blockchain from chain data and validate
    const tempBlockchain = new Blockchain(this.nodeId);
    tempBlockchain.chain = []; // Clear default genesis
    
    for (let block of newChain) {
      const newBlock = new Block(
        block.index,
        block.timestamp,
        block.data,
        block.previousHash
      );
      newBlock.hash = block.hash;
      tempBlockchain.chain.push(newBlock);
    }

    if (tempBlockchain.isChainValid() && tempBlockchain.getChainLength() > this.chain.length) {
      this.chain = tempBlockchain.chain;
      console.log(`[${this.nodeId}] 🔄 Chain replaced with longer valid chain`);
      return true;
    }

    return false;
  }
}

module.exports = { Block, Blockchain, MerkleTree };
