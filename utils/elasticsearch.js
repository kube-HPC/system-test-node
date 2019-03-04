const elasticsearch = require('elasticsearch');
const chai = require('chai');
const delay = require('delay');
const expect = chai.expect;
const config = require('../config/config');
let _client = null;
const getClient = () => {
    if (!_client) {
        _client = new elasticsearch.Client({
            host: config.elasticsearchUrl
        });
    }
    return _client;
}

const waitForLog = async (message, tags = {}, timeout = 5*60*1000, interval=1000) => {
    const client = getClient();

    const terms = Object.entries(tags).map(([k, v]) => ({ term: { [k]: v } }));
    terms.push({
        term: { 'message.keyword': message }
    });

    const query = {
        bool: {
            filter: terms
        }
    }
    const start = Date.now();
    do {
        process.stdout.write('.')
        const ret = await client.search({
            body: {
                query
            },
            index: 'logstash-*',
        });
        if (ret.hits.hits && ret.hits.hits[0]) {
            return ret.hits.hits[0];
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`timeout exceeded trying to get ${message} from logs`);


}
module.exports = {
    getClient,
    waitForLog
}