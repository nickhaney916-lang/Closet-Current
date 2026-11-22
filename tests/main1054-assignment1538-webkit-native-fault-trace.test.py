"""Adversarial offline original-WebKit fault observer tests; no native attach."""
import importlib.util
import pathlib
import subprocess
import sys
import unittest

FILE = pathlib.Path(__file__).resolve().parents[1] / 'research/main1054/assignment1538-ec2-host/native-webkit-fault-trace.py'
spec = importlib.util.spec_from_file_location('m1538_native_trace', str(FILE))
fault = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fault)


def fake_stat(ppid, ticks, name='WPEWebProcess (helper)'):
    return f'100 ({name}) S {ppid} ' + '0 ' * 17 + str(ticks) + ' 0 0\n'


class TestNativeFaultObserver(unittest.TestCase):
    def test_stat_parser_handles_nested_parens_and_exact_ticks(self):
        self.assertEqual(fault.proc_stat_text(fake_stat(200, 900))['parentPid'], 200)
        self.assertEqual(fault.proc_stat_text(fake_stat(200, 900))['startTicks'], '900')
        with self.assertRaisesRegex(RuntimeError, 'PROC_STAT_MALFORMED'):
            fault.proc_stat_text('invalid data')

    def test_process_chain_is_genuine_not_recycled_pid(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            root = pathlib.Path(d)
            for pid, ppid, ticks in [(100, 200, 550), (200, 300, 300), (300, 1, 50)]:
                (root / str(pid)).mkdir()
                (root / str(pid) / 'stat').write_text(fake_stat(ppid, ticks))
            chain = fault.ancestry(100, 300, root)
            self.assertEqual([(c['pid'], c['startTicks']) for c in chain],
                             [(100, '550'), (200, '300'), (300, '50')])
            with self.assertRaisesRegex(RuntimeError, 'NOT_BROWSER_DESCENDANT'):
                fault.ancestry(100, 999, root)
            (root / '200' / 'stat').write_text(fake_stat(200, 666))
            with self.assertRaisesRegex(RuntimeError, 'RENDERER_PROCESS_LOOP'):
                fault.ancestry(100, 300, root)

    def test_only_file_backed_executable_mappings_count(self):
        txt = ('abcd-efgh r-xp 00000000 00:00 100 /opt/libjavascriptcoregtk-6.0.so\n'
               'abcd-efgh rw-p 00000000 00:00 0 /tmp/other.so\n'
               'abcd-efgh r-xp 00000000 00:00 0 /tmp/replaced.so (deleted)\n'
               'abcd-efgh r-xp 00000000 00:00 0 [anon:WasmJIT]\n')
        got = fault.mapped_library_paths(txt)
        self.assertEqual(got, {'/opt/libjavascriptcoregtk-6.0.so'})

    def test_no_signal_cannot_be_framed_as_original_fault(self):
        result = fault.classified_log('RuntimeError: memory access out of bounds', 1, False)
        self.assertEqual(result['kind'], 'NO_VERIFIED_NATIVE_SIGNAL')
        self.assertFalse(result['nativeSignalPcObserved'])
        self.assertIsNone(result['originalWasmEffectiveAddress'])
        self.assertIsNone(result['originalWasmTrapInstructionOffset'])

    def test_machine_pc_and_siginfo_are_not_wasm_effective_address(self):
        # Test strings are synthetic; can NEVER constitute original failure proof.
        log = 'CC1538_NATIVE_SIGSEGV_PC=0x12345\nCC1538_SIGNAL_FAULT_ADDRESS=0x10\n'
        got = fault.classified_log(log, 0, False)
        self.assertEqual(got['kind'], 'UNATTESTED_NATIVE_SIGNAL_ONLY')
        self.assertTrue(got['nativeSignalPcObserved'])
        self.assertFalse(got['originalOrtCreateSessionRedObserved'])
        self.assertIsNone(got['originalWasmEffectiveAddress'])
        self.assertIsNone(got['sourceCxxLine'])
        self.assertFalse(got['causalFixProven'])
        self.assertFalse(fault.classified_log(log, 1, False)['nativeSignalPcObserved'])
        self.assertFalse(fault.classified_log(log, 0, True)['nativeSignalPcObserved'])
        self.assertFalse(fault.classified_log(log + log, 0, False)['nativeSignalPcObserved'])

    def test_signal_trace_commands_no_elevated_bypass_or_memory_dump(self):
        cmd = fault.gdb_commands()
        self.assertIn('handle SIGSEGV stop', cmd)
        for bad in ('set follow-fork-mode child', 'set disable-randomization on',
                    'ptrace_scope', 'setcap ', 'dump memory ', 'gcore '):
            self.assertNotIn(bad, cmd)
        self.assertIn('$_siginfo._sifields._sigfault.si_addr', cmd)


    def test_jsc_helper_breakpoint_is_source_specific_and_non_privileged(self):
        script = fault.jsc_exception_gdb_commands()
        self.assertIn('break JSC::operationWasmToJSException', script)
        self.assertIn('CC1538_JSC_THROW_TYPE', script)
        for bad in ('handle SIGSEGV', 'gcore ', 'ptrace_scope', 'set breakpoint pending on'):
            self.assertNotIn(bad, script)

    def test_jsc_exception_receipt_is_not_original_trap(self):
        synthetic = ('CC1538_JSC_EXCEPTION_HELPER_REACHED=1\n'
                     'CC1538_JSC_OPERATION_PC=0x1200\n'
                     'CC1538_JSC_THROW_TYPE=0\n')
        r = fault.classified_jsc_exception_log(synthetic, 0, False)
        self.assertEqual(r['kind'], 'UNATTESTED_JSC_SOFTWARE_EXCEPTION_HELPER_ONLY')
        self.assertTrue(r['jscExceptionHelperObserved'])
        self.assertFalse(r['jscOperationPcIsOriginalWasmSite'])
        self.assertFalse(r['originalOrtCreateSessionRedObserved'])
        self.assertIsNone(r['originalWasmEffectiveAddress'])
        self.assertIsNone(r['originalWasmTrapInstructionOffset'])
        self.assertFalse(r['causalFixProven'])

    def test_jsc_exception_rejects_partial_repeated_failed_and_timed_out(self):
        synthetic = ('CC1538_JSC_EXCEPTION_HELPER_REACHED=1\n'
                     'CC1538_JSC_OPERATION_PC=0x1200\n'
                     'CC1538_JSC_THROW_TYPE=0\n')
        for log, exit_code, timed_out in [
            ('', 0, False),
            (synthetic.replace('CC1538_JSC_THROW_TYPE=0\n', ''), 0, False),
            (synthetic + synthetic, 0, False),
            (synthetic, 1, False),
            (synthetic, 0, True),
        ]:
            r = fault.classified_jsc_exception_log(log, exit_code, timed_out)
            self.assertFalse(r['jscExceptionHelperObserved'])
            self.assertIsNone(r['originalWasmTrapInstructionOffset'])

    def test_tool_refuses_missing_inputs_without_debugger(self):
        p = subprocess.run([sys.executable, str(FILE)], capture_output=True, text=True, timeout=5)
        self.assertNotEqual(p.returncode, 0)
        self.assertNotIn('NATIVE_SIGSEGV', p.stdout)


if __name__ == '__main__':
    unittest.main()
