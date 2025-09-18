#!/bin/bash
set -ex

domain="$1"
echo Deploy to kubernetes
helm repo add hkube-dev http://"$domain"/helm/dev/
helm repo update
envsubst < ./travis/values-pub-template.yml > /tmp/pub.yml
helm search repo hkube
helm upgrade -i hkube -f /tmp/pub.yml hkube-dev/hkube || {
  echo "Helm deployment failed!"
  exit 1
}
helm ls --all
echo end Of Script
