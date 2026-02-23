require('dotenv').config();
const http = require('http');
const { HTTP_PORT, UDP_PORT, UDP_BROADCAST, TEMP_DIR, UPLOADS_DIR } = require('./config/constants');
const { ensureDir } = require('./utils/fileUtils');
const { createServer: createUdpServer } = require('./services/udpDiscovery');
const handleRequest = require('./routes/index');
const logger = require('./utils/logger');

// Создаём необходимые директории
ensureDir(TEMP_DIR);
ensureDir(UPLOADS_DIR);

// Запускаем UDP сервер (для поиска устройств)
createUdpServer(UDP_PORT, UDP_BROADCAST);

// Запускаем HTTP сервер
const httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT, () => {
    logger.info(`HTTP server listening on port ${HTTP_PORT}`);
});