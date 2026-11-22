"""Offline tests only: never create cloud resources or execute ptrace."""
import pathlib
import re
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / 'research' / 'main1054' / 'assignment1538-ec2-host'
CLOUD = (DIR / 'host.cfn.yaml').read_text()
RUNBOOK = (DIR / 'README.md').read_text()
PROBE = (DIR / 'synthetic-native-probe.c').read_text()

class PinnedNativeEc2Host(unittest.TestCase):
    def test_cloudformation_not_auto_deploy(self):
        self.assertIn("AWSTemplateFormatVersion: '2010-09-09'", CLOUD)
        self.assertIn('ApprovalReference:', CLOUD)
        self.assertIn('OperatorIamPrincipalArn:', CLOUD)
        self.assertIn('original_model_red_observed=false', CLOUD)
        self.assertIn('native_trap_pc_observed=false', CLOUD)
        self.assertIn('HOST_PROVISIONED_ONLY', CLOUD)

    def test_no_inbound_access_and_no_public_ip(self):
        self.assertRegex(CLOUD, r'SecurityGroupIngress:\s*\[\]')
        self.assertRegex(CLOUD, r'AssociatePublicIpAddress:\s*false')
        self.assertNotIn('FromPort: 22', CLOUD)
        self.assertNotIn('0.0.0.0/0 # ingress', CLOUD)
        self.assertIn('PrivateSubnetId', CLOUD)

    def test_minimal_iam_and_approved_account(self):
        self.assertEqual(CLOUD.count('AmazonSSMManagedInstanceCore'), 1)
        self.assertNotIn('AdministratorAccess', CLOUD)
        self.assertNotIn('iam:*', CLOUD)
        self.assertIn('ApprovalReference', CLOUD)
        self.assertIn('OperatorIamPrincipalArn', CLOUD)

    def test_encrypted_ebs_and_imdsv2(self):
        for line in ['Encrypted: true', 'VolumeType: gp3', 'HttpTokens: required',
                     'HttpPutResponseHopLimit: 1', 'DeleteOnTermination: true']:
            self.assertIn(line, CLOUD)
        self.assertIn('/aws/service/canonical/ubuntu/server/noble/', CLOUD)

    def test_no_debugger_or_security_bypass_on_boot(self):
        forbidden = ['ptrace_scope', 'sysctl -w', '--privileged', 'SYS_PTRACE',
                     'security-opt', 'setenforce', 'apparmor=unconfined',
                     'PTRACE_ATTACH', 'chmod 777', 'aws ssm send-command']
        for needle in forbidden:
            self.assertNotIn(needle, CLOUD, needle)
        self.assertIn('lock_passwd: true', CLOUD)
        self.assertIn('sudo: []', CLOUD)

    def test_preserves_original_sha_pins(self):
        for sha in ['db897909f7c31d9b38793374c66427b6a4cb3dd3',
                    'f713c6fa093a1f45956c84844d50635376923b75',
                    '02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3',
                    'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39']:
            self.assertIn(sha, RUNBOOK)
        self.assertIn('family_alpha=HOLD-255', CLOUD)

    def test_synthetic_probe_never_claims_original_red(self):
        self.assertIn('PTRACE_TRACEME', PROBE)
        self.assertIn('PTRACE_GETREGS', PROBE)
        self.assertIn('PTRACE_GETSIGINFO', PROBE)
        self.assertNotIn('PTRACE_ATTACH', PROBE)
        self.assertNotIn('PTRACE_SEIZE', PROBE)
        self.assertIn('originalWebKitExecuted\\\":false', PROBE)
        self.assertIn('originalOnnxRedObserved\\\":false', PROBE)

    def test_c_compiles_without_execution(self):
        cc = shutil.which('cc')
        if not cc:
            self.skipTest('Compiler not available for offline check')
        with tempfile.TemporaryDirectory(prefix='cc-m4-syntax-') as d:
            subprocess.run([cc, '-O0','-Wall','-Wextra','-Werror','-c',
                str(DIR/'synthetic-native-probe.c'),'-o',str(pathlib.Path(d)/'probe.o')],
                check=True, capture_output=True, text=True, timeout=30)

    def test_yaml_structure_when_parser_available(self):
        try:
            import yaml
        except ImportError:
            self.skipTest('Optional PyYAML not installed; AWS validates template at deployment')
        class CfnLoader(yaml.SafeLoader):
            pass
        def cfn(loader, tag_suffix, node):
            if isinstance(node, yaml.ScalarNode):
                return {f'!{tag_suffix}': loader.construct_scalar(node)}
            if isinstance(node, yaml.SequenceNode):
                return {f'!{tag_suffix}': loader.construct_sequence(node)}
            return {f'!{tag_suffix}': loader.construct_mapping(node)}
        CfnLoader.add_multi_constructor('!', cfn)
        parsed = yaml.load(CLOUD, Loader=CfnLoader)
        res = parsed['Resources']
        self.assertEqual(res['NativeHost']['Type'], 'AWS::EC2::Instance')
        self.assertEqual(res['InstanceRole']['Type'], 'AWS::IAM::Role')
        self.assertEqual(res['NativeHostSecurityGroup']['Properties']['SecurityGroupIngress'], [])
        nic = res['NativeHost']['Properties']['NetworkInterfaces'][0]
        self.assertIs(nic['AssociatePublicIpAddress'], False)
        self.assertEqual(parsed['Outputs']['DebugReadiness']['Value'],
                         'HOST_PROVISIONED_ONLY - native trace still requires separate approval and proof')


    def test_readonly_operator_preflight_without_credentials_blocks(self):
        import os
        script = str(DIR / 'operator-readiness.sh')
        proc = subprocess.run(['bash', script], capture_output=True, text=True, timeout=20,
                              env={'PATH':'/usr/bin:/bin'})
        self.assertEqual(proc.returncode, 2)
        self.assertIn('BLOCKED: missing required', proc.stderr)
        self.assertEqual(proc.stdout, '')

    def test_operator_preflight_has_no_aws_mutation_or_trace(self):
        script = (DIR / 'operator-readiness.sh').read_text()
        for operation in ['create-stack', 'run-instances', 'create-role',
                          'update-assume-role-policy', 'send-command',
                          'PTRACE_ATTACH', 'ptrace_scope', '--privileged']:
            self.assertNotIn(operation, script)
        self.assertIn('cloudResourcesCreated=false', script)
        self.assertIn('nativeTraceAuthorized=false', script)

if __name__ == '__main__':
    unittest.main()
