#!/bin/bash

curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir -p ./bin
echo "export PATH=$PWD/bin:$PATH" > setPath
source ./setPath
mv ./kubectl $PWD/bin/kubectl
mkdir -p ~/.kube/
envsubst < ./kube-config-template.yml > ~/.kube/config
kubectl cluster-info
curl -LO https://storage.googleapis.com/kubernetes-helm/helm-v2.14.3-linux-amd64.tar.gz
tar -zxvf helm-v2.14.3-linux-amd64.tar.gz
mv linux-amd64/helm $PWD/bin/helm
helm init --client-only
