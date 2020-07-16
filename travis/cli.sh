echo Running tests
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/download/$(curl -s https://api.github.com/repos/kube-HPC/hkubectl/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')/hkubectl-linux \
&& chmod +x hkubectl 
echo "export PATH=$PWD:$PATH" > setPath
mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "https://test.hkube.io",
  "rejectUnauthorized": false
}
EOF
npm run clitest

#&& sudo mv hkubectl /usr/local/bin/

npm run cliTests
