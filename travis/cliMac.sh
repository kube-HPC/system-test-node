echo Running tests
echo start download hkubectl

curl -Lo hkubectl https://github.com/kube-HPC/hkubectl/releases/latest/download/hkubectl-macos \
&& chmod +x hkubectl

echo hkubectl version:
./hkubectl --version
echo ~~~========================================================~~~~~
