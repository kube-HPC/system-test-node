#!/bin/bash
domain = "$1"
echo Deploy to kubernetes
helm repo add hkube-dev http://"$domain"/helm/dev/
helm repo update
envsubst < ./travis/values-pub-template.yml > /tmp/pub.yml
helm search repo hkube
helm upgrade -i hkube -f /tmp/pub.yml hkube-dev/hkube
helm ls --all

