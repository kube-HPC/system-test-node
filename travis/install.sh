#!/bin/bash

curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir -p ./bin
echo "export PATH=$PWD/bin:$PATH" > setPath
source ./setPath
mv ./kubectl $PWD/bin/kubectl
mkdir -p ~/.kube/
envsubst < ./travis/kube-config-template.yml > ~/.kube/config
kubectl cluster-info
curl -LO https://get.helm.sh/helm-v3.3.0-rc.1-linux-amd64.tar.gz
tar -zxvf helm-v3.3.0-rc.1-linux-amd64.tar.gz
mv linux-amd64/helm $PWD/bin/helm
helm init --client-only
