# M1538 approved-operator preparation only. Pinned ORIGINAL M287 browser base.
# This image does not grant native-debugging authorization or ptrace access.
# Never pass --privileged, --cap-add, seccomp=unconfined or ptrace_scope overrides.
FROM mcr.microsoft.com/playwright@sha256:f1e7e01021efd65dd1a2c56064be399f3e4de00fd021ac561325f2bfbb2b837a
RUN apt-get update && apt-get install -y --no-install-recommends \
      binutils git ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /cc-research
# Source checkout, upstream pinned source/patch and original assets must be
# supplied by a separately authorized operator and checked by host preflight.
CMD ["/bin/bash"]
