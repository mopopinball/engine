const fs = require('fs');

/**
 * Read/write the config file.
 */
class Config {
    static read() {
        return JSON.parse(fs.readFileSync(__dirname + '/../../config.json', 'utf-8'));
    }
}

module.exports = Config;
