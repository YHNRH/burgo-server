const fs = require('fs');
const { SCENARIOS_PATH } = require('./constants');

let scenarios = [];

try {
    const data = fs.readFileSync(SCENARIOS_PATH, 'utf8');
    scenarios = JSON.parse(data).scenarios;
    scenarios.forEach(sc => {
        sc.compiled = sc.triggers.map(t => new RegExp(t.pattern, 'iu'));
    });
    console.log(`Loaded ${scenarios.length} scenarios`);
} catch (err) {
    console.warn('Failed to load scenarios.json:', err.message);
}

module.exports = scenarios;