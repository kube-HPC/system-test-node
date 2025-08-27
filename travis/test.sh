echo Running tests
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}

echo "BASE_URL=$BASE_URL"
nslookup $(echo $BASE_URL | sed 's~https\?://~~')
curl -vk $BASE_URL/auth/login || true

npm test
