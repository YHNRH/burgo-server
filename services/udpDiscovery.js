const dgram = require('dgram');
const logger = require('../utils/logger');

let udpServer;
let discoverResult = [];

function createServer(port, broadcastAddr) {
    udpServer = dgram.createSocket('udp4');
    
    udpServer.on('error', (err) => {
        logger.error('UDP server error:', err.stack);
        udpServer.close();
    });
    
    udpServer.on('message', (msg, rinfo) => {
        logger.debug(`UDP message from ${rinfo.address}:${rinfo.port}: ${msg}`);
        try {
            const obj = JSON.parse(msg.toString());
            obj.address = rinfo.address;
            discoverResult.push(obj);
        } catch (e) {
            // не JSON – игнорируем
        }
    });
    
    udpServer.on('listening', () => {
        const addr = udpServer.address();
        logger.info(`UDP server listening on ${addr.address}:${addr.port}`);
        udpServer.setBroadcast(true);
    });
    
    udpServer.bind(port);
    return udpServer;
}

function discoverDevices(timeout = 200) {
    return new Promise((resolve) => {
        const message = 'discover';
        discoverResult = [];
        udpServer.send(message, 0, message.length, port, broadcastAddr, () => {});
        setTimeout(() => resolve(discoverResult), timeout);
    });
}

module.exports = { createServer, discoverDevices };