echo Running tests
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
export GitHub_Token=${GIT_TOKEN}
npm run algorithmBuild
