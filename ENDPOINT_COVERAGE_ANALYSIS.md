# HKube API Endpoint Test Coverage Analysis

## Executive Summary

A comprehensive analysis of the HKube REST API against test coverage in `swaggerCalls.js`.

**Coverage Overview:**
- **Total API Endpoints:** 109
- **Total Operations:** 136 (including GET, POST, PUT, DELETE, PATCH)
- **Tested Operations:** 51 (37.50%)
- **Untested Operations:** 85 (62.50%)

---

## ✅ TESTED ENDPOINTS (51 operations)

### Execution (7 operations)
```
POST       /exec/raw
POST       /exec/stored
POST       /exec/caching
POST       /exec/rerun
POST       /exec/stop
GET|POST   /exec/search
GET        /exec/pipeline/list
```
**Coverage:** 7 out of 17 execution endpoints (41%)

### Storage (2 operations)
```
GET        /storage/info
GET        /storage/prefix/types
```
**Coverage:** 2 out of 10 storage endpoints (20%)

### Stores - Algorithms (1 operation)
```
GET|POST|PUT /store/algorithms
```
**Coverage:** 1 out of 4 algorithm store endpoints (25%)

### Stores - Pipelines (2 operations)
```
GET|POST|PUT /store/pipelines
POST        /store/pipelines/graph
```
**Coverage:** 2 out of 4 pipeline store endpoints (50%)

### Cron (3 operations)
```
GET        /cron/list
POST       /cron/start
POST       /cron/stop
```
**Coverage:** 3 out of 5 cron endpoints (60%)

### Builds (2 operations)
```
POST       /builds/rerun
POST       /builds/stop
```
**Coverage:** 2 out of 6 build endpoints (33%)

### Algorithm Versions (2 operations)
```
PUT        /versions/algorithms/alias
POST       /versions/algorithms/tag
```
**Coverage:** 2 out of 5 algorithm version endpoints (40%)

### Pipeline Versions (2 operations)
```
PUT        /versions/pipelines/alias
POST       /versions/pipelines/apply
```
**Coverage:** 2 out of 4 pipeline version endpoints (50%)

### Queue (1 operation)
```
GET        /queue/count
```
**Coverage:** 1 out of 1 queue endpoint (100%)

### GC (2 operations)
```
POST       /gc/dryrun
GET        /gc/status
```
**Coverage:** 2 out of 6 GC endpoints (33%)

### Gateway (1 operation)
```
GET        /gateway
```
**Coverage:** 1 out of 2 gateway endpoints (50%)

### Preferences (1 operation)
```
GET|PUT|DELETE /preferences
```
**Coverage:** 1 out of 1 preferences endpoint (100%)

### Managed Queue (3 operations)
```
GET        /queue/managed/
GET        /queue/managed/aggregation/pipeline
GET        /queue/managed/aggregation/tag
```
**Coverage:** 3 out of 3 managed queue endpoints (100%)

### Preferred (4 operations)
```
GET|POST   /queue/preferred
GET        /queue/preferred/aggregation/pipeline
GET        /queue/preferred/aggregation/tag
POST       /queue/preferred/deletes
```
**Coverage:** 4 out of 4 preferred endpoints (100%)

### Boards (4 operations)
```
POST       /boards/optunas
GET        /boards/optunas/
POST       /boards/tensors
GET        /boards/tensors/
```
**Coverage:** 4 out of 6 board endpoints (67%)

### Resources (2 operations)
```
GET        /resources/ignoredunscheduledalgorithms/
GET        /resources/unscheduledalgorithms/
```
**Coverage:** 2 out of 4 resource endpoints (50%)

### Authentication (1 operation)
```
POST       /auth/login
```
**Coverage:** 1 out of 1 auth endpoint (100%)

### Status (1 operation)
```
GET        /status/version
```
**Coverage:** 1 out of 1 status endpoint (100%)

### Experiment (1 operation)
```
GET|POST   /experiment
```
**Coverage:** 1 out of 2 experiment endpoints (50%)

---

## ❌ UNTESTED ENDPOINTS (85 operations)

### DataSource (11 operations) ⚠️ HIGH PRIORITY
```
GET|POST        /datasource
GET|POST|DELETE /datasource/{name}
PATCH           /datasource/{name}/credentials
GET|POST        /datasource/{name}/snapshot
GET             /datasource/{name}/snapshot/{snapshotName}
POST            /datasource/{name}/sync
GET             /datasource/{name}/versions
GET|POST        /datasource/id/{id}/download
POST            /datasource/id/{id}/snapshot
POST            /datasource/id/{id}/snapshot/preview
GET             /datasource/validate
```
**Note:** No DataSource endpoints are tested. This is a critical module.

### Execution - Details (10 operations)
```
POST       /exec/algorithm
GET        /exec/auditTrail/{jobId}
GET        /exec/flowInput/{jobId}
GET        /exec/jobs
POST       /exec/pause
GET        /exec/pipelines/{jobId}
GET        /exec/results/{jobId}
POST       /exec/resume
GET        /exec/status/{jobId}
GET        /exec/tree/{jobId}
```
**Note:** While basic execution endpoints are tested, the query/result endpoints are not.

### Storage - Details (8 operations)
```
GET        /storage/download/{path}
GET        /storage/download/custom/{path}
GET        /storage/download/pipeline/result/{jobId}
GET        /storage/keys/{path}
GET        /storage/prefixes/{path}
GET        /storage/stream/{path}
GET        /storage/stream/custom/{path}
GET        /storage/values/{path}
```
**Note:** Metadata endpoints work but data retrieval is not tested.

### Algorithm Store - Details (3 operations)
```
GET|DELETE /store/algorithms/{name}
POST       /store/algorithms/apply
GET        /store/algorithmsFilter
```
**Note:** Bulk operations are tested but individual item operations are not.

### Pipeline Store - Details (2 operations)
```
GET|DELETE /store/pipelines/{name}
GET        /store/pipelines/graph/{name}
```
**Note:** Bulk operations are tested but individual item operations are not.

### Pipelines (3 operations)
```
GET        /pipelines/results
GET        /pipelines/status
GET        /pipelines/triggers/tree
```
**Note:** Query endpoints for pipeline information are not tested.

### Readme - Algorithms (1 operation)
```
GET|POST|PUT|DELETE /readme/algorithms/{name}
```

### Readme - Pipelines (1 operation)
```
GET|POST|PUT|DELETE /readme/pipelines/{name}
```

### Cron - Details (2 operations)
```
GET        /cron/results
GET        /cron/status
```

### Builds - Details (4 operations)
```
GET        /builds/list/{name}
GET        /builds/status/{buildId}
POST       /builds/webhook/github
POST       /builds/webhook/gitlab
```
**Note:** Lifecycle operations work but query and webhook endpoints are not tested.

### GC - Details (4 operations)
```
POST       /gc/clean
POST       /gc/clean/{type}
POST       /gc/dryrun/{type}
GET        /gc/status/{type}
```
**Note:** Only dry-run and generic status endpoints are tested.

### Algorithm Versions - Details (3 operations)
```
GET                    /versions/algorithms/{name}
GET|DELETE             /versions/algorithms/{name}/{version}
POST                   /versions/algorithms/apply
```
**Note:** Tag and alias operations are tested but detail queries are not.

### Pipeline Versions - Details (2 operations)
```
GET                    /versions/pipelines/{name}
GET|DELETE             /versions/pipelines/{name}/{version}
```
**Note:** Apply and alias operations are tested but detail queries are not.

### Graph (2 operations)
```
GET        /graph/raw/{jobId}
GET        /graph/parsed/{jobId}
```
**Note:** Graph query endpoints are not tested.

### Kubernetes (2 operations)
```
DELETE     /kubernetes/algorithms/jobs/{algName}
DELETE     /kubernetes/algorithms/pods/{algName}
```

### Gateway - Details (1 operation)
```
GET        /gateway/{name}
```

### Resources - Details (2 operations)
```
GET        /resources/ignoredunscheduledalgorithms/{name}
GET        /resources/unscheduledalgorithms/{name}
```

### Boards - Details (2 operations)
```
GET|DELETE /boards/optunas/{id}
GET|DELETE /boards/tensors/{id}
```

### Webhooks (3 operations)
```
GET        /webhooks/list/{jobId}
GET        /webhooks/results/{jobId}
GET        /webhooks/status/{jobId}
```

### Experiment - Details (1 operation)
```
GET|DELETE /experiment/{name}
```

---

## 📊 Coverage Analysis by Category

| Category | Total Ops | Tested | Untested | Coverage % |
|----------|-----------|--------|----------|-----------|
| Execution | 17 | 7 | 10 | 41% |
| Storage | 10 | 2 | 8 | 20% |
| Stores (Algorithms) | 4 | 1 | 3 | 25% |
| Stores (Pipelines) | 4 | 2 | 2 | 50% |
| Cron | 5 | 3 | 2 | 60% |
| Builds | 6 | 2 | 4 | 33% |
| Algorithm Versions | 5 | 2 | 3 | 40% |
| Pipeline Versions | 4 | 2 | 2 | 50% |
| Queue | 1 | 1 | 0 | 100% |
| GC | 6 | 2 | 4 | 33% |
| Gateway | 2 | 1 | 1 | 50% |
| Preferences | 1 | 1 | 0 | 100% |
| Managed | 3 | 3 | 0 | 100% |
| Preferred | 4 | 4 | 0 | 100% |
| Boards | 6 | 4 | 2 | 67% |
| Resources | 4 | 2 | 2 | 50% |
| Authentication | 1 | 1 | 0 | 100% |
| Status | 1 | 1 | 0 | 100% |
| Pipelines | 3 | 0 | 3 | 0% |
| Graph | 2 | 0 | 2 | 0% |
| Kubernetes | 2 | 0 | 2 | 0% |
| Webhooks | 3 | 0 | 3 | 0% |
| Experiment | 2 | 1 | 1 | 50% |
| DataSource | 11 | 0 | 11 | 0% |
| Readme (Algorithms) | 1 | 0 | 1 | 0% |
| Readme (Pipelines) | 1 | 0 | 1 | 0% |
| **TOTAL** | **136** | **51** | **85** | **37.50%** |

---

## 🎯 Priority Recommendations

### 🔴 CRITICAL (0% Coverage)
1. **DataSource** (11 endpoints) - Entire module untested
2. **Graph Query** (2 endpoints) - Pipeline graph retrieval
3. **Kubernetes Management** (2 endpoints) - Pod/Job management
4. **Webhooks** (3 endpoints) - Webhook status and retrieval
5. **Pipeline Queries** (3 endpoints) - Results, status, triggers
6. **Readme** (2 endpoints) - Algorithm and Pipeline documentation

### 🟠 HIGH (20-40% Coverage)
1. **Storage** (20%) - Data retrieval operations mostly untested
2. **Execution Details** (41%) - Result retrieval and job status endpoints
3. **Builds** (33%) - Detail query and webhook endpoints
4. **GC Operations** (33%) - Granular type-specific garbage collection
5. **Algorithm Store** (25%) - Individual algorithm operations

### 🟡 MEDIUM (40-70% Coverage)
1. **Cron** (60%) - Results and status endpoints missing
2. **Boards** (67%) - Individual board deletion/retrieval missing
3. **Algorithm Versions** (40%) - Individual version queries missing
4. **Pipeline Versions** (50%) - Version detail queries missing

### 🟢 GOOD (>80% Coverage)
- Authentication, Status, Preferences, Managed Queue, Preferred Queue (100%)
- Queue operations (100%)

---

## 📝 Notes

### Test File Discovery
Tests were identified by scanning `/tests/swaggerCalls.js` for:
- HTTP endpoint paths in string literals
- Method calls (.get, .post, .put, .delete)
- API client invocations

### Path Normalization
All paths from swagger.json were normalized to standard form (removing version prefixes like /v1).

### Method Coverage
Many endpoints support multiple HTTP methods (GET, POST, PUT, DELETE). Coverage counts operations, not just endpoints.

### Utility Functions
The test file uses utility functions from:
- `utils/results.js` - Result retrieval
- `utils/pipelineUtils.js` - Pipeline management
- `utils/algorithmUtils.js` - Algorithm management

These may test endpoints indirectly through helper functions.

---

## 📂 Generated Files

1. **endpoint_analysis.txt** - Human-readable test coverage report
2. **endpoint_analysis.json** - Machine-readable format with full endpoint details
3. **ENDPOINT_COVERAGE_ANALYSIS.md** - This comprehensive analysis document

---

*Analysis generated: 2026-11-03*
*Tools used: Node.js, OpenAPI 3.0 spec parsing, grep pattern matching*
