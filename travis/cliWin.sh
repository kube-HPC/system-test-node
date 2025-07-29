echo Running tests
echo start download hkubectl

curl.exe --output hkubectl --url https://github.com/kube-HPC/hkubectl/releases/download/v1.1.61/hkubectl-win.exe

# Reason for comment at cli.sh (now does it via cliTests with hkubectl config)
# hkubectl config set endpoint ${HKUBE_URL}

# hkubectl config set rejectUnauthorized false

echo hkubectl version:
./hkubectl --version
echo ~~~========================================================~~~~~
