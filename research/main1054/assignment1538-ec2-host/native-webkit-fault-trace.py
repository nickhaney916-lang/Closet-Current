#!/usr/bin/env python3
"""Operator-only, fail-closed original WebKit WPE *native signal* observer.

A WPE SIGSEGV PC/si_addr is NOT an original OrtCreateSession WASM opcode or an
internal WASM effective access. Never creates signed originals or a repair claim.
No privileges/security changes. Never invoke on hosted CI or denied attach.
"""
import argparse
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import time

REPO = pathlib.Path(__file__).resolve().parents[3]
HOST_PREFLIGHT = REPO / 'research/main1054/assignment1538-native-host.mjs'
MAX_LOG = 256_000


def require(ok, reason):
    if not ok:
        raise RuntimeError(reason)


def proc_stat_text(txt):
    # /proc/pid/stat fields: after closing ')' state (field 3), PPID (4), ...
    pos = txt.rfind(') ')
    require(pos > 0, 'PROC_STAT_MALFORMED')
    rest = txt[pos+2:].split()
    require(len(rest) >= 20, 'PROC_STAT_MALFORMED')
    ppid, ticks = int(rest[1]), rest[19]  # starttime field 22
    require(ppid >= 0 and ticks.isdecimal() and int(ticks) > 0, 'PROC_STAT_MALFORMED')
    return {'parentPid': ppid, 'startTicks': ticks}


def read_proc(pid, procroot=pathlib.Path('/proc')):
    require(type(pid) is int and 1 <= pid < (1 << 31), 'PID_INVALID')
    p = procroot / str(pid)
    stat = proc_stat_text((p / 'stat').read_text())
    stat['pid'] = pid
    return stat


def ancestry(renderer_pid, browser_pid, procroot=pathlib.Path('/proc')):
    seen, chain, pid = set(), [], renderer_pid
    for _ in range(16):
        require(pid not in seen, 'RENDERER_PROCESS_LOOP')
        seen.add(pid)
        s = read_proc(pid, procroot)
        chain.append(s)
        if pid == browser_pid:
            return chain
        pid = s['parentPid']
        require(pid > 1, 'NOT_BROWSER_DESCENDANT')
    raise RuntimeError('RENDERER_ANCESTRY_TOO_DEEP')


def mapped_library_paths(maps):
    # Use only actual pathname-backed executable ELF mappings; reject memfd, (deleted),
    # anonymous and JIT ranges. No guessed conversion from generated machine PC.
    results = set()
    for line in maps.splitlines():
        parts = line.split(maxsplit=5)
        if len(parts) != 6 or 'x' not in parts[1]:
            continue
        path = parts[5]
        if path.startswith('/') and not path.endswith(' (deleted)'):
            results.add(os.path.realpath(path))
    return results


def verify_live_renderer(pid, browser_pid, ticks, browser_ticks, paths, procroot=pathlib.Path('/proc')):
    # No root attach: caller must own the same user's WPE renderer.
    require(os.geteuid() != 0, 'ROOT_DEBUGGER_NOT_PERMITTED')
    require((procroot / str(pid)).stat().st_uid == os.geteuid(), 'RENDERER_NOT_CALLER_OWNED')
    chain = ancestry(pid, browser_pid, procroot)
    require(chain[0]['startTicks'] == ticks and chain[-1]['startTicks'] == browser_ticks,
            'STALE_PID_OR_WRONG_BROWSER')
    exe = os.path.realpath(os.readlink(procroot / str(pid) / 'exe'))
    require(exe == os.path.realpath(paths['rendererElf']), 'RENDERER_EXE_PIN_MISMATCH')
    maps = (procroot / str(pid) / 'maps').read_text()
    actual = mapped_library_paths(maps)
    for key in ('webkitElf', 'jscElf'):
        require(os.path.realpath(paths[key]) in actual, 'LIVE_MAPPED_ELF_MISSING_' + key)
    return chain


def gdb_commands():
    # This handles *native SIGSEGV only*. A JSC WASM OOB exception may never
    # generate a POSIX SIGSEGV; no result then is a genuine native observation.
    return '''set pagination off
set confirm off
set print elements 0
set print pretty off
set breakpoint pending off
handle SIGSEGV stop print nopass
continue
printf "CC1538_NATIVE_SIGSEGV_PC=%#lx\\n", (unsigned long)$pc
printf "CC1538_SIGNAL_FAULT_ADDRESS=%#lx\\n", (unsigned long)$_siginfo._sifields._sigfault.si_addr
bt 12
detach
quit
'''



def jsc_exception_gdb_commands():
    # The exact pinned JSC software-thrown WASM exception helper. The PC is
    # inside this shared C++ helper, not the original JIT memory access site.
    return '''set pagination off
set confirm off
set print elements 0
set print pretty off
set breakpoint pending off
break JSC::operationWasmToJSException
commands
silent
printf "CC1538_JSC_EXCEPTION_HELPER_REACHED=1\\n"
printf "CC1538_JSC_OPERATION_PC=%#lx\\n", (unsigned long)$pc
printf "CC1538_JSC_THROW_TYPE=%u\\n", (unsigned int)type
bt 8
detach
quit
end
continue
'''


def classified_jsc_exception_log(log, exit_code, timed_out):
    # Validated first helper entry only. Never a genuine original-model receipt.
    marker = re.findall(r'(?m)^CC1538_JSC_EXCEPTION_HELPER_REACHED=1\s*$', log)
    pc = re.findall(r'(?m)^CC1538_JSC_OPERATION_PC=(0x[0-9a-f]+)\s*$', log)
    kind = re.findall(r'(?m)^CC1538_JSC_THROW_TYPE=([0-9]{1,9})\s*$', log)
    observed = (len(marker) == len(pc) == len(kind) == 1
                and not timed_out and exit_code == 0)
    return {
        'kind': ('UNATTESTED_JSC_SOFTWARE_EXCEPTION_HELPER_ONLY' if observed
                 else 'NO_VERIFIED_JSC_SOFTWARE_EXCEPTION_HELPER'),
        'jscExceptionHelperObserved': observed,
        'jscExceptionTypeNumericalReceiptObserved': observed,
        'jscOperationFunctionPcObserved': observed,
        'jscOperationPcIsOriginalWasmSite': False,
        'originalOrtCreateSessionRedObserved': False,
        'originalWasmTrapInstructionOffset': None,
        'originalWasmEffectiveAddress': None,
        'wasmAccessBytes': None,
        'wasmLiveMemoryBytesAtTrap': None,
        'sourceCxxLine': None,
        'causalFixProven': False,
        'familyAlpha': 'HOLD',
    }


def classified_log(log, exit_code, timed_out):
    pc = re.findall(r'(?m)^CC1538_NATIVE_SIGSEGV_PC=(0x[0-9a-f]+)\s*$', log)
    addr = re.findall(r'(?m)^CC1538_SIGNAL_FAULT_ADDRESS=(0x[0-9a-f]+)\s*$', log)
    native_signal = len(pc) == 1 and len(addr) == 1 and not timed_out and exit_code == 0
    return {
        'kind': 'UNATTESTED_NATIVE_SIGNAL_ONLY' if native_signal else 'NO_VERIFIED_NATIVE_SIGNAL',
        'nativeSignalPcObserved': native_signal,
        'signalFaultAddressObserved': native_signal,
        # Must be independently corroborated as *original* WebKit ONNX/JSEP RED.
        'originalOrtCreateSessionRedObserved': False,
        'originalWasmTrapInstructionOffset': None,
        'originalWasmEffectiveAddress': None,
        'wasmAccessBytes': None,
        'wasmLiveMemoryBytesAtTrap': None,
        'sourceCxxLine': None,
        'causalFixProven': False,
        'familyAlpha': 'HOLD',
    }


def asset_preflight(path):
    cmd = ['node', str(HOST_PREFLIGHT), '--preflight', str(path)]
    p = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       timeout=100, cwd=str(REPO), env={'PATH': os.environ.get('PATH', '/usr/bin:/bin')})
    require(p.returncode == 0, 'EXACT_ORIGINAL_HOST_ASSET_PREFLIGHT_FAILED')
    try:
        out = json.loads(p.stdout)
    except (ValueError, TypeError):
        raise RuntimeError('HOST_ASSET_REPORT_INVALID')
    require(out.get('verdict') == 'PINNED_HOST_FILES_VERIFIED_ONLY',
            'HOST_ASSET_REPORT_INVALID')
    return json.loads(path.read_text())


def run(args):
    require(sys.platform.startswith('linux'), 'LINUX_HOST_REQUIRED')
    require(pathlib.Path(args.host_paths).is_absolute(), 'HOST_PATHS_NOT_ABSOLUTE')
    require(args.renderer != args.browser, 'RENDERER_AND_BROWSER_IDENTICAL')
    require(args.renderer_ticks.isdecimal() and args.browser_ticks.isdecimal(), 'START_TICKS_INVALID')
    paths = asset_preflight(pathlib.Path(args.host_paths))
    chain = verify_live_renderer(args.renderer, args.browser, args.renderer_ticks, args.browser_ticks, paths)
    if args.mode == 'inspect':
        return {'kind': 'LIVE_PROCESS_IDENTITY_VERIFIED_ONLY', 'processChain': chain,
                'observerApproved': False, 'originalWasmTrapInstructionOffset': None,
                'originalWasmEffectiveAddress': None, 'familyAlpha': 'HOLD'}
    require(os.environ.get('CC1538_OPERATOR_NATIVE_TRACE_APPROVAL_ID', '').startswith('CC-M4-'),
            'INDEPENDENT_NATIVE_OBSERVER_APPROVAL_REQUIRED')
    require(sys.stdin.isatty(), 'INTERACTIVE_OPERATOR_CONFIRMATION_REQUIRED')
    require(input(f'Type TRACE {args.renderer} to request authorized GDB attachment: ') ==
            f'TRACE {args.renderer}', 'OPERATOR_CONFIRMATION_REJECTED')
    # Check identity again directly before invoking gdb; no denied retry.
    verify_live_renderer(args.renderer, args.browser, args.renderer_ticks, args.browser_ticks, paths)
    out = pathlib.Path(args.output_dir)
    require(out.is_absolute() and out.is_dir() and not out.is_symlink(), 'OPERATOR_LOCAL_OUTPUT_DIR_INVALID')
    require(out.stat().st_uid == os.geteuid() and out.stat().st_mode & 0o077 == 0,
            'OPERATOR_OUTPUT_DIR_NOT_PRIVATE')
    with tempfile.NamedTemporaryFile('w', dir=out, prefix='cc1538-', suffix='.gdb',
                                     delete=False) as g:
        os.chmod(g.name, 0o600)
        g.write(jsc_exception_gdb_commands() if args.mode == 'exception' else gdb_commands())
        cmds = g.name
    started = time.time()
    timed_out = False
    code = None
    try:
        try:
            p = subprocess.run(['gdb', '-q', '-nx', '-nh', '-batch', '--pid', str(args.renderer),
                                '-x', cmds], text=True, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, timeout=90)
            raw, code = p.stdout[:MAX_LOG], p.returncode
        except subprocess.TimeoutExpired as e:
            timed_out = True
            raw = (e.stdout or b'')[:MAX_LOG]
            if isinstance(raw, bytes):
                raw = raw.decode('utf-8', 'replace')
    finally:
        pathlib.Path(cmds).unlink(missing_ok=True)
    # Full debugger output is privileged operator-local material. Never upload.
    name = f'cc1538-{args.mode}-{args.renderer}-{int(started)}.private.log'
    logpath = out / name
    with logpath.open('x') as fd:
        os.fchmod(fd.fileno(), 0o600)
        fd.write(raw)
    result = (classified_jsc_exception_log(raw, code, timed_out)
              if args.mode == 'exception' else classified_log(raw, code, timed_out))
    result['operatorLocalLogName'] = name
    result['debuggerTimedOut'] = timed_out
    result['gdbReturnCode'] = code
    result['processChainWasVerifiedBeforeAttach'] = True
    result['operatorAuthorizationIndependentlyVerifiedByThisTool'] = False
    return result


def main():
    p = argparse.ArgumentParser(description='Operator-only WebKit native signal/exception observer; no original WASM trap proof')
    p.add_argument('--mode', choices=('inspect', 'capture', 'exception'), default='inspect')
    p.add_argument('--host-paths', required=True)
    p.add_argument('--renderer', type=int, required=True)
    p.add_argument('--browser', type=int, required=True)
    p.add_argument('--renderer-ticks', required=True)
    p.add_argument('--browser-ticks', required=True)
    p.add_argument('--output-dir')
    args = p.parse_args()
    try:
        require(args.mode == 'inspect' or bool(args.output_dir), 'OUTPUT_DIR_REQUIRED')
        print(json.dumps(run(args), separators=(',', ':')))
    except (Exception,) as e:
        reason = str(e)
        if not re.fullmatch('[A-Z0-9_]+', reason):
            reason = 'NATIVE_OBSERVER_BLOCKED'
        print('BLOCKED: ' + reason, file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
