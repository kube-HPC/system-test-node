#!/bin/bash
echo Deploy to kubernetes
helm repo add hkube-dev http://hkube.io/helm/dev/
helm repo update
envsubst < ./travis/values-pub-template.yml > /tmp/pub.yml
helm search repo hkube
helm upgrade -i hkube -f /tmp/pub.yml hkube-dev/hkube
helm ls --all

