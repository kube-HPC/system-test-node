echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/latest/download/hkubectl-linux \
&& chmod +x hkubectl 

# Didn't work as expected even though the file was created, cli failed to authenticate (Now it uses hkubectl config via the cliTests)
# mkdir -p ~/.hkube
# cat <<EOF >~/.hkube/.hkuberc
# {
#   "endpoint": "${HKUBE_URL}",
#   "rejectUnauthorized": false,
#   "username": "${KEYCLOAK_DEV_USER}",
#   "password": "${KEYCLOAK_DEV_PASS}"
# }
# EOF

echo hkubectl version:
./hkubectl --version
echo ~~~========================================================~~~~~
