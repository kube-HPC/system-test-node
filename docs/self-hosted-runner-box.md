# hkube system-test-node — self-hosted runner box

**Instance:** — `t3.medium` (2 vCPU / 3.7 GiB), private
subnet, egress via TGW/NAT. Access: **SSM Session Manager only**. Root fs 77 GiB.

> There is more than one EC2 box. Confirm with `hostname` before touching anything.

## Runners

Two runners, **repo-scoped to `kube-HPC/system-test-node`**:

| Runner | OS user | Work dir |
|---|---|---|
| `system-test-node-1` | `ghrunner` | `/home/ghrunner/actions-runner/_work` |
| `system-test-node-2` | `ghrunner2` | `/home/ghrunner2/actions-runner/_work` |

Both have the **same labels** — `hkube-self-hosted`, `hkube-system-test`. This is
deliberate: they form a pool, and GitHub sends each job to whichever is idle. Do not give
them distinct labels — that reintroduces head-of-line blocking and removes failover.

```yaml
runs-on: [self-hosted, hkube-system-test]
```

Services are enabled and start on boot:

```bash
systemctl list-units 'actions.runner.*' --no-pager
sudo /home/ghrunner/actions-runner/svc.sh status
```

Never configure or run a runner as root — always `sudo -u ghrunner…`. The service does not
source `.bashrc`; environment variables go in `<runner-dir>/.env`.

## Kubeconfig

`/etc/hkube/kube/config` — `root:hkube-runners`, dir `770`, file `660`. Both runner users
are in `hkube-runners`. Context in use: `test-spot.hkube.org`.

**Jobs copy it, they don't mutate it.** Each job copies the file into `$RUNNER_TEMP` and
runs `kubectl --kubeconfig=<copy> config use-context …` there. Reason: `use-context` is a
*write* — it persists `current-context` and creates `config.lock` — which races when two
jobs run concurrently.

## Tooling (system-wide, verified for both users)

`node v22.22.1` · `npm 9.2.0` · `kubectl v1.36.3` · `helm v3.21.3` · `git 2.53.0` ·
`envsubst` · `curl`

```bash
sudo -u ghrunner2 env -i PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  bash -c 'node -v; npm -v; kubectl version --client | head -1; helm version --short'
```

- **Shared npm cache:** `/var/cache/npm` (`2775` setgid, group `hkube-runners`). Workflows
  use `npm ci --prefer-offline` so jobs reuse it instead of re-downloading.
- **Swap:** 2 GiB `/swapfile`, `vm.swappiness=10`. The box had none; with two concurrent
  jobs an `npm ci` spike would otherwise hit the OOM killer instead of just slowing down.

## Housekeeping

| What | Where | When |
|---|---|---|
| Workspace cleanup (both `_work` dirs) | `/usr/local/sbin/gh-runner-cleanup.sh` | `gh-runner-cleanup.timer`, Sun 03:00 UTC |
| Disk warning ≥85% | `/etc/cron.hourly/disk-guard` | hourly |

Cleanup prunes `_temp` older than 2 days, stray `kubeconfig-*` older than 1 day,
`node_modules` untouched for 7 days, then runs `npm cache verify` and
`journalctl --vacuum-time=14d`.

```bash
systemctl list-timers gh-runner-cleanup.timer --no-pager
journalctl -t gh-runner-cleanup -n 20 --no-pager
journalctl -t disk-guard -n 20 --no-pager
```

The nightly suite runs `30 22 * * 0-4` UTC — no overlap with cleanup.

## Gotchas

- The SSM shell **silently swallows parts of multi-line pastes**. Run one command per line
  and verify; use `nano -w` for multi-line files rather than heredocs.
- Check the **whole path** with `sudo namei -l` when debugging permissions — a `700` parent
  defeats correct permissions on a child.
- `/etc/cron.hourly` filenames must contain **no dot**, or `run-parts` skips them.
- `ens5` MTU is `9001` while the gateway advertises `8500`. Harmless today (large downloads
  succeed); if ever set to 1500 it needs a netplan file to survive reboot.
- The `/etc/fstab` swap entry has **not survived a reboot yet** — run
  `sudo findmnt --verify` before stopping or resizing the instance. There is no console
  access if boot fails.

## Scaling

2 runners today. The nightly's fan-out peaks at 4 for a single wave; the tail
(`AlgorithmTests` → `StreamingTests` → `HighAvailability`) is strictly serial, so more
runners buy little. Deferred until real per-job timings exist.

If scaling: `t3.medium` cannot host 4 (2 vCPU, and 4 × `npm ci` ≈ 3.2 GiB vs 3.7 GiB) →
`t3.xlarge` / `m5.xlarge`. It is additive — add `ghrunner3`/`ghrunner4` with the **same
labels** and extend `RUNNER_USERS` in the cleanup script. No existing runner needs
re-registration.
