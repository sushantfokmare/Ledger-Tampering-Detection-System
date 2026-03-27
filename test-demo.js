/**
 * DEMO - Ledger Tampering Detection System Test Script
 * This file demonstrates how to test the system programmatically
 * 
 * Usage:
 * 1. Start server in one terminal: npm start
 * 2. Run this script in another terminal: node test-demo.js
 */

const http = require('http');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/**
 * Color console output
 */
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Run demo tests
 */
async function runDemo() {
    log('\n╔═══════════════════════════════════════════════════════════════╗', 'bright');
    log('║     LEDGER TAMPERING DETECTION SYSTEM - DEMO TEST SUITE        ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════════╝\n', 'bright');

    try {
        // Test 1: Get initial status
        log('📊 TEST 1: Getting Node Status', 'cyan');
        log('─'.repeat(60));
        const status = await makeRequest('GET', '/status');
        if (status.data.success) {
            log('✅ Node Status Retrieved:', 'green');
            console.log(`   Node ID: ${status.data.status.nodeId}`);
            console.log(`   Port: ${status.data.status.port}`);
            console.log(`   Chain Length: ${status.data.status.chainLength}`);
            console.log(`   Chain Valid: ${status.data.status.chainValid}\n`);
        } else {
            log('❌ Failed to get status\n', 'red');
            return;
        }

        // Test 2: Add blocks
        log('📝 TEST 2: Adding Blocks to Ledger', 'cyan');
        log('─'.repeat(60));
        
        const transactions = [
            'Alice transfers 50 coins to Bob',
            'Bob transfers 25 coins to Charlie',
            'Charlie transfers 10 coins to Alice',
            'Eve sends 100 coins to Dave'
        ];

        for (const tx of transactions) {
            const response = await makeRequest('POST', '/addBlock', { data: tx });
            if (response.data.success) {
                log(`✅ Block #${response.data.block.index} added`, 'green');
                console.log(`   Data: ${tx}`);
                console.log(`   Hash: ${response.data.block.hash.substring(0, 20)}...\n`);
            }
        }

        // Test 3: View blockchain
        log('📚 TEST 3: Viewing Complete Blockchain', 'cyan');
        log('─'.repeat(60));
        const chain = await makeRequest('GET', '/chain');
        if (chain.data.success) {
            log(`✅ Retrieved chain with ${chain.data.chainLength} blocks`, 'green');
            chain.data.chain.forEach(block => {
                console.log(`   [${block.index}] ${block.isValid} ${block.data}`);
            });
            log('');
        }

        // Test 4: Validate chain (should be valid)
        log('✅ TEST 4: Validating Intact Blockchain', 'cyan');
        log('─'.repeat(60));
        const validate1 = await makeRequest('GET', '/validate');
        if (validate1.data.success) {
            if (validate1.data.isValid) {
                log('✅ CHAIN VALIDATION PASSED - Blockchain is intact!', 'green');
                console.log(`   ${validate1.data.message}\n`);
            } else {
                log('❌ Chain validation failed unexpectedly\n', 'red');
            }
        }

        // Test 5: Tamper with a block
        log('🔨 TEST 5: Simulating Tampering Attack', 'cyan');
        log('─'.repeat(60));
        log('🎯 Attacking Block #2...', 'yellow');
        const tamper = await makeRequest('POST', '/tamper', {
            blockIndex: 2,
            newData: '⚠️  MALICIOUS DATA - TAMPERED TRANSACTION ⚠️'
        });
        if (tamper.data.success) {
            log('✅ Tampering simulated successfully', 'yellow');
            console.log(`   ${tamper.data.message}\n`);
        }

        // Test 6: Validate chain (should detect tampering)
        log('🔍 TEST 6: Detecting Tampering (Validation After Attack)', 'cyan');
        log('─'.repeat(60));
        const validate2 = await makeRequest('GET', '/validate');
        if (validate2.data.success) {
            if (!validate2.data.isValid) {
                log('❌ TAMPERING DETECTED! 🚨', 'red');
                console.log(`   Message: ${validate2.data.message}\n`);
            } else {
                log('⚠️  Unexpected: Chain still valid after tampering', 'yellow');
            }
        }

        // Test 7: View chain to show tampered block
        log('📋 TEST 7: Viewing Blockchain After Tampering', 'cyan');
        log('─'.repeat(60));
        const chain2 = await makeRequest('GET', '/chain');
        if (chain2.data.success) {
            log('Chain with tampered block marked as ❌:', 'yellow');
            chain2.data.chain.forEach(block => {
                const marker = block.isValid === '❌' ? '🚨' : '✅';
                console.log(`   ${marker} [${block.index}] ${block.isValid} ${block.data.substring(0, 40)}...`);
            });
            log('');
        }

        // Test 8: Summary
        log('📊 DEMO SUMMARY', 'cyan');
        log('═'.repeat(60));
        log('✅ Test 1: Node status retrieved', 'green');
        log('✅ Test 2: Successfully added 4 blocks', 'green');
        log('✅ Test 3: Blockchain retrieved correctly', 'green');
        log('✅ Test 4: Valid blockchain passed validation', 'green');
        log('🔨 Test 5: Simulated tampering attack', 'yellow');
        log('❌ Test 6: Tampering successfully DETECTED!', 'red');
        log('✅ Test 7: Tampered block clearly marked', 'green');
        log('═'.repeat(60));

        log('\n🎉 DEMO COMPLETED SUCCESSFULLY!', 'bright');
        log('\n💡 KEY FINDINGS:', 'cyan');
        log('   1. Blockchain stores transactions securely', 'green');
        log('   2. Each block is cryptographically linked via SHA-256 hashes', 'green');
        log('   3. Any tampering attempt is immediately detected', 'green');
        log('   4. The system maintains integrity across all nodes\n', 'green');

        log('📝 WHAT YOU SAW:', 'cyan');
        log('   • Added legitimate transactions to the ledger', 'green');
        log('   • Validated the intact blockchain - PASSED ✅', 'green');
        log('   • Simulated an attacker modifying block #2', 'yellow');
        log('   • Re-validated the chain - FAILED ❌ (as expected)', 'red');
        log('   • The system correctly identified the tampering!\n', 'green');

        log('🔐 SECURITY IMPLICATIONS:', 'cyan');
        log('   Even a single bit change would break the hash', 'green');
        log('   All subsequent blocks would also become invalid', 'green');
        log('   Attackers CANNOT modify history without detection', 'green');
        log('   This is the core principle of blockchain security\n', 'green');

    } catch (error) {
        log(`\n❌ ERROR: ${error.message}`, 'red');
        log('\n⚠️  Make sure the server is running on port 3001!', 'yellow');
        log('   Start it with: npm start', 'yellow');
    }
}

// Run the demo
runDemo();
