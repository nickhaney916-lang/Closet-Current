"""M1538 unattended cloud create is always blocked. All AWS commands are faked."""
import os
import pathlib
import subprocess
import tempfile
import unittest

DIR = pathlib.Path(__file__).resolve().parents[1] / 'research/main1054/assignment1538-ec2-host'
LAUNCH = DIR / 'operator-launch-after-approval.sh'

class LaunchGates(unittest.TestCase):
    def test_missing_context_blocks_without_aws(self):
        p = subprocess.run(['bash', str(LAUNCH), 'create'], env={'PATH':'/usr/bin:/bin'},
                           capture_output=True, text=True, timeout=10)
        self.assertEqual(p.returncode, 2)
        self.assertIn('BLOCKED: missing', p.stderr)

    def test_mocked_aws_read_only_and_unattended_create_blocked(self):
        with tempfile.TemporaryDirectory(prefix='cc-m4-aws-gate-') as d:
            aws=pathlib.Path(d)/'aws'
            log=pathlib.Path(d)/'audit.txt'
            aws.write_text("""#!/bin/sh
printf '%s\n' "$*" >> "$CC_M4_MOCK_CALLS"
case "$*" in
 *create-stack*|*run-instances*) exit 91 ;;
 *'get-caller-identity --query Arn'*) echo "$CC_M4_MOCK_CALLER_ARN" ;;
 *get-caller-identity*) echo 111122223333 ;;
 *validate-template*) echo '{}' ;;
 *VpcId*) echo vpc-01234567 ;;
 *MapPublicIpOnLaunch*) echo False ;;
 *AvailabilityZone*) echo us-west-2a ;;
 *State*) echo available ;;
 *describe-instance-type-offerings*) echo m7i.xlarge ;;
 *get-parameter*) echo ami-0123456789abcdef0 ;;
 *) exit 92 ;;
esac
""")
            aws.chmod(0o700)
            e=os.environ.copy()
            e.update({
                'PATH': d + os.pathsep + e.get('PATH', '/usr/bin:/bin'),
                'CC_M4_MOCK_CALLS': str(log),
                'CC_M4_MOCK_CALLER_ARN':'arn:aws:sts::111122223333:assumed-role/approved-operator/cloudshell-user',
                'CC_M4_AWS_REGION': 'us-west-2',
                'CC_M4_VPC_ID': 'vpc-01234567',
                'CC_M4_PRIVATE_SUBNET_ID': 'subnet-01234567',
                'CC_M4_INSTANCE_TYPE': 'm7i.xlarge',
                'CC_M4_APPROVAL_REFERENCE': 'CC-M4-INDEPENDENT-REVIEW',
                'CC_M4_OPERATOR_IAM_PRINCIPAL_ARN':'arn:aws:iam::111122223333:role/approved-operator',
            })
            p=subprocess.run(['bash',str(LAUNCH),'preflight'],env=e,
                             capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,0,(p.stderr,p.stdout))
            self.assertIn('cloudResourcesCreated=false', p.stdout)
            e['CC_M4_OPERATOR_IAM_PRINCIPAL_ARN']='arn:aws:iam::444455556666:role/wrong-account'
            p=subprocess.run(['bash',str(LAUNCH),'preflight'],env=e,
                             capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,2)
            self.assertIn('different AWS account',p.stderr)
            e['CC_M4_OPERATOR_IAM_PRINCIPAL_ARN']='arn:aws:iam::111122223333:role/approved-operator'
            e['CC_M4_MOCK_CALLER_ARN']='arn:aws:sts::111122223333:assumed-role/other-admin/console'
            p=subprocess.run(['bash',str(LAUNCH),'preflight'],env=e,
                             capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,2)
            self.assertIn('STS assumed-role identity differs',p.stderr)
            e['CC_M4_MOCK_CALLER_ARN']='arn:aws:iam::111122223333:user/other-admin'
            p=subprocess.run(['bash',str(LAUNCH),'preflight'],env=e,
                             capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,2)
            self.assertIn('STS assumed-role identity differs',p.stderr)
            e['CC_M4_MOCK_CALLER_ARN']='arn:aws:sts::111122223333:assumed-role/approved-operator/cloudshell-user'
            p=subprocess.run(['bash',str(LAUNCH),'create'],env=e,
                             input='',capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,2)
            self.assertIn('billing/change authorization not acknowledged',p.stderr)
            e['CC_M4_OPERATOR_BILLING_APPROVED']='APPROVED_BILLABLE_EC2'
            e['CC_M4_OPERATOR_SSM_NETWORK_REVIEW']='REVIEWED_SSM_CONNECTIVITY'
            p=subprocess.run(['bash',str(LAUNCH),'create'],env=e,
                             input='',capture_output=True,text=True,timeout=12)
            self.assertEqual(p.returncode,2)
            self.assertIn('interactive human confirmation required',p.stderr)
            self.assertNotIn('create-stack', log.read_text())

if __name__ == '__main__':
    unittest.main()
