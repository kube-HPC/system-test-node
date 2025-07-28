echo Running tests
echo start download hkubectl

curl.exe --output hkubectl --url https://github.com/kube-HPC/hkubectl/releases/download/v1.1.61/hkubectl-win.exe

echo ~~~~~~~~~~~~~algorithm get green-alg~~~~~~~~~~~~~~~~~~~~~~~
./hkubectl --version
./hkubectl algorithm get green-alg --json
echo ~~~========================================================~~~~~
