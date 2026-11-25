#!/usr/bin/env bash
# Linker used for the fibjs link (clang --ld-path): fibjs's release flags (vender/build_tools
# option_flags_clang.cmake) pass -s, which strips the DWARF the sanitizer/Mayhem triage needs
# (SPEC §6.2 item 10). Drop only -s/--strip-all and run the system linker by name.
args=()
for a in "$@"; do
  case "$a" in -s|--strip-all) ;; *) args+=("$a") ;; esac
done
exec ld "${args[@]}"
