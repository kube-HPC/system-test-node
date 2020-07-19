echo Running tests
echo start download hkubectl
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/download/$(curl -s https://api.github.com/repos/kube-HPC/hkubectl/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')/hkubectl-linux \
&& chmod +x hkubectl 
echo path before 
echo $PATH
echo "export PATH=$PWD:$PATH" > setPath
echo path before 
echo $PATH
mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "https://test.hkube.io",
  "rejectUnauthorized": false
}
EOF

echo ls
ls ~/.hkube -a

echo which hkubectl
which hkubectl

#&& sudo mv hkubectl /usr/local/bin/

npm run cliTests
