echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/latest/download/hkubectl-macos \
&& chmod +x hkubectl

# Reason for comment at cli.sh (now does it via cliTests with hkubectl config)
# mkdir -p ~/.hkube
# cat <<EOF >~/.hkube/.hkuberc
# {
#   "endpoint": "${HKUBE_URL}",
#   "rejectUnauthorized": false
# }
# EOF

echo hkubectl version:
./hkubectl --version
echo ~~~========================================================~~~~~
