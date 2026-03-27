const axios = require('axios');
const { Blockchain } = require('./blockchain');

/**
 * Node class - represents a single node in the distributed system
 * Each node maintains its own blockchain and can sync with peers
 */
class Node {
  constructor(nodeId, port, peers = []) {
    this.nodeId = nodeId;
    this.port = port;
    this.blockchain = new Blockchain(nodeId);
    this.peers = peers; // Array of peer node URLs: ['http://localhost:3001', ...]
  }

  /**
   * Add a new block
   * @param {string} data - Data to add
   * @returns {Object} - block info
   */
  addBlock(data) {
    const block = this.blockchain.addBlock(data);
    
    // Broadcast to peers
    this.broadcastBlock(block);
    
    return block;
  }

  /**
   * Get the current blockchain
   * @returns {Array} - chain
   */
  getBlockchain() {
    return this.blockchain.getChain();
  }

  /**
   * Validate the blockchain
   * @returns {boolean} - true if valid
   */
  validateBlockchain() {
    return this.blockchain.isChainValid();
  }

  /**
   * Tamper with a block for demonstration
   * @param {number} blockIndex - index to tamper
   * @param {string} newData - new data
   */
  tamperWithBlock(blockIndex, newData) {
    this.blockchain.tampering(blockIndex, newData);
  }

  /**
   * Get node info
   * @returns {Object} - node metadata
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      chainLength: this.blockchain.getChainLength(),
      peers: this.peers
    };
  }

  /**
   * Broadcast a new block to all peers
   * @param {Block} block - block to broadcast
   */
  async broadcastBlock(block) {
    if (this.peers.length === 0) return;

    for (const peerUrl of this.peers) {
      try {
        await axios.post(`${peerUrl}/receiveBlock`, {
          block: {
            index: block.index,
            timestamp: block.timestamp,
            data: block.data,
            previousHash: block.previousHash,
            hash: block.hash
          }
        });
        console.log(`[${this.nodeId}] 📤 Block ${block.index} broadcast to ${peerUrl}`);
      } catch (error) {
        // Silently fail if peer is unavailable
      }
    }
  }

  /**
   * Receive a block from a peer
   * @param {Object} blockData - block data from peer
   */
  receiveBlock(blockData) {
    // Check if we already have this block
    if (this.blockchain.chain.length > blockData.index) {
      return; // Already have this block
    }

    // If this is the next block in sequence, add it
    if (blockData.index === this.blockchain.getChainLength()) {
      const { Block } = require('./blockchain');
      const block = new Block(
        blockData.index,
        blockData.timestamp,
        blockData.data,
        blockData.previousHash
      );
      block.hash = blockData.hash;

      // Verify block is valid
      if (block.isValid() && blockData.previousHash === this.blockchain.getLatestBlock().hash) {
        this.blockchain.chain.push(block);
        console.log(`[${this.nodeId}] 📥 Block ${blockData.index} received and added from peer`);
      }
    }
  }

  /**
   * Sync blockchain with peers (consensus: longest valid chain wins)
   */
  async syncWithPeers() {
    if (this.peers.length === 0) return;

    console.log(`[${this.nodeId}] 🔄 Starting sync with ${this.peers.length} peer(s)...`);

    for (const peerUrl of this.peers) {
      try {
        const response = await axios.get(`${peerUrl}/chain`);
        const peerChain = response.data;

        // If peer has a longer valid chain, replace ours
        if (peerChain && peerChain.length > this.blockchain.getChainLength()) {
          const replaced = this.blockchain.replaceChain(peerChain);
          if (replaced) {
            console.log(`[${this.nodeId}] ✅ Synced with ${peerUrl}`);
          }
        }
      } catch (error) {
        // Silently fail if peer is unavailable
      }
    }
  }

  /**
   * Get detailed node status
   * @returns {Object} - comprehensive status info
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      chainLength: this.blockchain.getChainLength(),
      latestBlockHash: this.blockchain.getLatestBlock().hash,
      chainValid: this.blockchain.isChainValid(),
      peersCount: this.peers.length,
      peers: this.peers
    };
  }
}

module.exports = Node;
