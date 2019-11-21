require('dotenv').config()

const baseUrl = process.env.BASE_URL;
const config = {
    apiServerUrl: process.env.API_URL || `${baseUrl}/hkube/api-server/api/v1`,
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || `${baseUrl}/system/elasticsearch`,
    jagearApiUrl: process.env.API_URL || `${baseUrl}/hkube/monitor-server/`,
    reject_selfSigned: false,
    baseUrl
}
if (!config.reject_selfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
module.exports = config;