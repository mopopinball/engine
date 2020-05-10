const spawnSync = require('child_process').spawnSync;
const logger = require('../system/logger');

/**
 * An abstract PIC.
 */
class Pic {
    programHex(pathToHexFile) {
        // todo
        const result = spawnSync('picpgm', ['-p', pathToHexFile], {stdio: 'pipe', encoding: 'utf-8'});
        logger.info(result.stdout);
        return result;
    }

    compareHex(pathToHexFile) {
        // todo
    }
}

module.exports = Pic;
