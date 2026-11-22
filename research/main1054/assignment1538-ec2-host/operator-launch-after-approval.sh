#!/usr/bin/env bash
# M1538: Human-initiated AWS native research host creation. NEVER run in CI.
# In preflight mode this script is read-only. Creation is interactive and billable.
set -euo pipefail
blocked(){ printf 'BLOCKED: %s\n' "$1" >&2; exit 2; }
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
mode="${1:-preflight}"
case "$mode" in preflight|create) ;; *) blocked 'usage: operator-launch-after-approval.sh [preflight|create]' ;; esac
for name in CC_M4_AWS_REGION CC_M4_VPC_ID CC_M4_PRIVATE_SUBNET_ID CC_M4_INSTANCE_TYPE CC_M4_APPROVAL_REFERENCE CC_M4_OPERATOR_IAM_PRINCIPAL_ARN; do
  [ -n "${!name:-}" ] || blocked "missing ${name}; no AWS creation attempted"
done
bash "$script_dir/operator-readiness.sh"
account="$(aws --region "$CC_M4_AWS_REGION" sts get-caller-identity --query Account --output text)" || blocked 'STS account lookup failed'
[[ "$account" =~ ^[0-9]{12}$ ]] || blocked 'unexpected STS account identity'
[[ "$CC_M4_OPERATOR_IAM_PRINCIPAL_ARN" =~ ^arn:aws:iam::([0-9]{12}):(role|user)/[a-zA-Z0-9+=,.@_/-]+$ ]] || blocked 'invalid IAM operator principal ARN'
[ "${BASH_REMATCH[1]}" = "$account" ] || blocked 'IAM operator principal belongs to a different AWS account'
zone="$(aws --region "$CC_M4_AWS_REGION" ec2 describe-subnets --subnet-ids "$CC_M4_PRIVATE_SUBNET_ID" --query 'Subnets[0].AvailabilityZone' --output text)" || blocked 'subnet AZ lookup failed'
[[ "$zone" =~ ^[a-z]{2}(-gov)?-[a-z]+-[0-9]+[a-z]$ ]] || blocked 'invalid subnet AZ'
offering="$(aws --region "$CC_M4_AWS_REGION" ec2 describe-instance-type-offerings --location-type availability-zone --filters "Name=location,Values=$zone" "Name=instance-type,Values=$CC_M4_INSTANCE_TYPE" --query 'InstanceTypeOfferings[0].InstanceType' --output text)" || blocked 'instance availability lookup failed'
[ "$offering" = "$CC_M4_INSTANCE_TYPE" ] || blocked 'approved instance type not offered in selected AZ'
stack_name='cc-m4-native-research-HOLD'
printf 'CC_M4_READ_ONLY_DEPLOYMENT_GATE_PASS stack=%s region=%s azChecked=true accountMatchesOperator=true ec2Offered=true cloudResourcesCreated=false originalFaultObserved=false familyAlpha=HOLD\n' "$stack_name" "$CC_M4_AWS_REGION"
if [ "$mode" = preflight ]; then
  printf 'NEXT: independent IAM, billing and native tracing approvals; run create mode only with approval.\n'
  exit 0
fi
[ "${CC_M4_OPERATOR_BILLING_APPROVED:-}" = 'APPROVED_BILLABLE_EC2' ] || blocked 'independent billing/change authorization not acknowledged'
[ "${CC_M4_OPERATOR_SSM_NETWORK_REVIEW:-}" = 'REVIEWED_SSM_CONNECTIVITY' ] || blocked 'SSM/NAT or VPC endpoint connectivity review absent'
[ -t 0 ] || blocked 'interactive human confirmation required; unattended cloud provisioning prohibited'
printf 'About to create a BILLABLE EC2 instance and a new SSM IAM role; review the independent change ticket.\n'
printf 'Type the exact stack name %s to authorize this create-stack call: ' "$stack_name"
IFS= read -r confirm
[ "$confirm" = "$stack_name" ] || blocked 'human confirmation mismatch; no AWS creation attempted'
stack_id="$(aws --region "$CC_M4_AWS_REGION" cloudformation create-stack \
  --stack-name "$stack_name" \
  --template-body "file://$script_dir/host.cfn.yaml" \
  --parameters \
    "ParameterKey=VpcId,ParameterValue=$CC_M4_VPC_ID" \
    "ParameterKey=PrivateSubnetId,ParameterValue=$CC_M4_PRIVATE_SUBNET_ID" \
    "ParameterKey=InstanceType,ParameterValue=$CC_M4_INSTANCE_TYPE" \
    "ParameterKey=ApprovalReference,ParameterValue=$CC_M4_APPROVAL_REFERENCE" \
    "ParameterKey=OperatorIamPrincipalArn,ParameterValue=$CC_M4_OPERATOR_IAM_PRINCIPAL_ARN" \
  --capabilities CAPABILITY_NAMED_IAM \
  --query StackId --output text)" || blocked 'CloudFormation create-stack rejected; investigate AWS service events; do not bypass controls'
printf 'CC_M4_STACK_CREATE_REQUESTED stack=%s stackId=%s nativeTraceAuthorized=false familyAlpha=HOLD\n' "$stack_name" "$stack_id"
aws --region "$CC_M4_AWS_REGION" cloudformation wait stack-create-complete --stack-name "$stack_name" || blocked 'stack did not complete; inspect CloudFormation events and cost before retrying'
aws --region "$CC_M4_AWS_REGION" cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
printf 'CC_M4_HOST_PROVISIONED_ONLY: separately verify Session Manager, cloud-init, source/binary SHA/BuildID and native observation rights. Original ONNX fault NOT yet captured. HOLD #255.\n'
