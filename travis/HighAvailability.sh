echo Running tests
echo start download hkubectl
export BASE_URL=https://${KUBERNETES_MASTER_IP}
export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/download/$(curl -s https://api.github.com/repos/kube-HPC/hkubectl/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')/hkubectl-linux \
&& chmod +x hkubectl 
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo path before 
echo $PATH
export PWD = `/bin/pwd`
export PATH=${PWD}:${PATH}
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo path After 
echo $PATH
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "https://test.hkube.io",
  "rejectUnauthorized": false
}
EOF
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo ls ~/.hkube -a
ls ~/.hkube -a
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo which hkubectl
which hkubectl
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo  hkubectl --help
hkubectl --help
#&& sudo mv hkubectl /usr/local/bin/
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm run HighAvailability
