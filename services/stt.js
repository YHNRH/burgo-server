const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const { PYTHON_PATH } = require('../config/constants');
const { createTempFileName, safeDelete } = require('../utils/fileUtils');
const logger = require('../utils/logger');

async function recognizeSpeech(audioBuffer) {
    const tempWav = path.join(__dirname, '../temp', createTempFileName('stt', '.wav'));
    try {
        // Сохраняем входящий WAV во временный файл
        fs.writeFileSync(tempWav, audioBuffer);
        
        const { stdout, stderr } = await execPromise(`${PYTHON_PATH} speech.py ${tempWav}`);
        if (stderr) logger.warn('STT stderr:', stderr);
        return stdout.trim();
    } catch (err) {
        logger.error('STT execution error:', err);
        throw err;
    } finally {
        await safeDelete(tempWav);
    }
}

module.exports = { recognizeSpeech };