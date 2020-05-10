const spawn = require('child_process').spawnSync;
const uuidv4 = require('uuid/v4');
const logger = require('../util/logger');

/**
 * WiFi helpers.
 */
class Wlan {
    getStatus() {
        return spawn('wpa_cli', ['-i', 'wlan0', 'status'], {stdio: 'inherit'});
    }

    wpsSetup() {
        spawn('wpa_cli', ['-i', 'wlan0', 'wps_pbc'], {stdio: 'inherit'});
    }

    getIp() {
        const ifconig = this._getOutput('ifconfig');
        const ipRegex = /inet (\d+\.\d+\.\d+\.\d+)/g;
        const ips = [];
        let match = ipRegex.exec(ifconig);
        while (match) {
            ips.push(match[1]);
            match = ipRegex.exec(ifconig);
        }

        return ips
            .map((ip) => ip.trim())
            .filter((ip) => ip !== '127.0.0.1')[0];
    }

    getHostname() {
        return this._getOutput('hostnamectl', ['--static']).trim();
    }

    setHostname() {
        const hostname = this.getHostname();
        logger.debug(`Got hostname '${hostname}'`);
        if (hostname === 'raspberrypi') {
            const randomString = uuidv4().substr(0, 5);
            spawn('hostnamectl', ['set-hostname', `mopo-${randomString}`]);
        }
    }

    _getOutput(cmd, params) {
        return spawn(cmd, params, {stdio: 'pipe', encoding: 'utf-8'}).output[1];
    }
}

module.exports = Wlan;
