const request = require('request');

function doRequest(url) {
    return new Promise((resolve, reject) => {
        request.get(url, (error, res, body) => {
            if (error) return reject(error);
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            resolve(body);
        });
    });
}

module.exports = { doRequest };