const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config/constants');
const { ensureDir } = require('../utils/fileUtils');
const logger = require('../utils/logger');

async function handle(req, res, queryData) {
    const pathname = queryData.pathname;
    
    if (pathname === '/api/upload' || pathname === '/api/upload_raw') {
        const ext = pathname === '/api/upload_raw' ? '.raw' : '.wav';
        const fileName = `${pathname.split('/').pop()}_${Date.now()}${ext}`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        
        ensureDir(UPLOADS_DIR);
        
        const writeStream = fs.createWriteStream(filePath);
        req.pipe(writeStream);
        
        req.on('end', () => {
            logger.info(`File saved: ${filePath}`);
            res.end('OK');
        });
        
        req.on('error', (err) => {
            logger.error('File upload error:', err);
            writeStream.destroy();
            res.statusCode = 500;
            res.end('Error');
        });
    } else if (pathname.startsWith('/api/sounds')) {
        // извлечь путь к файлу, например "/api/sounds/ding.mp3" -> "./sounds/ding.mp3"
        const match = /\/api\/sounds\/(.+\.(mp3|wav))$/.exec(pathname);
        if (!match) {
            res.statusCode = 404;
            res.end('Not found');
            return;
        }
        const filepath = path.join(__dirname, '../sounds', match[1]);
        fs.readFile(filepath, (err, data) => {
            if (err) {
                logger.error('Sound file error:', err);
                res.statusCode = 404;
                res.end('Not found');
            } else {
                res.setHeader('Content-Type', 'audio/' + match[2]);
                res.setHeader('Content-Length', data.length);
                res.end(data);
            }
        });
    }
}

module.exports = { handle };