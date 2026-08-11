# Proposal: move `CI-MAIN` (`.github/workflows/main.yml`) to a self-hosted runner

Status: **proposal only — no workflow files changed yet.**
Reference implementation: `hkube/.github/workflows/deploy.yml` (`deploy` job) +
`hkube/docs/self-hosted-runner-setup.md`.

---

## 1. Goal

Run the nightly system tests from a self-hosted runner that sits inside the cluster VPC and
already holds a kubeconfig on disk, instead of GitHub-hosted `ubuntu-latest` runners that
rebuild a kubeconfig from the `TEST_KUBECONFIG` secret on every job.

Benefits (same as hkube `deploy`):
- No cluster kubeconfig stored as a GitHub secret.
- Cluster API server does not need to accept GitHub's egress ranges — only the runner SG.
- Faster startup (no per-job tool download), stable egress IP.

---

## 2. Current state inventory

### 2.1 Jobs and what each actually needs

| Job | Command | Needs kubeconfig? | Needs node/npm? | Other tooling |
|---|---|---|---|---|
| `Deployment` | `./travis/deploy.sh <domain>` | yes (`helm upgrade`) | no | `helm`, `envsubst`, `curl` |
| `SwaggerTests` | `npm test` | no (creates one, never uses it) | yes | – |
| `GraphQLTests` | `npm run graphql` | no (same) | yes | – |
| `PipelineTests` | `npm run pipelinetest` | no (same) | yes | – |
| `NodeTests` | `npm run nodetest` | **yes** (`utils/kubeCtl.js`) | yes | – |
| `JagearTests` | `npm run jageartest` | no (same) | yes | – |
| `CodeApiTests` | `npm run codeApiTests` | no (same) | yes | – |
| `HkubeCliTests` | `./travis/cli.sh` + `npm run cliTests` | **yes** | yes | `curl`, writable `$HOME/.hkube` |
| `DatsourceTests` | `npm run dataSourceTest` | no (env passed, unused by the test path) | yes | – |
| `AlgorithmTests` | `npm run algorithmtest` | **yes** (`utils/kubeCtl.js`) | yes | – |
| `StreamingTests` | `npm run streaming` | no (k8s client is commented out) | yes | – |
| `HighAvailability` | `npm run HighAvailability` | **yes** (`utils/kubeCtl.js`) | yes | – |

Kubeconfig consumers in code:
- `utils/kubeCtl.js` → `kubeconfig.loadFromFile(process.env.K8S_CONFIG_PATH)` and
  `new Client({ backend, version: process.env.K8S_VERSION })`.
- `utils/kubernetes.js` → `kubernetesClient.config.fromKubeconfig()` (reads `$KUBECONFIG`).
- `travis/deploy.sh` → `helm upgrade` (reads `$KUBECONFIG`).

So **both** `KUBECONFIG` and `K8S_CONFIG_PATH` must point at a valid file, and
`K8S_VERSION` (currently `1.13`) must stay — it is a client API version, not a secret.

### 2.2 Scripts that will run on the runner

| Script | What it does | Self-hosted impact |
|---|---|---|
| `travis/deploy.sh` | `helm repo add hkube-dev http://$domain/helm/dev/`, `envsubst < travis/values-pub-template.yml`, `helm upgrade -i hkube` | needs `helm` + `gettext-base` on the box; needs HTTP egress to the helm repo host |
| `travis/cli.sh` | downloads `hkubectl-linux` from GitHub releases into `$PWD`, `chmod +x`, prints version | needs `curl` + GitHub egress; `$PWD` is added to `$GITHUB_PATH` so `spawn('hkubectl')` in `tests/cliTests.js` resolves |
| `travis/install.sh` | installs kubectl/helm, renders `travis/kube-config-template.yml` | **dead code for this workflow** — not referenced by `main.yml`, and the template file does not exist. Leave as-is or delete separately |
| `travis/*test*.sh` | thin wrappers exporting `BASE_URL` then `npm run …` | **not used** by `main.yml` (it calls `npm run …` directly). No change |

Note: `tests/cliTests.js` drives `hkubectl config` interactively and it writes
`~/.hkube/.hkuberc` in the runner user's home. On a persistent runner this file **survives
between runs** — see risk R4.

### 2.3 Secrets used today

| Secret | Used by | Verdict after migration |
|---|---|---|
| `TEST_KUBECONFIG` | every job (`create kubeconfig` step, 12×) | **DROP** — replaced by the on-disk kubeconfig |
| `TEST_KUBERNETES_MASTER_IP` | `BASE_URL` in every test job | **CONVERT to a repo variable** `vars.TEST_URL` (it is a hostname, not a secret; hkube `deploy.yml` already uses `vars.TEST_URL`) |
| `HKUBE_DOMAIN_RAW` | `Deployment` → `deploy.sh` arg | **KEEP** (or also convert to a variable — it is only a domain) |
| `HKUBE` | `HkubeCliTests` → `HKUBE_URL` env for `cli.sh` | **DROP** — the block in `cli.sh` that consumed it is commented out; the test uses `config.baseUrl` |
| `WEBHOOK_MASTER_URL` | all test jobs | KEEP |
| `KEYCLOAK_DEV_USER` / `KEYCLOAK_DEV_PASS` | all test jobs | KEEP |
| `KEYCLOAK_GUEST_USER` / `KEYCLOAK_GUEST_PASS` | Swagger + GraphQL only | KEEP (already correctly scoped) |
| `DOCKER_BUILD_PUSH_USERNAME/PASSWORD`, `IMAGE_PULL_USERNAME/PASSWORD` | `Deployment` → `values-pub-template.yml` | KEEP |
| `GIT_TOKEN` / `GITLAB_TOKEN` | `DatsourceTests` (`config.githubToken`/`gitlabToken`) | KEEP |

Also removable, per job: `K8S_CONFIG_PATH: /tmp/config` becomes a single shared value, and
the duplicated `KUBE_CONFIG_DATA` env on the `test` steps (`NodeTests`, `HkubeCliTests`,
`DatsourceTests`, `AlgorithmTests`, `StreamingTests`, `HighAvailability`) is pure noise —
nothing reads it.

---

## 3. Runner requirements

The existing `hkube-self-hosted` box (from `hkube/docs/self-hosted-runner-setup.md`) is
**not sufficient as-is** — that guide explicitly skips Node. Two options:

**Option A (recommended): extend the existing box** and give it a second label.
```bash
# as root on the runner
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs gettext-base curl
node -v && npm -v
```
Then in the runner's GitHub registration add the label `hkube-system-test`
(Settings → Actions → Runners → the runner → Labels), and target
`runs-on: [self-hosted, hkube-system-test]`.

**Option B: dedicated runner instance** for system tests (same IAM role / SG / SSM recipe,
`t3.medium`+, 30–50 GiB disk because `npm ci` + logs accumulate). Preferred if you want the
nightly suite to keep its job-level parallelism (see R1) — register 2–3 runners with the
same label.

Either way the runner must have:
- `node` 18.x + `npm` (or rely on `actions/setup-node@v4`, which needs `RUNNER_TOOL_CACHE`
  writable by the runner user)
- `kubectl`, `helm` v3, `curl`, `git`, `gettext-base` (`envsubst`)
- `/etc/hkube/kube/config` readable by the runner user, directory owned by it
  (the `config.lock` gotcha, FIX #2 in the hkube guide)
- egress to: GitHub, npm registry, the cluster API, `<HKUBE_DOMAIN_RAW>` (helm repo),
  and `BASE_URL` (ingress).

---

## 4. Proposed workflow changes

### 4.1 Replace the `create kubeconfig` step everywhere

Before (per job):
```yaml
      - name: create kubeconfig
        run: |
          echo "$KUBE_CONFIG_DATA" | base64 --decode > /tmp/config
          echo KUBECONFIG=/tmp/config >> $GITHUB_ENV
        env:
          KUBE_CONFIG_DATA: ${{ secrets.TEST_KUBECONFIG }}
```

After (per job):
```yaml
      - name: select kubeconfig context
        run: |
          # copy the shared kubeconfig to a per-job file so parallel jobs on the same
          # runner never fight over current-context / config.lock
          KUBECFG="$RUNNER_TEMP/kubeconfig-$GITHUB_RUN_ID-$GITHUB_JOB"
          install -m 600 /dev/null "$KUBECFG"
          cat /etc/hkube/kube/config > "$KUBECFG"
          kubectl --kubeconfig="$KUBECFG" config use-context "$KUBE_CONTEXT"
          echo "KUBECONFIG=$KUBECFG" >> $GITHUB_ENV
          echo "K8S_CONFIG_PATH=$KUBECFG" >> $GITHUB_ENV
        env:
          KUBE_CONTEXT: test-spot.hkube.org
```

This is a deliberate improvement over `hkube/deploy.yml`, which mutates the shared
`/etc/hkube/kube/config` with `kubectl config use-context`. That is safe there because
`deploy` is one job; here up to four jobs can run concurrently.

`K8S_CONFIG_PATH` is then set once per job instead of being hardcoded to `/tmp/config` on
individual `test` steps. `K8S_VERSION: 1.13` stays where it is needed.

Jobs that never touch k8s (`SwaggerTests`, `GraphQLTests`, `JagearTests`, `CodeApiTests`,
`PipelineTests`, `StreamingTests`, `DatsourceTests`) can drop the step entirely — proposed,
but flag if you'd rather keep it uniform.

### 4.2 Per-job header

```yaml
  SwaggerTests:
    runs-on: [self-hosted, hkube-system-test]
    timeout-minutes: 60          # self-hosted jobs otherwise hang until the 6h cap
    needs: Deployment
    steps:
      - uses: actions/checkout@v4     # v2 uses node16, deprecated on current runners
      - uses: actions/setup-node@v4   # only if node is not baked into the image
        with:
          node-version: 18
      - run: npm ci
```

### 4.3 Workflow-level additions

```yaml
concurrency:
  group: system-test-${{ github.ref }}
  cancel-in-progress: false
```
Prevents a manual `workflow_dispatch` run from colliding with the nightly cron on the same
cluster (they share one hkube installation, so overlapping runs corrupt each other's state).

### 4.4 `Deployment` job

Only the kubeconfig step changes; `./travis/deploy.sh ${{ secrets.HKUBE_DOMAIN_RAW }}` and
its four docker/registry secrets stay. Add back the `verify kubectl` (`kubectl cluster-info`)
step it already has — useful as a fail-fast on the runner.

### 4.5 `HkubeCliTests` job

```yaml
      - name: create hkubectl
        run: |
          ./travis/cli.sh
          echo $PWD >> $GITHUB_PATH
        # HKUBE_URL / KEYCLOAK_* removed: cli.sh no longer consumes them
      - name: reset hkubectl state
        run: rm -rf "$HOME/.hkube"   # persistent runner: avoid leaking last run's login
```

### 4.6 Cleanup step (all jobs that created a kubeconfig)

```yaml
      - name: cleanup
        if: always()
        run: rm -f "$KUBECONFIG"
```

---

## 5. Risks / things to decide

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Loss of parallelism.** `main.yml` fans out to 4 concurrent jobs. One self-hosted runner serializes them, roughly doubling wall-clock time for the nightly run. | Register 3–4 runners with the `hkube-system-test` label, or accept the slower nightly. |
| R2 | **Shared kubeconfig contention** (`config.lock`, `current-context` flipping between jobs). | Per-job kubeconfig copy in `$RUNNER_TEMP` (§4.1). |
| R3 | **Dirty workspace between runs.** `actions/checkout` runs `git clean -ffdx` by default, which removes the downloaded `hkubectl`, `logs/`, and any local `.env` — good. Do **not** set `clean: false`. | Keep default; add a periodic `docker/npm` cache prune cron on the box. |
| R4 | **`$HOME/.hkube` persists** across runs (written by `hkubectl config` in `cliTests.js`), so a test can pass using stale credentials. | `rm -rf $HOME/.hkube` before the CLI tests (§4.5). |
| R5 | **Disk fill** — `npm ci` per job + `_work` history on a 30 GiB box. | 50 GiB volume, or a weekly `rm -rf ~/actions-runner/_work/_temp/*` cron. |
| R6 | **Single point of failure** — if the runner is down the nightly silently queues instead of failing. | Job-level `timeout-minutes` + a queued-job alert; keep `ubuntu-latest` fallback for the pure-HTTP jobs if desired. |
| R7 | **Untrusted code on a persistent runner.** Self-hosted runners must not be used on `pull_request` from forks. `main.yml` is `schedule` + `workflow_dispatch` only, so this is fine today — do not add `pull_request` triggers to it later. | Documented here; repo setting "Require approval for all outside collaborators". |
| R8 | Other workflows still consume `TEST_KUBECONFIG`: `algoTest.yml`, `cliTest.yml`, `PipelineTests.only.yml`, `deploy.only.yml`, `hkubectl.only.yml`, `WindowsCliTest.yml`. | Do **not** delete the secret until those are migrated. `WindowsCliTest.yml` needs a Windows runner — keep it GitHub-hosted. |

---

## 6. Rollout plan

1. Prepare the runner (§3), verify as the runner user:
   `KUBECONFIG=/etc/hkube/kube/config kubectl config get-contexts && kubectl cluster-info`.
2. Add repo variable `TEST_URL` (value = current `TEST_KUBERNETES_MASTER_IP`).
3. Convert **one** job first — clone `main.yml`'s `SwaggerTests` into a throwaway
   `selfhosted.smoke.yml` (`workflow_dispatch` only) and run it.
4. Convert `Deployment` + the k8s-dependent jobs (`NodeTests`, `AlgorithmTests`,
   `HighAvailability`, `HkubeCliTests`) — these exercise the kubeconfig path.
5. Convert the remaining HTTP-only jobs.
6. Run the full nightly manually twice; compare durations and failures against the last
   GitHub-hosted run.
7. Migrate the `*.only.yml` workflows, then delete the `TEST_KUBECONFIG` and `HKUBE`
   secrets.

Rollback: revert `main.yml` — nothing outside the workflow file changes, and the secrets
stay in place until step 7.

---

## 7. Net diff summary for `main.yml`

- 12 × `create kubeconfig` step → 6 × `select kubeconfig context` step (removed from jobs
  that don't use k8s).
- `runs-on: ubuntu-latest` → `runs-on: [self-hosted, hkube-system-test]` (12 jobs).
- `actions/checkout@v2` → `@v4`; add `actions/setup-node@v4` (unless node is preinstalled).
- Remove `secrets.TEST_KUBECONFIG` (12), `secrets.HKUBE` (1), `K8S_CONFIG_PATH: /tmp/config`
  hardcodes (6), redundant `KUBE_CONFIG_DATA` on `test` steps (6).
- `secrets.TEST_KUBERNETES_MASTER_IP` → `vars.TEST_URL` (11).
- Add workflow-level `concurrency` and per-job `timeout-minutes`.
- Add `rm -rf $HOME/.hkube` to `HkubeCliTests` and an `if: always()` kubeconfig cleanup.

Confirm the runner label, whether Node will be baked in or installed via `setup-node`, and
how many runners you want (R1), and I'll apply the change.

---

# Appendix A — Implementation progress log

Last updated: 2026-08-11. Box preparation and runner installation are **complete**; the only
workflow file added so far is the temporary `selfhosted-smoke.yml` scaffolding.

## A.1 Decisions taken since the proposal was written

| Topic | Decision |
|---|---|
| Scope | **Full migration — all 12 jobs** of `main.yml` move to self-hosted. A hybrid (only the 5 kubeconfig-dependent jobs) was considered and rejected. |
| Runner scope | **Repo-scoped to `kube-HPC/system-test-node`.** hkube's `deploy.yml` is a *reference* for an already-migrated workflow only — it is not a consumer of this box and is out of scope. |
| Topology (R1) | **2 runners on a single `t3.medium`**, one per OS user (`ghrunner`, `ghrunner2`). Covers waves 2 and 4 fully, splits the 4-wide wave 3 into 2+2. Scaling to 4 is deferred until one full nightly produces real timings. |
| Labels | Both runners get **identical** labels `hkube-self-hosted,hkube-system-test`; only `--name` differs. Per-runner labels were rejected — head-of-line blocking, no failover, and no benefit since a runner executes one job at a time. |
| Node | **Baked into the box** (node v22.22.1, system-wide), not `actions/setup-node`. |
| npm | `npm ci --prefer-offline` against the shared cache at `/var/cache/npm`. `clean: false` on checkout was rejected — it would preserve stale `.env` / `hkubectl` and reintroduce R3/R4. |
| Shared kubeconfig | Group-writable `770` dir / `660` file, group `hkube-runners`. Jobs use the **per-job copy** pattern; see A.3 for why a stricter read-only lock was reverted. |

## A.2 Box facts discovered

- EC2 in region `il-central-1`, **private subnet** (`10.30.238.48`) — *not* the public-subnet
  topology described in `hkube/docs/self-hosted-runner-setup.md`. Egress goes via a
  TGW/NAT gateway at `10.30.238.1`.
- `t3.medium`: 2 vCPU, 3.7 GiB RAM, root fs 77 GiB with 73 GiB free → no volume resize needed
  (revises risk **R5** downward).
- ENI `ens5` is `mtu 9001` while the gateway advertises `mtu 8500`. Left unfixed on purpose:
  an 85 MiB download over IPv4 completed cleanly, proving MTU is **not** the cause of the npm
  failure. Demoted to low-priority hygiene.

## A.3 Completed on the runner box

| Step | What | Status |
|---|---|---|
| A | Verified disk / RAM / CPU headroom | done |
| B1 | Created group `hkube-runners`; added `ghrunner`; created `ghrunner2` | done |
| B2 | `/etc/hkube/kube` → `750`, `config` → `640`, group `hkube-runners` | superseded by B3 |
| B3 | **Revised.** First set `root:hkube-runners` `750`/`640` (read-only for runners). That breaks any job following hkube's pattern, because `kubectl config use-context` is a **write** — it persists `current-context` and creates `config.lock` in the directory. Final state: dir `770`, file `660`, group `hkube-runners`, writable by both runner users. The lock proved unnecessary: a job that copies the kubeconfig and runs `use-context` **on its own copy** is already immune to the shared file's `current-context`. | done |
| — | Per-job-copy pattern validated end to end: both users print `PERJOB_KUBECONFIG_OK` against context `test-spot.hkube.org`, `kubectl cluster-info` reachable | done |
| C | Toolchain verified for **both** users in a non-login env (`env -i PATH=...`): node v22.22.1, npm 9.2.0, git 2.53.0, kubectl v1.36.3, helm v3.21.3, envsubst, curl | done |
| D | 2 GiB `/swapfile` active + `fstab` entry + `vm.swappiness=10` (no swap previously; OOM-killer risk with 2 concurrent jobs) | done |
| E | Shared npm cache `/var/cache/npm`, mode `2775` setgid, group `hkube-runners`; both users configured | done |
| F | Both runners installed, registered and running as services: `system-test-node-1` (`ghrunner`) and `system-test-node-2` (`ghrunner2`), identical labels, `--work _work --unattended`. Units `actions.runner.kube-HPC-system-test-node.system-test-node-{1,2}.service` are active and enabled | done |
| G | `/usr/local/sbin/gh-runner-cleanup.sh` (loops over **both** `_work` dirs) + `gh-runner-cleanup.timer` (Sun 03:00 UTC, `Persistent=true`) + `/etc/cron.hourly/disk-guard` at 85% | done |

## A.4 npm registry — resolved 2026-08-11

`npm ci --prefer-offline` now succeeds on the box. Recorded here in case it recurs.

The original symptom: `registry.npmjs.org` reset **during the TLS handshake** — TCP connect
succeeded (`conn=0.008`), `tls=0.000000`, then `Recv failure: Connection reset by peer`, and
`npm ci` died mid-tarball with `ECONNRESET`. Evidence pointed at destination-specific
filtering rather than a general egress block:
- 85 MiB `hkubectl` download from `objects.githubusercontent.com` over IPv4 → `200`.
- DNS for `registry.npmjs.org` returns **only AAAA (IPv6)** records, so traffic may have been
  leaving over IPv6 and missing IPv4-only allow rules.

If it returns, the untried mitigation is forcing IPv4:
```bash
echo 'precedence ::ffff:0:0/96  100' | sudo tee -a /etc/gai.conf   # curl/getent
# node >= 17 ignores gai.conf ordering, so also:
#   <runner-dir>/.env  ->  NODE_OPTIONS=--dns-result-order=ipv4first
```
Other fallbacks: an internal npm mirror, or a warm `/var/cache/npm` plus `npm ci --offline`.

Egress destinations this workflow needs: `registry.npmjs.org`, `codeload.github.com`,
`github.com`, `api.github.com`, `*.actions.githubusercontent.com`,
`objects.githubusercontent.com`, `*.blob.core.windows.net`, plus `<HKUBE_DOMAIN_RAW>`:80,
`<BASE_URL>`:443 and the cluster API.

## A.5 Runner scope — resolved

**Repo-scoped registration** against `https://github.com/kube-HPC/system-test-node`. Both
runners are registered to that repo with identical labels and distinct names. hkube's
`deploy` job is out of scope for this box.

## A.6 Resume here — next steps

The box is fully prepared. Everything remaining is workflow work in this repo.

1. **Smoke test** — `.github/workflows/selfhosted-smoke.yml` (added, `workflow_dispatch`
   only). Two jobs with no `needs` between them, so they should land on *different*
   runners: `SmokeNoK8s` runs `npm test`; `SmokeK8s` exercises the per-job kubeconfig copy
   and runs `npm run nodetest`, the first suite that actually reads `K8S_CONFIG_PATH`
   through `utils/kubeCtl.js`. Delete the file once both pass.
2. **Repo variable** — create `TEST_URL` with the current value of
   `secrets.TEST_KUBERNETES_MASTER_IP`.
3. **Pilot `Deployment`** — migrate that job first: it needs no npm, so it isolates the
   kubeconfig change. Verify via `workflow_dispatch`.
4. **Migrate the remaining 11 jobs** per §4 / §7.
5. **Roll out** — two full manual nightlies, record per-job durations (feeds the deferred
   4-runner decision), then migrate the `*.only.yml` workflows and delete the
   `TEST_KUBECONFIG` and `HKUBE` secrets. `WindowsCliTest.yml` stays GitHub-hosted.

## A.7 Operational pitfalls learned (worth keeping)

- The SSM shell **silently swallows parts of multi-line pastes**. Issue one command per line
  and verify (`echo $?` or a re-check) — this bit us three times (`groupadd`/`useradd`,
  `chmod`, `swapon` all appeared to run but hadn't).
- `namei -l` run as `ssm-user` reports "Permission denied" on a `750` directory that user
  isn't a member of — that reflects the *invoking* user, not the target user. Use `sudo`.
- Fixing permissions on `/etc/hkube/kube` is useless if the parent `/etc/hkube` blocks
  traversal. Always check the whole path with `namei -l`.
- `rm` in `/tmp` fails for `ssm-user` on files owned by `ghrunner` (sticky bit) — use `sudo`.
- The runner systemd service does not source `.bashrc`/`.profile`; environment must go in
  `<runner-dir>/.env`.
- The GitHub runner refuses to configure or run as root — every command must be
  `sudo -u ghrunner…`.
- **There is more than one EC2 box.** A round was lost debugging "node/npm disappeared" on
  the wrong instance. Confirm `hostname` is `ip-10-30-238-48` before running anything.
- Pasting a literal `<VER>` placeholder makes bash treat `<` as input redirection. Use a
  shell variable instead.
- Files in `/etc/cron.hourly` must have **no dot** in the filename or `run-parts` skips them.
