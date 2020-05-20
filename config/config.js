require('dotenv').config()
const webhookUrl = process.env.WEDHOOK_URL;
const baseUrl = process.env.BASE_URL;
const httpUrl = baseUrl.replace("https", "http")
const config = {
    apiServerUrl: process.env.API_URL || `${baseUrl}/hkube/api-server/api/v1`,
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || `${baseUrl}/system/elasticsearch/`,
    jagearApiUrl: process.env.API_URL || `${httpUrl}:30086`,
    podsApiUrl: process.env.API_URL || `${baseUrl}/hkube/monitor-server/pods/`,
    reject_selfSigned: false,
    baseUrl,
    webhookUrl
}
if (!config.reject_selfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
module.exports = config;