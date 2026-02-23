const { recognizeSpeech } = require('../services/stt');
const { generateSpeech } = require('../services/tts');
const { execute } = require('../services/scenarioExecutor');
const scenarios = require('../config/scenarios');
const { TTS_TARGET_RATE } = require('../config/constants');
const logger = require('../utils/logger');

async function handle(req, res) {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        const audioBuffer = Buffer.concat(chunks);
        
        try {
            // 1. Распознавание речи
            const recognizedText = await recognizeSpeech(audioBuffer);
            logger.info(`Recognized: "${recognizedText}"`);
            
            // 2. Выполнение сценария
            const { text: answerText } = await execute(recognizedText, scenarios);
            logger.info(`Answer: "${answerText}"`);
            
            // 3. Генерация речи
            const responseAudio = await generateSpeech(answerText, TTS_TARGET_RATE);
            
            // 4. Отправка ответа
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', responseAudio.length);
            res.end(responseAudio);
            
        } catch (err) {
            logger.error('Command processing error:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });
}

module.exports = { handle };