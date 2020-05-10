const Wlan = require('../src/system/wlan');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('network', () => {
    let network = null;
    beforeEach(() => {
        network = new Wlan();
    });

    describe('getIp', () => {
        it('returns the ip and filters loopback', () => {
            // setup
            sinon.stub(network, '_getOutput')
                .returns(`lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
                inet 127.0.0.1  netmask 255.0.0.0

                wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
                inet 192.168.1.3  netmask 255.255.255.0  broadcast 192.168.1.255`);

            // exercise
            const ips = network.getIp();

            // check
            expect(ips).to.be.equal('192.168.1.3');
        });
    });
});
