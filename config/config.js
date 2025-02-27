require('dotenv').config()
const githubToken = process.env.GitHub_Token
const gitlabToken = process.env.Gitlab_Token
const webhookUrl = process.env.WEBHOOK_URL;
const baseUrl = process.env.BASE_URL;
const packageJson = require(process.cwd() + '/package.json');
const httpUrl = baseUrl.replace("https", "http")
const config = {
    apiServerUrl: process.env.API_URL || `${baseUrl}/hkube/api-server/api/v1`,
    DsServerUrl: process.env.API_URL || `${baseUrl}/hkube/datasources-service/api/v1/datasource`,
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || `${baseUrl}/system/elasticsearch/`,
    jagearApiUrl: process.env.API_URL || `${httpUrl}:30086`,
    reject_selfSigned: false,
    baseUrl,
    webhookUrl,
    githubToken,
    gitlabToken,
    keycloakDevUser: process.env.KEYCLOAK_DEV_USER,
    keycloakDevPass: process.env.KEYCLOAK_DEV_PASS,
    keycloakGuestUser: process.env.KEYCLOAK_GUEST_USER,
    keycloakGuestPass: process.env.KEYCLOAK_GUEST_PASS
}

config.etcd = {
    protocol: 'http',
    host: process.env.ETCD_CLIENT_SERVICE_HOST || '127.0.0.1',
    port: process.env.ETCD_CLIENT_SERVICE_PORT || 4001,
    serviceName: packageJson.name
};

if (!config.reject_selfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
module.exports = config;