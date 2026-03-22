const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const { TTS_VOICE, TTS_QUALITY, TTS_TARGET_RATE } = require('../config/constants');
const { createTempFileName, safeDelete } = require('../utils/fileUtils');
const logger = require('../utils/logger');

async function generateSpeech(text, targetRate = TTS_TARGET_RATE) {
    const tempRaw = path.join(__dirname, '../temp', createTempFileName('tts_raw', '.wav'));
    const tempResampled = path.join(__dirname, '../temp', createTempFileName('tts_resampled', '.wav'));
    
    try {
        // 1. Генерация речи через RHVoice
        const ttsCmd = `echo "${text}" | RHVoice-test -p ${TTS_VOICE} --quality ${TTS_QUALITY} -o ${tempRaw}`;
        await execPromise(ttsCmd);
        
        // 2. Передискретизация через FFmpeg
        // const ffmpegCmd = `ffmpeg -i ${tempRaw} -ar ${targetRate} -ac 1 -c:a pcm_s16le ${tempResampled} -y`;
        // await execPromise(ffmpegCmd);
        
        // 3. Читаем результат
        const audioBuffer = fs.readFileSync(tempRaw);
        return audioBuffer;
    } catch (err) {
        logger.error('TTS generation error:', err);
        throw err;
    } finally {
        await safeDelete(tempRaw);
        await safeDelete(tempResampled);
    }
}

module.exports = { generateSpeech };