const baseUrl = process.env.BASE_URL || 'https://10.32.10.40';
const config = {
    apiServerUrl: process.env.API_URL || `${baseUrl}/hkube/api-server/api/v1`,
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || `${baseUrl}/system/elasticsearch`,
    reject_selfSigned: false,
    baseUrl
}
if (!config.reject_selfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
module.exports = config;