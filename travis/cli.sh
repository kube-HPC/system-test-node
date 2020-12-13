echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/download/$(curl -s https://api.github.com/repos/kube-HPC/hkubectl/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')/hkubectl-linux \
&& chmod +x hkubectl 
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo path before 
echo $PATH
export PWD=`/bin/pwd`
export PATH=${PWD}:${PATH}
echo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo path After 
echo $PATH
echo ~~~~~~~~~~~~~~~~~~~~~~mkdir -p ~/.hkube~~~~~~~~~~~~~~~~~~~~~~~~~
mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "https://test.hkube.io",
  "rejectUnauthorized": false
}
EOF
echo ~~~~~~~~~~~~~~~~~~~~~~~ls ~/.hkube -a~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo ls ~/.hkube -a
ls ~/.hkube -a
echo ~~~~~~~~~~~~~~~~~~~which hkubectl~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo which hkubectl
which hkubectl
echo ~~~~~~~~~~~~~~~~~hkubectl --help~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
echo  hkubectl --help
hkubectl --help
#&& sudo mv hkubectl /usr/local/bin/
echo ~~~~~~~~~~~~~algorithm get green-alg~~~~~~~~~~~~~~~~~~~~~~~
hkubectl algorithm get green-alg --json
echo ~~~========================================================~~~~~
#export BASE_URL=https://${KUBERNETES_MASTER_IP}
#export WEBHOOK_URL=${WEBHOOK_MASTER_URL}
#npm run cliTests
