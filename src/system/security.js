const Utils = require('./utils');

/**
 * Machine security.
 */
class Security {
    constructor(system) {
        if (system === '80' || system === '80a') {
            Security.pinCode = Utils.getRandomInteger(1000, 10000);
        }
        else {
            Security.pinCode = Utils.getRandomInteger(100000, 999999);
        }
    }

    static getPinCode() {
        return Security.pinCode;
    }
}

module.exports = Security;
