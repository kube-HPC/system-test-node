echo Running tests
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
export K8S_VERSION=1.13
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo ${K8S_VERSION}
echo ${BASE_URL}
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm run HighAvailability
