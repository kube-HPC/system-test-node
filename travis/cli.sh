echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/latest/download/hkubectl-linux \
&& chmod +x hkubectl 

mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "${HKUBE_URL}",
  "rejectUnauthorized": false,
  "username": "${KEYCLOAK_DEV_USER}",
  "password": "${KEYCLOAK_DEV_PASS}"
}
EOF

echo ~~~~~~~~~~~~~algorithm get green-alg~~~~~~~~~~~~~~~~~~~~~~~
./hkubectl --version
./hkubectl algorithm get green-alg --json
echo ~~~========================================================~~~~~
