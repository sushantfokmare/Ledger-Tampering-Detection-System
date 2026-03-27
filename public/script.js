/**
 * Frontend JavaScript - Ledger Tampering Detection System
 * Handles all user interactions and API calls
 */

const API_BASE_URL = 'http://localhost:' + window.location.port;

// ========== Utility Functions ==========

/**
 * Show a message to the user
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', 'info'
 * @param {string} containerId - ID of container to show message in
 */
function showMessage(message, type = 'info', containerId = 'addBlockMessage') {
    const messageEl = document.getElementById(containerId);
    messageEl.textContent = message;
    messageEl.className = `message show ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.className = 'message';
    }, 5000);
}

/**
 * Fetch node info and update header
 */
async function updateNodeInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        const data = await response.json();
        
        if (data.success) {
            const status = data.status;
            document.getElementById('nodeInfo').innerHTML = `
                <strong>Node ID:</strong> ${status.nodeId} | 
                <strong>Chain Length:</strong> ${status.chainLength} | 
                <strong>Status:</strong> ${status.chainValid ? '✅ Valid' : '❌ INVALID'} |
                <strong>Peers:</strong> ${status.peersCount}
            `;
        }
    } catch (error) {
        console.error('Error updating node info:', error);
    }
}

/**
 * Format hash for display
 */
function formatHash(hash) {
    if (!hash) return 'N/A';
    return hash.substring(0, 16) + '...';
}

// ========== API Integration Functions ==========

/**
 * Add a new block
 */
async function addBlock() {
    const data = document.getElementById('blockData').value.trim();
    
    if (!data) {
        showMessage('❌ Please enter transaction data', 'error');
        return;
    }

    try {
        showMessage('⏳ Adding block...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/addBlock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: data })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(
                `✅ Block #${result.block.index} added!\nHash: ${formatHash(result.block.hash)}`,
                'success'
            );
            document.getElementById('blockData').value = '';
            updateNodeInfo();
            
            // Auto-load chain after adding
            setTimeout(() => loadChain(), 500);
        } else {
            showMessage(`❌ Error: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

/**
 * Add demo data
 */
function addDemoData(data) {
    document.getElementById('blockData').value = data;
    addBlock();
}

/**
 * Load and display the blockchain
 */
async function loadChain() {
    try {
        const response = await fetch(`${API_BASE_URL}/chain`);
        const data = await response.json();

        if (data.success) {
            const chainContainer = document.getElementById('chainContainer');
            chainContainer.innerHTML = '';

            data.chain.forEach(block => {
                const blockEl = document.createElement('div');
                blockEl.className = `block-item ${block.isValid === '❌' ? 'invalid' : ''}`;
                
                blockEl.innerHTML = `
                    <div class="block-index">
                        Block #${block.index} ${block.isValid}
                    </div>
                    <div class="block-data">
                        <span class="label">Data:</span> ${block.data}
                    </div>
                    <div class="block-data">
                        <span class="label">Timestamp:</span> ${new Date(block.timestamp).toLocaleString()}
                    </div>
                    <div class="block-hash">
                        <span class="label">Hash:</span> ${block.hash}
                    </div>
                    <div class="block-hash">
                        <span class="label">Previous Hash:</span> ${block.previousHash}
                    </div>
                `;
                
                chainContainer.appendChild(blockEl);
            });

            showMessage(
                `✅ Loaded ${data.chain.length} blocks from ledger`,
                'success',
                'addBlockMessage'
            );
        }
    } catch (error) {
        showMessage(`❌ Error loading chain: ${error.message}`, 'error', 'addBlockMessage');
    }
}

/**
 * Validate the blockchain
 */
async function validateChain() {
    try {
        const validationStatus = document.getElementById('validationStatus');
        validationStatus.innerHTML = '<div class="status loading"><span class="spinner"></span>Validating...</div>';

        const response = await fetch(`${API_BASE_URL}/validate`);
        const data = await response.json();

        const statusDiv = document.createElement('div');
        statusDiv.className = `status ${data.isValid ? 'valid' : 'invalid'}`;
        
        if (data.isValid) {
            statusDiv.innerHTML = `
                <strong>✅ CHAIN VALID</strong><br/>
                <small>All ${data.chainLength} blocks verified and intact. No tampering detected.</small>
            `;
        } else {
            statusDiv.innerHTML = `
                <strong>❌ TAMPERING DETECTED!</strong><br/>
                <small>${data.message}</small>
            `;
        }
        
        validationStatus.innerHTML = statusDiv.outerHTML;

        // Load chain to show invalid blocks
        setTimeout(() => loadChain(), 500);
    } catch (error) {
        document.getElementById('validationStatus').innerHTML = `
            <div class="status invalid">
                <strong>❌ Error: ${error.message}</strong>
            </div>
        `;
    }
}

/**
 * Tamper with a block
 */
async function tamperBlock() {
    const blockIndex = parseInt(document.getElementById('tamperedBlockIndex').value);
    const newData = document.getElementById('tamperedData').value.trim();

    if (isNaN(blockIndex) || !newData) {
        showMessage('❌ Please enter valid block index and new data', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tamper`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ blockIndex, newData })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(
                `🔨 Block #${blockIndex} tampered!\n"${newData}"\n\nNow click "Validate" to detect tampering!`,
                'info'
            );
            document.getElementById('tamperedData').value = '';
        } else {
            showMessage(`❌ Error: ${result.message}`, 'error');
        }
    } catch (error) {
        showMessage(`❌ Error: ${error.message}`, 'error');
    }
}

/**
 * Sync with peer nodes
 */
async function syncNodes() {
    try {
        showMessage('🔄 Syncing with peer nodes...', 'info');

        const response = await fetch(`${API_BASE_URL}/sync`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showMessage(
                `✅ Sync completed!\nChain Length: ${result.status.chainLength}`,
                'success'
            );
            updateNodeInfo();
            loadChain();
        } else {
            showMessage(`⚠️ Sync completed with message: ${result.message}`, 'info');
        }
    } catch (error) {
        showMessage(`⚠️ Sync attempted (peers may be offline)`, 'info');
    }
}

/**
 * Clear all messages
 */
function clearMessages() {
    document.getElementById('addBlockMessage').className = 'message';
    document.getElementById('validationStatus').innerHTML = '';
}

/**
 * Load and display immutable stream with audit trail (DLT-Compliant)
 */
async function loadStream() {
    try {
        const response = await fetch(`${API_BASE_URL}/stream`);
        const data = await response.json();

        if (data.success) {
            const streamContainer = document.getElementById('streamContainer');
            streamContainer.innerHTML = '';

            data.stream.forEach((block, index) => {
                const blockEl = document.createElement('div');
                blockEl.className = `stream-block ${block.isTampered ? 'tampered' : ''}`;
                
                // Determine status color
                const statusClass = block.isValid === '✅' ? 'valid' : 'invalid';
                
                let html = `
                    <div class="flow-dot"></div>
                    <div class="stream-header">
                        <span class="stream-title">📦 Block #${block.index}</span>
                        <span class="stream-status ${statusClass}">${block.isValid} ${block.isTampered ? '🚨 TAMPERED' : 'Valid'}</span>
                    </div>
                `;

                // Show original immutable data (protected by DLT principles)
                html += `
                    <div class="stream-data-row original">
                        <span class="stream-label">🔒 Original (Immutable):</span>
                        <span class="stream-value">"${block.originalData}"</span>
                    </div>
                `;

                // Show current data (may be different if tampered)
                if (block.currentData !== block.originalData) {
                    html += `
                        <div class="stream-data-row tampered-data">
                            <span class="stream-label">🔨 Attempted (Tampered):</span>
                            <span class="stream-value">"${block.currentData}"</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="stream-data-row">
                            <span class="stream-label">📝 Current Data:</span>
                            <span class="stream-value">"${block.currentData}"</span>
                        </div>
                    `;
                }

                // Show metadata
                html += `
                    <div class="stream-data-row">
                        <span class="stream-label">⏰ Timestamp:</span>
                        <span class="stream-value">${new Date(block.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="stream-data-row">
                        <span class="stream-label">🔗 Hash:</span>
                        <span class="stream-value hash">${block.hash}</span>
                    </div>
                    <div class="stream-data-row">
                        <span class="stream-label">⬅️ Prev Hash:</span>
                        <span class="stream-value hash">${block.previousHash}</span>
                    </div>
                `;

                // Show tampering audit trail if any attempts were made
                if (block.tamperedAttempts && block.tamperedAttempts.length > 0) {
                    html += `
                        <div class="audit-trail">
                            <div class="audit-trail-title">📋 Tampering Audit Trail (${block.tamperedAttempts.length} attempt${block.tamperedAttempts.length > 1 ? 's' : ''})</div>
                    `;

                    block.tamperedAttempts.forEach((attempt, idx) => {
                        html += `
                            <div class="audit-entry">
                                <strong>Attempt #${idx + 1}:</strong> ${new Date(attempt.timestamp).toLocaleString()}<br/>
                                <strong>Attempted Data:</strong> <span class="attempt-data">"${attempt.attemptedData}"</span><br/>
                                <strong>Stored Hash:</strong> ${attempt.storedHash}<br/>
                                <strong>Calculated Hash (from tampered data):</strong> ${attempt.calculatedHash}<br/>
                                <strong>Status:</strong> ${attempt.detected ? '🚨 DETECTED by hash mismatch' : 'Not detected'}
                            </div>
                        `;
                    });

                    html += `</div>`;
                }

                blockEl.innerHTML = html;
                streamContainer.appendChild(blockEl);
            });

            // Show DLT compliance message
            const complianceNote = document.createElement('div');
            complianceNote.style.cssText = 'background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #4caf50;';
            complianceNote.innerHTML = `
                <strong>✅ DLT Compliance Report:</strong><br/>
                🔒 Original data is IMMUTABLE and PROTECTED<br/>
                📋 All tampering attempts are logged in AUDIT TRAIL<br/>
                ✅ Consensus maintained across distributed nodes<br/>
                🔍 Tampering detection via hash mismatch
            `;
            streamContainer.appendChild(complianceNote);

            showMessage(
                `✅ Loaded ${data.stream.length} blocks with immutable stream view`,
                'success',
                'addBlockMessage'
            );
        }
    } catch (error) {
        showMessage(`❌ Error loading stream: ${error.message}`, 'error', 'addBlockMessage');
    }
}

// ========== Initialize ==========

document.addEventListener('DOMContentLoaded', () => {
    updateNodeInfo();
    
    // Update node info every 5 seconds
    setInterval(updateNodeInfo, 5000);

    // Load chain on startup
    setTimeout(() => loadChain(), 1000);

    // Add Enter key support for input fields
    document.getElementById('blockData').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            addBlock();
        }
    });

    // Log initialization
    console.log('🚀 Ledger Tampering Detection System UI Loaded');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);
});
