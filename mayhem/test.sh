#!/usr/bin/env bash
#
# mayhem/test.sh — RUN fibjs's OWN test suites (upstream test/*_test.js, via `fibjs --test`) for the
# modules the fuzz targets reach, with the binary mayhem/build.sh produced.
# exit 0 = pass. EDIT per repo. PATCH-grade oracle: after an agent patches the source, the grader
# rebuilds (build.sh) then runs this. DELETE this file if the repo has no meaningful tests.
#
# IMPORTANT:
#  * Must assert BEHAVIOR/OUTPUT, not just exit status. The oracle has to check asserted values /
#    golden-output diffs / known-answer results — so a PATCH that "fixes" a bug by making the program
#    exit(0) (or any no-op) FAILS here. Running inputs and checking only "exit 0 / didn't crash" is
#    NOT a functional test (it's trivially reward-hackable) — use the project's real assertion suite.
#  * Do NOT build here — mayhem/build.sh already compiled the test suite (with the project's normal
#    flags). This script only RUNS the pre-built tests and reports counts. If the test runner is
#    missing, that's a build.sh bug — fail loudly rather than silently rebuilding.
#  * REQUIRED OUTPUT — a CTRF (https://ctrf.io) summary so Mayhem/the PATCH grader reads the counts:
#      - writes a CTRF JSON report to ${CTRF_REPORT:-$SRC/ctrf-report.json}, and
#      - prints a one-line `CTRF {...}` marker to stdout (same JSON, compact).
#    Only `results.summary` (with tests/passed/failed/pending/skipped/other) is required.
#    Use the emit_ctrf helper below; it computes tests = passed+failed+skipped and sets the exit
#    code (0 iff failed==0). Map your framework's output to passed/failed/skipped.
set -uo pipefail
[ -n "${SOURCE_DATE_EPOCH:-}" ] || unset SOURCE_DATE_EPOCH
: "${MAYHEM_JOBS:=$(nproc)}"   # build parallelism; env-overridable, falls back to nproc (use -j"$MAYHEM_JOBS")
cd "$SRC"

# emit_ctrf <tool> <passed> <failed> [skipped] [pending] [other]
# Writes a CTRF report (file + stdout `CTRF {...}` marker) and returns non-zero iff failed>0.
emit_ctrf() {
  local tool="$1" passed="$2" failed="$3" skipped="${4:-0}" pending="${5:-0}" other="${6:-0}"
  local tests=$(( passed + failed + skipped + pending + other ))
  cat > "${CTRF_REPORT:-$SRC/ctrf-report.json}" <<JSON
{
  "results": {
    "tool": { "name": "$tool" },
    "summary": {
      "tests": $tests,
      "passed": $passed,
      "failed": $failed,
      "pending": $pending,
      "skipped": $skipped,
      "other": $other
    }
  }
}
JSON
  printf 'CTRF {"results":{"tool":{"name":"%s"},"summary":{"tests":%d,"passed":%d,"failed":%d,"pending":%d,"skipped":%d,"other":%d}}}\n' \
    "$tool" "$tests" "$passed" "$failed" "$pending" "$skipped" "$other"
  [ "$failed" -eq 0 ]
}

FIBJS="$SRC/bin/Linux_x64_release/fibjs"
[ -x "$FIBJS" ] || { echo "test.sh: $FIBJS missing — mayhem/build.sh did not build it" >&2; emit_ctrf fibjs-test 0 1; exit 1; }

# Offline, self-contained upstream suites covering the fuzzed modules.
SUITES="punycode_test.js semver_test.js xml_test.js querySelector_test.js ts_strip_test.js
        querystring_test.js path_match_test.js"
files=()
for s in $SUITES; do [ -f "test/$s" ] && files+=("$s"); done

report="$(mktemp -d)/fibjs-test.json"
(cd test && "$FIBJS" --test --test-reporter=json --test-reporter-destination="$report" "${files[@]}") >/tmp/fibjs-test.log 2>&1
rc=$?
tail -n 20 /tmp/fibjs-test.log

# Count per-case statuses from the json reporter (python3 is a system tool, untouched by a patch).
read -r passed failed skipped < <(python3 - "$report" <<'PY'
import json, sys
c = {"passed": 0, "failed": 0, "skipped": 0}
def walk(o):
    if isinstance(o, dict):
        st = o.get("status")
        if st and "tests" not in o and "suites" not in o and "children" not in o:
            k = {"passed": "passed", "failed": "failed", "cancelled": "failed"}.get(st, "skipped")
            c[k] += 1
        for v in o.values(): walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
try:
    walk(json.load(open(sys.argv[1])))
except Exception:
    c["failed"] += 1
print(c["passed"], c["failed"], c["skipped"])
PY
)
# The runner must have run real cases and exited cleanly.
if [ "$rc" -ne 0 ] || [ "$passed" -eq 0 ]; then failed=$(( failed > 0 ? failed : 1 )); fi
emit_ctrf fibjs-test "$passed" "$failed" "$skipped"
