# syntax=docker/dockerfile:1.7
# Commit image for fibjs: the fibjs runtime built with ASan+UBSan (fibjs's own C++), linked against
# the prebuilt fibjs_vender libraries pinned below; fuzz targets are JS drivers run by that binary.
FROM ghcr.io/savantenvs/base:20261023

ARG COMMIT
ARG REPO_URL
ARG SOURCE_DATE_EPOCH
ARG SANITIZER_FLAGS
ARG COVERAGE_FLAGS=
ARG MAYHEM_JOBS=

# fibjs's CMakeLists requires the gtk+-3.0 headers on Linux (pkg_check_modules REQUIRED).
USER root
RUN [ -n "$SOURCE_DATE_EPOCH" ] && repro-sources-list.sh || true ; \
    apt-get update && apt-get install -yq --no-install-recommends libgtk-3-dev \
 && rm -rf /var/lib/apt/lists/*

# Prebuilt fibjs_vender (V8, expat, gumbo, openssl, zlib, ...) for the vender submodule pinned at
# 93fb8961d2 — upstream's own `./build ci` artifact (SPEC §6.2 item 19). The matching sources are
# the vender submodule under /mayhem/vender. Uninstrumented, like apt libraries.
ARG VENDER_TAG=20261122203716-93fb896
ARG VENDER_SHA256=8f0c643a4d65abcc7005e4e450e69daefd14e36851e0b84ab82361311be99129
RUN d=/opt/toolchains/deps/fibjs_vender-${VENDER_TAG} && mkdir -p "$d" \
 && curl -fsSL -o /tmp/vender.tgz \
      https://github.com/fibjs/fibjs_vender/releases/download/${VENDER_TAG}/fibjs_vender-linux-x64-release.tar.gz \
 && echo "${VENDER_SHA256}  /tmp/vender.tgz" | sha256sum -c - \
 && tar -xzf /tmp/vender.tgz --strip-components=1 -C "$d" \
 && rm -f /tmp/vender.tgz && chmod -R a+rX,go-w "$d"

USER mayhem
WORKDIR /mayhem
COPY --chown=2000:2000 . /mayhem

RUN if [ -x /opt/mayhem/ccache/prefill ]; then /opt/mayhem/ccache/prefill bash mayhem/build.sh; \
    else bash mayhem/build.sh; fi

RUN if [ -f mayhem/test.sh ]; then bash mayhem/test.sh; else echo "no mayhem/test.sh"; fi

LABEL org.opencontainers.image.source="${REPO_URL}" \
      org.opencontainers.image.revision="${COMMIT}" \
      rlenv.tier="commit" \
      rlenv.source_date_epoch="${SOURCE_DATE_EPOCH}" \
      rlenv.user="mayhem"

USER mayhem
WORKDIR /mayhem
