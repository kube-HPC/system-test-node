#!/bin/bash
echo Deploy to kubernetes
source ./setPath
helm repo add hkube-dev http://hkube.io/helm/dev/
helm repo update
envsubst < ./values-pub-template.yml > ~/pub.yml
helm upgrade --wait --timeout 600 -i hkube -f ~/pub.yml hkube-dev/hkube
helm ls

