const pool = require('../config/database');
const { discoverDevices } = require('../services/udpDiscovery');
const { doRequest } = require('../utils/httpUtils'); // функция doRequest из вашего старого кода
const { escapeId, escapeName } = require('../utils/validators');
const logger = require('../utils/logger');

async function handle(req, res, queryData) {
    const pathname = queryData.pathname;
    
    if (pathname === '/api/getudp') {
        const devices = await discoverDevices();
        // Для каждого устройства получаем имя из БД
        let pending = devices.length;
        if (pending === 0) {
            res.end(JSON.stringify(devices));
            return;
        }
        devices.forEach((device, index) => {
            pool.query('SELECT NAME FROM device WHERE Id = ?', [device.Id], (err, result) => {
                if (err) {
                    logger.error('DB error:', err);
                } else if (result.length > 0) {
                    device.Name = result[0].NAME;
                }
                pending--;
                if (pending === 0) {
                    res.end(JSON.stringify(devices));
                }
            });
        });
    } else if (pathname === '/api/switchstate') {
        const esp = discoverResult.find(el => el.Id == queryData.query.Id);
        if (!esp) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Device not found' }));
            return;
        }
        try {
            const body = await doRequest(`http://${esp.address}/RELAY=${queryData.query.RELAY}`);
            res.end(JSON.stringify(body));
        } catch (err) {
            logger.error('Switchstate error:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
        }
    } else if (pathname === '/api/updatedevice') {
        const id = escapeId(queryData.query.Id);
        const name = escapeName(queryData.query.name);
        pool.query(
            'INSERT INTO device (ID, NAME) VALUES (?, ?) ON DUPLICATE KEY UPDATE NAME = ?',
            [id, name, name],
            (err) => {
                if (err) {
                    logger.error('Update device error:', err);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err.message }));
                } else {
                    res.end(JSON.stringify({ status: 'ok' }));
                }
            }
        );
    }
}

module.exports = { handle };