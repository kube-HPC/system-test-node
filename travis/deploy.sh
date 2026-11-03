#!/bin/bash
set -ex

domain="$1"
# pass the context inline on every helm call - the runner's kubeconfig is shared,
# so switching current-context would affect other jobs
context="${2:-$KUBE_CONTEXT}"
echo Deploy to kubernetes
helm repo add hkube-dev https://"$domain"/helm/dev/
helm repo update
# per-job values file - /tmp is shared by several runner users on the host
values_file="$(mktemp "${RUNNER_TEMP:-/tmp}/pub.XXXXXX.yml")"
trap 'rm -f "$values_file"' EXIT
envsubst < ./travis/values-pub-template.yml > "$values_file"
helm search repo hkube
helm --kube-context "$context" upgrade -i hkube -f "$values_file" hkube-dev/hkube
helm --kube-context "$context" ls --all
echo end Of Script
