const axios = require('axios');
// const mqtt = require('mqtt'); // если нужно
const logger = require('../utils/logger');
const { OPENWEATHER_API_KEY } = require('../config/constants');

async function execute(recognizedText, scenarios) {
    let matchedScenario = null;
    let extractedParams = {};
    
    for (const sc of scenarios) {
        for (const regex of sc.compiled) {
            const match = recognizedText.match(regex);
            if (match) {
                matchedScenario = sc;
                extractedParams = match.groups || {};
                break;
            }
        }
        if (matchedScenario) break;
    }
    
    if (!matchedScenario) {
        return { text: 'Извините, я не поняла команду' };
    }
    
    logger.info(`Matched scenario: ${matchedScenario.name}, params:`, extractedParams);
    let answerText = '';
    
    switch (matchedScenario.action.type) {
        case 'weather': {
            const city = extractedParams.city || matchedScenario.action.city_default || 'Москва';
            try {
                const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}&lang=ru`;
                const response = await axios.get(url);
                const data = response.data;
                const temp = Math.round(data.main.temp);
                const description = data.weather[0].description;
                answerText = matchedScenario.response_template
                    .replace('{city}', city)
                    .replace('{temp}', temp)
                    .replace('{description}', description);
            } catch (e) {
                logger.error('Weather API error:', e.message);
                answerText = 'Не удалось получить погоду';
            }
            break;
        }
        
        case 'get_time': {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            answerText = matchedScenario.response_template.replace('{time}', timeStr);
            break;
        }
        
        case 'mqtt': {
            // Здесь нужно будет реализовать отправку MQTT
            // const mqttClient = mqtt.connect('mqtt://localhost');
            // mqttClient.on('connect', () => { ... });
            const room = extractedParams.room || 'комнате';
            answerText = matchedScenario.response_text.replace('{room}', room);
            logger.info(`MQTT command for ${room} not implemented yet`);
            break;
        }
        
        default:
            answerText = 'Команда распознана, но действие не настроено';
    }
    
    return { text: answerText };
}

module.exports = { execute };