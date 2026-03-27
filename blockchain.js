const crypto = require('crypto');

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
 * Blockchain class - maintains the entire chain of blocks
 */
class Blockchain {
  constructor(nodeId = 'default') {
    this.chain = [];
    this.nodeId = nodeId;
    this.difficulty = 0; // Simplified - no proof of work
    
    // Create genesis block
    const genesisBlock = new Block(
      0,
      new Date().toISOString(),
      'Genesis Block',
      '0'
    );
    this.chain.push(genesisBlock);
    console.log(`[${this.nodeId}] Genesis block created:`, genesisBlock.hash.substring(0, 8) + '...');
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
    console.log(`[${this.nodeId}] ✅ Block #${newBlock.index} added:`, newBlock.hash.substring(0, 8) + '...');
    console.log(`    Data: "${data}"`);
    
    return newBlock;
  }

  /**
   * Validate the entire blockchain
   * Checks:
   * 1. Genesis block has index 0 and previousHash '0'
   * 2. Each block's hash is valid
   * 3. Each block's previousHash matches the previous block's hash
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
        return false;
      }
    }

    console.log(`[${this.nodeId}] ✅ Chain is valid! All ${this.chain.length} blocks verified.`);
    return true;
  }

  /**
   * Get the full chain as JSON
   * @returns {Array} - array of blocks
   */
  getChain() {
    return this.chain;
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

module.exports = { Block, Blockchain };
