#!/usr/bin/env node

/**
 * Script to start a node on a specific port
 * Usage: node startNode.js <port>
 * Example: node startNode.js 3001
 */

const port = process.argv[2] || 3001;
process.env.PORT = port;

require('./server');
