/*
 * Local-only operator opt-in smoke test: traces a CHILD process started by
 * this same program with PTRACE_TRACEME. Does not attach to WebKit, change
 * kernel security, or establish original ONNX/JSEP fault identity.
 * Requires independent operator approval before running.
 * Compile: cc -O0 -Wall -Wextra -Werror synthetic-native-probe.c -o synthetic-native-probe
 */
#define _GNU_SOURCE
#include <errno.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ptrace.h>
#include <sys/types.h>
#include <sys/user.h>
#include <sys/wait.h>
#include <unistd.h>

static int fail(const char *reason) {
    fprintf(stderr, "BLOCKED: %s\n", reason);
    return 1;
}

int main(void) {
#if !defined(__linux__) || !defined(__x86_64__)
    return fail("requires approved Linux x86_64 host");
#else
    pid_t child = fork();
    if (child < 0) return fail("fork not permitted");
    if (child == 0) {
        if (ptrace(PTRACE_TRACEME, 0, NULL, NULL) == -1) _exit(91);
        raise(SIGSTOP);
        volatile unsigned char *bad = (volatile unsigned char *)(uintptr_t)1;
        unsigned char value = *bad;
        (void)value;
        _exit(0);
    }
    int status = 0;
    if (waitpid(child, &status, 0) != child) return fail("waitpid initial failed");
    if (!WIFSTOPPED(status) || WSTOPSIG(status) != SIGSTOP) {
        (void)waitpid(child, &status, 0);
        return fail("child self-trace not authorized");
    }
    if (ptrace(PTRACE_CONT, child, NULL, NULL) == -1) {
        (void)ptrace(PTRACE_DETACH, child, NULL, NULL);
        return fail("ptrace continued execution denied");
    }
    if (waitpid(child, &status, 0) != child || !WIFSTOPPED(status) || WSTOPSIG(status) != SIGSEGV) {
        return fail("expected synthetic native trap absent");
    }
    siginfo_t info;
    struct user_regs_struct regs;
    if (ptrace(PTRACE_GETSIGINFO, child, NULL, &info) == -1 ||
        ptrace(PTRACE_GETREGS, child, NULL, &regs) == -1) {
        (void)ptrace(PTRACE_KILL, child, NULL, NULL);
        return fail("native PC or effective memory fault address unavailable");
    }
    int verified = info.si_signo == SIGSEGV && (uintptr_t)info.si_addr == 1 && regs.rip != 0;
    (void)ptrace(PTRACE_KILL, child, NULL, NULL);
    (void)waitpid(child, &status, 0);
    if (!verified) return fail("synthetic native fault was not authenticated");
    puts("{\"syntheticNativeTrapObserved\":true,\"originalWebKitExecuted\":false,\"originalOnnxRedObserved\":false,\"originalWasmFaultPc\":null,\"causalFixProven\":false,\"familyAlpha\":\"HOLD\"}");
    return 0;
#endif
}
