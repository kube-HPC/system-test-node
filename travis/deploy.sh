#!/bin/bash
set -ex

domain="$1"
# pass the context inline on every helm call - the runner's kubeconfig is shared,
# so switching current-context would affect other jobs
context="${2:-$KUBE_CONTEXT}"
echo Deploy to kubernetes
helm repo add hkube-dev http://"$domain"/helm/dev/
helm repo update
envsubst < ./travis/values-pub-template.yml > /tmp/pub.yml
helm search repo hkube
helm --kube-context "$context" upgrade -i hkube -f /tmp/pub.yml hkube-dev/hkube
helm --kube-context "$context" ls --all
echo end Of Script
