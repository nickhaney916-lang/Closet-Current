#!/usr/bin/env bash
# READ-ONLY: requires an independently authorized AWS operator. No deploy or debugger attach.
set -euo pipefail
blocked() { printf 'BLOCKED: %s\n' "$1" >&2; exit 2; }
for key in CC_M4_AWS_REGION CC_M4_VPC_ID CC_M4_PRIVATE_SUBNET_ID CC_M4_INSTANCE_TYPE CC_M4_APPROVAL_REFERENCE; do
  value=$(printenv "$key" 2>/dev/null || true)
  [ -n "$value" ] || blocked "missing required $key; no cloud changes attempted"
done
[ "$CC_M4_INSTANCE_TYPE" = m7i.xlarge ] || [ "$CC_M4_INSTANCE_TYPE" = m7i.2xlarge ] || blocked 'unreviewed instance type'
[[ "$CC_M4_APPROVAL_REFERENCE" =~ ^CC-M4-[A-Za-z0-9-]{8,94}$ ]] || blocked 'invalid approval reference (not itself approval)'
[[ "$CC_M4_VPC_ID" =~ ^vpc-[0-9a-f]{8,17}$ ]] || blocked 'malformed VPC ID'
[[ "$CC_M4_PRIVATE_SUBNET_ID" =~ ^subnet-[0-9a-f]{8,17}$ ]] || blocked 'malformed subnet ID'
[[ "$CC_M4_AWS_REGION" =~ ^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$ ]] || blocked 'malformed region'
command -v aws >/dev/null 2>&1 || blocked 'AWS CLI unavailable'
script_dir="$(cd -- "$(dirname -- "$0")" && pwd -P)"
template="$script_dir/host.cfn.yaml"
[ -s "$template" ] || blocked 'CloudFormation template missing'

# The operator's account identifier is verified but not printed.
aws --region "$CC_M4_AWS_REGION" sts get-caller-identity --query Account --output text >/dev/null || blocked 'AWS identity unavailable'
aws --region "$CC_M4_AWS_REGION" cloudformation validate-template --template-body "file://$template" --output json >/dev/null || blocked 'CloudFormation rejected template'
subnet_vpc=$(aws --region "$CC_M4_AWS_REGION" ec2 describe-subnets --subnet-ids "$CC_M4_PRIVATE_SUBNET_ID" --query 'Subnets[0].VpcId' --output text) || blocked 'subnet lookup denied'
[ "$subnet_vpc" = "$CC_M4_VPC_ID" ] || blocked 'subnet and VPC do not match'
subnet_state=$(aws --region "$CC_M4_AWS_REGION" ec2 describe-subnets --subnet-ids "$CC_M4_PRIVATE_SUBNET_ID" --query 'Subnets[0].State' --output text) || blocked 'subnet state unavailable'
[ "$subnet_state" = available ] || blocked 'subnet is not available'
public_ip=$(aws --region "$CC_M4_AWS_REGION" ec2 describe-subnets --subnet-ids "$CC_M4_PRIVATE_SUBNET_ID" --query 'Subnets[0].MapPublicIpOnLaunch' --output text) || blocked 'subnet public IP policy unavailable'
[ "$public_ip" = False ] || [ "$public_ip" = false ] || blocked 'subnet automatically maps public IPs'
ami=$(aws --region "$CC_M4_AWS_REGION" ssm get-parameter --name /aws/service/canonical/ubuntu/server/noble/stable/current/amd64/hvm/ebs-gp3/ami-id --query 'Parameter.Value' --output text) || blocked 'Canonical Ubuntu 24.04 AMI unavailable'
[[ "$ami" =~ ^ami-[0-9a-f]{8,17}$ ]] || blocked 'invalid AMI resolver output'
printf 'CC_M4_OPERATOR_READ_ONLY_PREFLIGHT_PASS region=%s instanceType=%s ubuntuAmiResolved=true accountIdentityVerified=true templateValidated=true subnetVpcMatched=true subnetPublicIpDefault=false cloudResourcesCreated=false nativeTraceAuthorized=false familyAlpha=HOLD\n' "$CC_M4_AWS_REGION" "$CC_M4_INSTANCE_TYPE"
printf 'NEXT_GATE: separately approved IAM/native debugging and explicit operator deployment required.\n'
