echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/download/$(curl -s https://api.github.com/repos/kube-HPC/hkubectl/releases/latest | grep -oP '"tag_name": "\K(.*)(?=")')/hkubectl-win.exe \
&& chmod +x hkubectl 

hkubectl config set endpoint ${HKUBE_URL}

hkubectl config set rejectUnauthorized false
echo ~~~~~~~~~~~~~algorithm get green-alg~~~~~~~~~~~~~~~~~~~~~~~
./hkubectl --version
./hkubectl algorithm get green-alg --json
echo ~~~========================================================~~~~~
