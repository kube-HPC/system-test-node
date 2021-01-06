echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/latest/download/hkubectl-macos \
&& chmod +x hkubectl

mkdir -p ~/.hkube
cat <<EOF >~/.hkube/.hkuberc
{
  "endpoint": "${HKUBE_URL}",
  "rejectUnauthorized": false
}
EOF

echo ~~~~~~~~~~~~~algorithm get green-alg~~~~~~~~~~~~~~~~~~~~~~~
./hkubectl --version
./hkubectl algorithm get green-alg --json
echo ~~~========================================================~~~~~
