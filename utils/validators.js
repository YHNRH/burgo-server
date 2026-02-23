// Экранирование для SQL (можно использовать pool, который уже экранирует, но на всякий случай)
function escapeId(id) {
    return parseInt(id) || 0;
}

function escapeName(name) {
    // простейшая проверка
    if (typeof name !== 'string') return '';
    return name.replace(/[^a-zA-Zа-яА-Я0-9\s\-_]/g, '');
}

module.exports = { escapeId, escapeName };