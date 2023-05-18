const EtcdClient = require('@hkube/etcd');
const Logger = require('@hkube/logger');

let log;

class Etcd {
    constructor() {
        this._etcd = null;
    }

    async init(options) {
        //log = Logger.GetLogFromContainer();
        this._etcd = new EtcdClient(options.etcd);
        //log.info(`Initializing etcd with options: ${JSON.stringify(options.etcd)}`);
    }

    async _getDiscoveryType(type) {
        return this._etcd.discovery.list({ serviceName: type });
    }

}

module.exports = new Etcd();