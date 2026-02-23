require('dotenv').config();

module.exports = {
    HTTP_PORT: process.env.HTTP_PORT || 3001,
    UDP_PORT: parseInt(process.env.UDP_PORT) || 41235,
    UDP_BROADCAST: process.env.UDP_BROADCAST || '192.168.1.255',
    
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
    
    PYTHON_PATH: process.env.PYTHON_PATH || './venv/bin/python',
    
    TTS_VOICE: process.env.TTS_VOICE || 'anna',
    TTS_QUALITY: process.env.TTS_QUALITY || 'min',
    TTS_TARGET_RATE: parseInt(process.env.TTS_TARGET_RATE) || 44100,
    
    TEMP_DIR: './temp',
    UPLOADS_DIR: './uploads',
    SCENARIOS_PATH: './scenarios.json'
};