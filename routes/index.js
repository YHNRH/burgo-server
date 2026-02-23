const url = require('url');
const devices = require('./devices');
const audio = require('./audio');
const command = require('./command');
const logger = require('../utils/logger');

async function handleRequest(req, res) {
    const queryData = url.parse(req.url, true);
    const pathname = queryData.pathname;
    
    logger.debug(`${req.method} ${pathname}`);
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    try {
        if (pathname === '/api/getudp' || pathname === '/api/switchstate' || pathname === '/api/updatedevice') {
            await devices.handle(req, res, queryData);
        } else if (pathname === '/api/upload' || pathname === '/api/upload_raw' || pathname.startsWith('/api/sounds')) {
            await audio.handle(req, res, queryData);
        } else if (pathname === '/api/command') {
            await command.handle(req, res);
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (err) {
        logger.error('Request handler error:', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

module.exports = handleRequest;