require('dotenv').config()
const githubToken = process.env.GitHub_Token
const gitlabToken = process.env.Gitlab_Token
const webhookUrl = process.env.WEBHOOK_URL;
const baseUrl = process.env.BASE_URL;
const httpUrl = baseUrl.replace("https", "http")
const config = {
    apiServerUrl: process.env.API_URL || `${baseUrl}/hkube/api-server/api/v1`,
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || `${baseUrl}/system/elasticsearch/`,
    jagearApiUrl: process.env.API_URL || `${httpUrl}:30086`,
    reject_selfSigned: false,
    baseUrl,
    webhookUrl,
    githubToken,
    gitlabToken
}
if (!config.reject_selfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
module.exports = config;