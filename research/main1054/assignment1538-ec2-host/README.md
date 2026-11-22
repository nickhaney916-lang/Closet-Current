# Mission 4 — separately controlled EC2 native research host (HOLD)

**Status: template created, NOT deployed, NOT an authorization certificate, and NOT a native fault capture.** The host must be created in an independently authorized AWS account/subnet by an operator whose IAM access is reviewed outside the project repo. Neither providing an approval tag nor creating a VM proves debugger authorization. **Family Alpha #255 remains HOLD.**

## Designed capabilities and safeguards

* One dedicated Ubuntu 24.04 amd64 EC2 VM, intended for full native process debugging; an existing approved private subnet with outbound SSM/updates connectivity is required. The AMI is resolved from Canonical's public SSM parameter at launch and the resolved ID must be recorded. The original WebKit/JSC executable and source hashes are **not** automatically installed or manufactured by the stack.
* **No public IPv4 and no ingress firewall rules.** The IAM instance role grants SSM managed-node rights only, not production wardrobe or customer access. Operator IAM rights to initiate SSM sessions are **not granted by the stack**; a separate cloud administrator must approve and scope those rights. Outbound 80/443 permits approved OS package mirrors, SSM and source downloads over the private subnet's existing NAT/routing; restrict further using organization controls as appropriate.
* Encrypted 100 GB gp3 root volume, IMDSv2, dedicated non-sudo `ccnative` account, native `gdb`, `binutils`, `clang`, compilers, Python and Git installed by cloud-init. This is a host build, not an automatic launch of any debugger or original-model workload.
* **No `--privileged`, Docker security changes, `ptrace_scope`/seccomp/capability edits, kernel override or host sandbox bypass.** A separately approved operator may run the optional child-only synthetic native PC/address probe in this controlled VM; it makes no claim about the original ONNX failure.

## Read-only AWS readiness check before an authorized launch

Run the host preflight from an **independently approved operator workstation**
with AWS CLI and an authorized IAM identity. Do not supply cloud credentials
or private account identifiers in ChatGPT or GitHub logs.

```bash
export CC_M4_AWS_REGION=YOUR_APPROVED_REGION
export CC_M4_VPC_ID=YOUR_APPROVED_VPC_ID
export CC_M4_PRIVATE_SUBNET_ID=YOUR_APPROVED_PRIVATE_SUBNET_ID
export CC_M4_INSTANCE_TYPE=m7i.xlarge
export CC_M4_APPROVAL_REFERENCE=CC-M4-YOUR-CHANGE-TICKET
bash ./operator-readiness.sh
```

This script performs only read operations: STS identity check, AWS CloudFormation
template validation, VPC/subnet consistency, private IPv4-assignment default
and Canonical Ubuntu 24.04 AMI availability. It **does not** create instances,
change IAM/security settings, start a debugger, verify SSM endpoint routing,
approve billing or establish authorization for native tracing.
**A green preflight means deployment is possible to evaluate, not approved.**

## Infrastructure administrator steps (explicit approval / cloud billing)

1. Approve the AWS account, research VPC, *private subnet*, native debugging scope, operator IAM principal and billing budget **before** creating any resources. Choose an x86-64 compatible `m7i.xlarge` or `m7i.2xlarge` in an available region. Require an independent approval ticket and preserve it in your normal change-control system. Subnet must have SSM endpoint/NAT access; do not use production/private-photo resources.
2. Review `host.cfn.yaml`, especially IAM/SecurityGroup and `UserData`. Validate and create the stack from an authorized AWS admin shell (do not paste credentials into ChatGPT):

   ```bash
   aws cloudformation validate-template --template-body file://host.cfn.yaml
   aws cloudformation create-stack --stack-name cc-m4-native-research-HOLD \
     --template-body file://host.cfn.yaml \
     --parameters \
       ParameterKey=VpcId,ParameterValue=YOUR_APPROVED_VPC_ID \
       ParameterKey=PrivateSubnetId,ParameterValue=YOUR_APPROVED_PRIVATE_SUBNET_ID \
       ParameterKey=ApprovalReference,ParameterValue=CC-M4-YOUR-CHANGE-TICKET \
       ParameterKey=OperatorIamPrincipalArn,ParameterValue=YOUR_REVIEWED_IAM_PRINCIPAL_ARN \
     --capabilities CAPABILITY_NAMED_IAM
   ```

   This starts a **billable EC2 host**. CloudFormation requires the VPC and subnet to belong together; the template deliberately does not generate a public subnet or relax IAM policies. The operator is responsible for checking stack creation/SSM reachability and CloudFormation event logs.
3. After separate IAM Session Manager approval, log in using the stack's `SessionManagerCommand` output. Verify `cc-m4-host-status` prints `HOST_PROVISIONED_ONLY`, *not* `NATIVE_TRAP_CAPTURED`. Confirm `cloud-init status --wait` succeeded and review installed packages. Do not treat any host with unavailable SSM, missing OS dependencies or unexpected build IDs as ready.
4. Under `/opt/cc-m4` provision an **independently verified frozen WebKit** source checkout at `db897909f7c31d9b38793374c66427b6a4cb3dd3` plus the **Playwright downstream bootstrap patch** Git blob `f713c6fa093a1f45956c84844d50635376923b75`. Obtain exactly original Playwright 1.56.1 / WebKit 26.0 r2215 binaries, original P94 Worker blob `ab7d3837139c5b7d693383f9d6617e199ec8de4f`, original fp32 SegFormer ONNX SHA `02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3` (15,199,746 bytes) and original JSEP SHA `c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39` (21,596,019 bytes). Supply assets through independently controlled secure sources; never put full weights or family/private data in repository/CI logs. This step is **not automated by the CloudFormation template**.
5. Run existing `node research/main1054/assignment1538-native-host.mjs --preflight /private/native-host-paths.json` after installing a verified Node 22+ runtime. It must return `PINNED_HOST_FILES_VERIFIED_ONLY`; all other outputs mean stop. This does not prove that the live renderer loaded each library or that debugging is authorized.
6. **Only with a separate authorization specifically for native tracing**, you may compile `synthetic-native-probe.c` and execute it as the isolated `ccnative` account. The test traces only its own child, never WebKit, and is a positive/negative-control prerequisite; failure means stop, do not change security policy as a workaround. Compile with `cc -O0 -Wall -Wextra -Werror synthetic-native-probe.c -o synthetic-native-probe` and run `./synthetic-native-probe`. All printed results are synthetic-only.
7. A real original-model trace requires an operator-controlled debugger or a source-matched instrumented JSC engine, independently attested browser/renderer PIDs, birth ticks, module/model hashes, and a **new natural first-attempt** original `OrtCreateSession` failure. Capture the actual JIT-origin→WASM instruction coordinate (or independently mapped native machine PC), **internal effective access address, width and live linear memory bytes** at the same trap. For an out-of-bounds operation, validate `effectiveAddress + accessBytes > liveMemoryBytes`; the original input pointer is *not* that internal address. If the recorded access is in bounds, keep it in bounds and investigate another mechanism—never edit the receipt to force a bounds conclusion.
8. Hand the independently approved signed trap receipt and original debug mapping to the existing `assignment1538-correlate.mjs`, then report exact C++ source only if attested. Test a source-justified isolated correction against a genuine original RED-before/GREEN-after comparison on WebKit and Chromium. **Do not call an instrumented custom binary identical to the original shipped WebKit.** Preserve every original failure and HOLD #255.

## Clean shutdown

EC2 and the EBS volume incur charges while allocated. After an approved experiment, terminate the instance through reviewed change control and delete the CloudFormation stack. Do not abandon a running machine. Preserve only sanitized approved evidence; follow the operator's retention policy. No production deployments, Family Alpha actions or private wardrobe/photo data are allowed.

## Verification scope

This package's automated checks validate infrastructure configuration, template syntax at the YAML structure level, synthetic C source compilation and forbidden security changes. They **do not** execute CloudFormation, connect to AWS, activate a debugger, verify original WebKit binary presence, or capture a native ONNX memory fault. The actual source/binary host preflight is an existing independent requirement, not a cloud provisioning test.
