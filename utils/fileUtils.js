const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
}

function createTempFileName(prefix = 'tmp', ext = '.wav') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}${ext}`;
}

async function safeDelete(filePath) {
    try {
        await fs.promises.unlink(filePath);
    } catch (err) {
        logger.error(`Failed to delete ${filePath}:`, err.message);
    }
}

module.exports = {
    ensureDir,
    createTempFileName,
    safeDelete
};