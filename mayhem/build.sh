#!/usr/bin/env bash
# mayhem/build.sh — build the fibjs runtime with ASan+UBSan (fibjs's own C++ code) against the
# prebuilt, pinned fibjs_vender libraries cached in the image, plus the JS fuzz drivers' runner.
#
# Targets are file-input: `fibjs mayhem/<target>/driver.js <input>`; each driver feeds the input
# file to one builtin module's public JS API (xml, http, zip, url, ...). The vender libraries (V8,
# expat, gumbo, openssl, ...) stay uninstrumented, prebuilt by upstream (SPEC §6.2 item 19).
set -euo pipefail
[ -n "${SOURCE_DATE_EPOCH:-}" ] || unset SOURCE_DATE_EPOCH

: "${SANITIZER_FLAGS=-fsanitize=address,undefined -fno-sanitize-recover=all -fno-omit-frame-pointer}"
: "${DEBUG_FLAGS:=-g -gdwarf-3}"
: "${CC:=clang}" ; : "${CXX:=clang++}"
: "${MAYHEM_JOBS:=}"
if [ -z "$MAYHEM_JOBS" ]; then
  # An ASan+UBSan compile of a fibjs source needs ~1.5 GB: cap the jobs by the memory available
  # (cgroup limit when set) so a memory-capped build is not OOM-killed.
  mem_kb=$(awk '/MemAvailable/{print $2}' /proc/meminfo)
  lim=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
  [ "$lim" = max ] || [ $(( lim / 1024 )) -ge "$mem_kb" ] || mem_kb=$(( lim / 1024 ))
  MAYHEM_JOBS=$(( mem_kb / (1536 * 1024) )); [ "$MAYHEM_JOBS" -ge 1 ] || MAYHEM_JOBS=1
  [ "$MAYHEM_JOBS" -le "$(nproc)" ] || MAYHEM_JOBS=$(nproc)
fi
: "${SRC:=/mayhem}"
: "${FIBJS_VENDER_DIST:=/opt/toolchains/deps/fibjs_vender-20261122203716-93fb896}"
export CC CXX

# UBSan checks relaxed (ASan and the rest of UBSan stay on and halting): fibjs trips these on EVERY
# run through benign, pervasive idioms, so leaving them on makes every input "crash":
#   vptr     - XmlNodeMixin.h:27 static_cast<Derived*>(this) in the CRTP base constructor
#   null     - container_of() (UVStream.h:298 etc.) computes member offsets from a null pointer
#   function - callbacks called through C-style casted function pointer types
#   object-size - _offsetof()'s `&((T*)0)->m` on classes with virtual bases is reported as a null
#              member access by the object-size check (every console write, UVStream.h:298)
# A real null dereference still faults (SEGV) and is reported by ASan.
[ -z "$SANITIZER_FLAGS" ] || SANITIZER_FLAGS="$SANITIZER_FLAGS -fno-sanitize=vptr,null,function,object-size"

cd "$SRC"
[ -f vender/build ] || { echo "vender submodule missing (checkout with submodules: recursive)" >&2; exit 1; }
[ -d "$FIBJS_VENDER_DIST/Linux_x64_release" ] || { echo "prebuilt vender dist missing at $FIBJS_VENDER_DIST" >&2; exit 1; }

# LeakSanitizer off at build time (SPEC §6.2 item 15).
mkdir -p out
$CXX $SANITIZER_FLAGS $DEBUG_FLAGS -c mayhem/lsan_off.cc -o out/lsan_off.o

# Sanitizer flags go to fibjs's own sources (CXXFLAGS/CFLAGS seed CMAKE_*_FLAGS, which the
# project appends to); the vender libraries are prebuilt. Build dir out/ is gitignored upstream.
# Passed as -D on every configure (not via env, which only seeds a fresh cache) so a re-run with
# different SANITIZER_FLAGS really rebuilds with them.
cmake -Wno-author \
  -DCMAKE_C_FLAGS="$SANITIZER_FLAGS $DEBUG_FLAGS" \
  -DCMAKE_CXX_FLAGS="$SANITIZER_FLAGS $DEBUG_FLAGS" \
  -DCMAKE_EXE_LINKER_FLAGS="$SANITIZER_FLAGS $SRC/out/lsan_off.o --ld-path=$SRC/mayhem/ld-keep-debug.sh" \
  -DBUILD_OS=Linux -DBUILD_ARCH=x64 -DBUILD_TYPE=release -DBUILD_JOBS="$MAYHEM_JOBS" \
  -DBT_BIN_DIR="$SRC/bin/Linux_x64_release" \
  -DBT_VENDER=dist -DBT_VENDER_DIST_DIR="$FIBJS_VENDER_DIST" \
  -S . -B out/Linux_x64_release
cmake --build out/Linux_x64_release --target fibjs -- -j"$MAYHEM_JOBS"

test -x bin/Linux_x64_release/fibjs
readelf -S bin/Linux_x64_release/fibjs | grep -q '\.debug_info' || { echo "fibjs has no .debug_info" >&2; exit 1; }
echo "built $SRC/bin/Linux_x64_release/fibjs"
