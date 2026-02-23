// Простой логгер с выводом в консоль и опционально в файл
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../server.log');

function log(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${level}] ${args.join(' ')}`;
    console.log(message);
    // можно дописать в файл асинхронно
    fs.appendFile(logFile, message + '\n', (err) => {
        if (err) console.error('Log write error:', err);
    });
}

module.exports = {
    info: (...args) => log('INFO', ...args),
    warn: (...args) => log('WARN', ...args),
    error: (...args) => log('ERROR', ...args),
    debug: (...args) => log('DEBUG', ...args)
};