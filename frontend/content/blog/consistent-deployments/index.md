---
title: Consistent deployments - a real-world case scenario
date: "2024-06-09T11:20:32.169Z"
description: Some comments I would like to address about consistent deployments
---

Recently I was part of a project that didn't have consistent deployments (infra and application-related). I'll go over some problems faced by the client and the proposed solution for that.

## Deployment state
The client had two repositories: one for infrastructure and another one for all the applications (Lambdas and Glue jobs). The CI/CD of the application repository was responsible for running tests, building the Docker image, pushing the image (latest tag) to the ECR of the environment, and updating Lambda code to use this new code version. The CI/CD of the infra repository was responsible for planning the changes and then deploying the changes to the infrastructure (Lambda, Glue jobs and other things).

Before we start to comment on it I would like to clarify some concepts (I will use these words a lot during this blog post):
- **Artifacts (assets)**: It represents the application. In our case Docker images (used in the Lambdas). It could be another thing, such as a JAR file, a zip file containing application code, or Python scripts for Glue jobs...
- **Manifest**: Declarative configuration of the infrastructure. In our case, it will be Terraform files, but it could have been CDK code, CloudFormation template, Pulumi code...

At first glance, this looks perfectly fine. Indeed, I've seen that multiple times in multiple clients, but there are several problems here and I would highlight four:

1) Deployments are not atomic. The configuration/infra and artifact should be deployed simultaneously: either both are successfully deployed, or neither is.

Ensuring that both the application code (artifact) and its configuration are deployed together reduces the risk of incompatibilities because partial deployments can lead to failures and unexpected behaviors if the configuration does not match the deployed code. Also, managing dependencies and orchestrating deployments to ensure they happen simultaneously can be challenging.

Imagine the scenario where a Lambda needs to access a new cloud resource (e.g. S3, SQS...). If the application code is updated before the IAM Role has the needed permissions it can lead to failures. We want to deploy the new code with the needed permissions simultaneously. The same problem would happen if it was a new code that requires more memory/CPU or a new environment variable.

2) Different artifacts are being used in different environments. There is no artifact promotion involved.

For every environment, a new Docker image is being built and pushed to ECR. Deploying the same artifact that was tested ensures the environment closely mirrors the one in which the artifact was validated (i.e. production environment should use the same artifact that was tested in staging, that should use the same artifact that was tested in development). This reduces the risk of deploying untested or modified artifacts.

Even when using a Dockerfile it's possible to generate two different artifacts. There are potential causes for that, such as:

- Environment differences: Development applications might have additional debugging tools or dependencies that are not present in production.
- External resources: If the build process relies on external resources that can change over time this can lead to non-deterministic builds.
- Dependency version: When not specifying versions when installing dependencies (e.g. `apt install`, `npm install`, `pip install`) the latest version will be used, which can be different from development and production depending on when the build ran.

Even if you are not satisfied with this answer, there is a cost impact. We are multiplying our costs based on the number of environments. We are storing the "same" build over different environments, instead of having a centralized place to store the artifacts.

3) There is not an easy way to revert configuration/infra and artifact.

It's a common requirement for deployment systems to be able to rollback in case of issues with the new release. The way to do it on the presented scenario is to revert the infra change (revert PR on the infrastructure repository) and revert the application change (revert PR on the application repository). We would still wait for the CI/CD to run to generate new assets. Oh, and we would have to wait for deployment in development, staging, and production (assuming only 3 environments).

4) Every time a new deployment is done, manifests get outdated (drift is shown)

Since the application repository has a CD that forces the update of a new Lambda, this will generate a drift in the infra repository, because the infra repository state applied in the past a different manifest (even if the Docker image is the same as the hash of the image is different - it's a different artifact!).

## Looking for solutions

We can improve by a lot the deployment reliability/consistency, let's check some important points to consider.

### Application versioning
If you are using the same Docker tag for your deployments you are not versioning your application (e.g. using `dev` or `latest` for the development environment). This is a big problem. If you are using the same image tag you don't know what version of your application is running and don't have an easy way to run a previous version.

There are two widely used options to version your artifacts: [Semantic Versioning](https://semver.org/) (SemVer) and Git Hash.

SemVer uses a part number system `MAJOR.MINOR.PATCH` (e.g. `1.5.4`). You are probably very familiar with SemVer because it's widely used in the IT world. It's readable (it's just tree numbers!), easy to communicate ("We just deployed version X.Y.Z"), and predictable (if it's a major change you can expect breaking changes). On the other hand, the initial overhead to implement can be challenging and you don't know what a given version represents in code (unless you use Git tags).

Git hash is even more familiar to you because every developer knows (at least that's what I expect...) Git. A SHA-1 hash that is unique and identifies a commit in a Git repository. It's commonly used because it maps to a specific point in the repository's history (just do `git checkout <GIT_HASH>` and you can see it!), making it easier to understand exactly what code is being used, and it's easy to implement in CI/CD pipelines since you don't need to worry if the change is a breaking change, minor change or a patch/hotfix to name your version, it's simply the git hash. On the other hand, the readability is terrible ("Hey, I'm deploying version 7b2d773") and it's meaningless (it's a hash and that's it - you can't get good information from it).

I've worked with both approaches and my personal choice is SemVer, although the initial setup is harder, I think it pays off in the long run, but of course, this depends on several things, such as the deadline, personal preference of the team, maturity of the team (not everyone knows if they should increment a major, a minor or a patch).

### IaaC as the source of truth
Drifts are happening because we are not treating the infrastructure repository as the source of truth. We shouldn't deploy a new application version from the application repository. From the artifacts point of view, the application repository should only build new artifacts.

The ultimate goal is to have the infrastructure repository in a 1:1 relationship with what we have deployed. In other words, the infrastructure repository should be the source of truth when it comes to what we have deployed in the environments. This is completely achievable but hard, especially if we are talking about ephemeral deployments, but this is a subject for another time.

The artifact version should be managed by the application repository! Well, it can be done manually, but we - as DevOps - hate manual things, and automation is the way to go. The CD of the application repository should open a Pull Request to modify the version of the application in the manifests. E.g. if you are using Terraform it can simply be a change on the variable in the `var.tfvars` file that corresponds to the version of the application Lambda. To be honest, the CD can directly push to the main/master branch of the infrastructure repository but this can be very risky and seen as not a good practice by some DevOps Engineers.

If the change does not require infrastructure change (IAM permission, new environment variable, changes on the memory/cpu), the developers can simply merge the PR. Otherwise, changes can be implemented on this pull request to deploy infra and code changes at the same time. Notice that team coordination is ALWAYS important. If a new version needs to be deployed and this new version requires infrastructure change this needs to be aware by all the team (dev + ops).

### Monorepo x Multi-Repo
I mentioned that the client used a multi-repo approach: one for the infrastructure and another for the applications (a single repository per application would also have the same impact). A possible solution is to use a monorepo approach: infrastructure and application code on the same git repository.

A single pull request that changes infra and application code would do the trick. Atomic changes are a big pro of using a monorepo strategy.

To be honest, I'm not a big fan of having applications and infrastructure together on the same repository. I rather have a clear separation using different repositories. This way you can have an easier way to controll access to codebase, an independent development cycle, and higher performance (faster cloning, building, testing).

If you go for a monorepo approach you will need more collaboration from your team, i.e., if the application team wants to deploy a new code that uses a new environment variable, it needs to collaborate with the infrastructure team to add this environment variable simultaneously.

### Centralized assets
As we commented, deploying the "same" assets in different accounts it's not a good practice. Ideally, you should have a centralized place to put your assets (scripts, images). Many companies use the production environment for that and I don't like that.

The best practice is to have a specific AWS account only for the assets. This account can also be used to host all CI/CD (if you decide to use CodePipeline, CodeBuild, or CodeDeploy).

All the other environments (e.g. `dev`, `staging`, `prod`) should be able (cross-account permissions) to pull assets from this account!

### Hotfix workflow
Imagine the following scenario: the new application version was tested in dev, staging, and production. It's running fine for some time but suddenly you start to see several errors related to your application and you NEED to rollback the version in production.

A hotfix workflow is a workflow that runs directly in production to fix things as fast as possible. You don't want to run tests, build (remember that the old asset already exists!), and other things. You just want to fix the problem as fast as possible. You might see some DevOps that allows you to add new code (instead of rolling back the version) in the hotfix workflow, this is also possible, but I think rolling back is safer.

## Hands-on
I'll propose the following solution:
- Multi-repo approach
- Application repository builds and push assets to assets account and creates a pull request (remember to enable that in the GitHub Actions settings of the repository) to the infrastructure repository to update image being used
- Git hash to version images

I wouldn't write this and not demo what I'm saying! To demo this I chose the following stack:
- **AWS**: For the Cloud provider.
- **ECR**: For the container registry.
- **Python**: For the Application (Lambda) code. It's a dummy application, don't worry!
- **Terraform**: For the infrastructure deployment.
- **GitHub Actions**: For the CI/CD.

Some things were created beforehand because they were used in another personal projects or because manual creation is the way to go:
- **IAM Identity Provider**: GitHub
- **IAM Role**: Role that will be assumed by GitHub CI/CD using OIDC
- **Github Actions Environments**: 3 environments that require manual approval (`assets`, `dev` and `prod`)
- **GIthub Secrets**: Added `PAT_GITHUB_TOKEN` to the application repository (needed to create pull requests on the infrastructure repository)
- **S3 Buckets**: To store Terraform state

### Application
Let's check the application code:

```python
import os

import cowsay


def lambda_handler(event, context):
    print(f"event ==> ${event}")
    cowsay.cow(os.environ["TO_SAY"])
```

It's a simple application that uses `cowsay`! The code will run as a dockerized lambda that has the following Dockerfile:

```dockerfile
FROM public.ecr.aws/lambda/python:3.11
COPY requirements.txt  .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"
COPY .  .
CMD [ "main.lambda_handler" ]
```

The CI/CD contains two jobs (`build-and-push` and `infra-pr`):

```yaml
name: Application CI/CD

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  id-token: write
  contents: write
  pull-requests: write

env:
  AWS_ACCOUNT_ID: "730335516527"
  AWS_IAM_ROLE_OIDC_NAME: "GitHubActions"
  AWS_REGION: "us-east-1"
  ECR_REPO_NAME: "consistent-deployments"
  INFRA_REPOSITORY: felipelaptrin/consistent-deployments-infra-blog

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        env:
          ECR_REPOSITORY: ${{ env.ECR_REPO_NAME }}
          IMAGE_TAG: ${{ github.sha }}
        run: docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

      - name: Configure AWS Credentials
        if: github.ref == 'refs/heads/main'
        uses: aws-actions/configure-aws-credentials@v3
        with:
          role-to-assume: arn:aws:iam::${{ env.AWS_ACCOUNT_ID }}:role/${{ env.AWS_IAM_ROLE_OIDC_NAME }}
          aws-region: ${{ env.AWS_REGION }}
          role-session-name: GitHubActions

      - name: Push image to Amazon ECR
        if: github.ref == 'refs/heads/main'
        env:
          ECR_REGISTRY: ${{ env.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com
          ECR_REPOSITORY: ${{ env.ECR_REPO_NAME }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          aws ecr get-login-password --region ${{ env.AWS_REGION }} | docker login --username AWS --password-stdin ${{ env.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com
          docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

  infra-pr:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [build-and-push]
    steps:
      - name: Checkout the infrastructure repository
        uses: actions/checkout@v4
        with:
          repository: ${{ env.INFRA_REPOSITORY }}
          token: ${{ secrets.PAT_GITHUB_TOKEN }}

      - name: Set up Git
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'

      - name: Update app_version (tfvars file)
        env:
          VERSION: ${{ github.sha }}
        run: |
          sed -i -E 's/(app_version\s*=\s*").*"/\1'"${VERSION}"'"/' dev/dev.tfvars
          sed -i -E 's/(app_version\s*=\s*").*"/\1'"${VERSION}"'"/' prod/prod.tfvars

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v4
        with:
            token: ${{ secrets.PAT_GITHUB_TOKEN }}
            commit-message: Update application version to ${{ github.sha }}
            title: Update application version to ${{ github.sha }}
            body: This was created by Application CI/CD.
            base: main
            branch: feat/${{ github.sha }}
```

### Infrastructure
The infrastructure contains two modules: ECR and Lambda. The ECR module contains the following resources:

```hcl
# ECR
locals {
  account_ids = {
    dev    = "937168356724"
    prod   = "654654203090"
    assets = "730335516527"
  }
  base_name = "consistent-deployments"
}

resource "aws_ecr_repository" "this" {
  name                 = local.base_name
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository_policy" "this" {
  repository = aws_ecr_repository.this.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = values(local.account_ids)
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ],
        Condition = {
          StringLike = {
            "aws:sourceArn": [ for account in values(local.account_ids) : "arn:aws:lambda:${var.aws_region}:${account}:function:*" ]
          }
        }
      }
    ]
  })
}
```

The Lambda module contains the following resources:

```hcl
# LAMBDA
locals {
  account_ids = {
    dev    = "937168356724"
    prod   = "654654203090"
    assets = "730335516527"
  }
  base_name = "consistent-deployments"
}

data "aws_iam_policy_document" "this" {
  count = var.deploy ? 1 : 0
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "this" {
  count = var.deploy ? 1 : 0

  name               = local.base_name
  assume_role_policy = data.aws_iam_policy_document.this[0].json
}

resource "aws_iam_role_policy" "this" {
  count = var.deploy ? 1 : 0

  name = "lambda-policy"
  role = aws_iam_role.this[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:ecr:${var.aws_region}:${local.account_ids.assets}:repository/${local.base_name}"
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "this" {
  count = var.deploy ? 1 : 0

  function_name = "${var.environment}-${local.base_name}"
  role          = aws_iam_role.this[0].arn
  image_uri     = "${var.ecr_repo_url}:${var.app_version}"
  package_type  = "Image"
  environment {
    variables = {
      TO_SAY = "Hello from Lambda!"
    }
  }
}
```

We have two GitHub Actions workflows. The first one is for the normal deployment of the infrastructure that contains two jobs per environment: one for generating the plan (tf plan) of the deployment and another one for deploying. The second is the hotfix workflow.

```yaml
name: Infrastructure CI/CD

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  id-token: write
  contents: read

jobs:
  plan-assets:
    name: Plan assets infra deployment
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Plan assets deployment
        uses: ./.github/actions/plan-infra
        with:
          environment: assets
          working_directory: assets
          aws_account_id: 730335516527

  deploy-assets:
    if: github.ref == 'refs/heads/main'
    name: Deploy assets infra
    needs: [plan-assets]
    runs-on: ubuntu-latest
    environment:
      name: assets
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy assets deployment
        uses: ./.github/actions/deploy-infra
        with:
          environment: assets
          working_directory: assets
          aws_account_id: 730335516527

  plan-dev:
    name: Plan dev infra deployment
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Plan dev deployment
        uses: ./.github/actions/plan-infra
        with:
          environment: dev
          working_directory: dev
          aws_account_id: 937168356724

  deploy-dev:
    if: github.ref == 'refs/heads/main'
    name: Deploy dev infra
    needs: [plan-dev, deploy-assets]
    runs-on: ubuntu-latest
    environment:
      name: dev
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Plan dev deployment
        uses: ./.github/actions/deploy-infra
        with:
          environment: dev
          working_directory: dev
          aws_account_id: 937168356724

  plan-prod:
    name: Plan prod infra deployment
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Plan prod deployment
        uses: ./.github/actions/plan-infra
        with:
          environment: prod
          working_directory: prod
          aws_account_id: 654654203090

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    name: Deploy prod infra
    needs: [plan-prod, deploy-dev]
    runs-on: ubuntu-latest
    environment:
      name: prod
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Plan prod deployment
        uses: ./.github/actions/deploy-infra
        with:
          environment: prod
          working_directory: prod
          aws_account_id: 654654203090
```

These jobs are very repetitive, so to make it easier to reuse and avoid repetition the following actions were created:

```yaml
name: plan-environment
description: Plan Opentofu
inputs:
  environment:
    description: Environment name - accepts `dev` and `prod`
    required: true
  working_directory:
    description: Working directory
    required: true
  aws_account_id:
    description: AWS Account ID to run
    required: true
  aws_iam_role_oidc_name:
    description: Name of the IAM Role that will be assumed via OIDC
    default: "GitHubActions"
  aws_region:
    description: AWS region
    default: "us-east-1"
  opentofu_version:
    description: OpenTofu version to use
    default: 1.7.2

runs:
  using: "composite"
  steps:
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v3
      with:
        role-to-assume: arn:aws:iam::${{ inputs.aws_account_id }}:role/${{ inputs.aws_iam_role_oidc_name }}
        aws-region: ${{ inputs.aws_region }}
        role-session-name: GitHubActions

    - uses: opentofu/setup-opentofu@v1
      with:
        tofu_wrapper: false
        tofu_version: ${{ inputs.opentofu_version }}

    - name: Opentofu init
      shell: bash
      working-directory: ${{ inputs.working_directory }}
      run: tofu init

    - name: Opentofu plan
      shell: bash
      working-directory: ${{ inputs.working_directory }}
      run: |
 if find . -maxdepth 1 -name "*.tfvars" | grep -q .; then
 tofu plan -out tf-${{ inputs.environment }}.plan -lock=false -var-file="${{ inputs.environment }}.tfvars"
 else
 tofu plan -out tf-${{ inputs.environment }}.plan -lock=false
 fi

    - name: Upload Opentofu plan file as artifact
      uses: actions/upload-artifact@v4
      with:
        name: tfplan-${{ inputs.environment }}
        path: ${{ inputs.working_directory }}/tf-${{ inputs.environment }}.plan
```

and

```yaml
name: deploy-environment
description: Deploy Opentofu
inputs:
  environment:
    description: Environment name - accepts `dev` and `prod`
    required: true
  working_directory:
    description: Working directory
    required: true
  aws_account_id:
    description: AWS Account ID to run
    required: true
  aws_iam_role_oidc_name:
    description: Name of the IAM Role that will be assumed via OIDC
    default: "GitHubActions"
  aws_region:
    description: AWS region
    default: "us-east-1"
  opentofu_version:
    description: OpenTofu version to use
    default: 1.7.2

runs:
  using: "composite"
  steps:
    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v3
      with:
        role-to-assume: arn:aws:iam::${{ inputs.aws_account_id }}:role/${{ inputs.aws_iam_role_oidc_name }}
        aws-region: ${{ inputs.aws_region }}
        role-session-name: GitHubActions

    - uses: opentofu/setup-opentofu@v1
      with:
        tofu_wrapper: false
        tofu_version: ${{ inputs.opentofu_version }}

    - name: Opentofu init
      shell: bash
      working-directory: ${{ inputs.working_directory }}
      run: tofu init

    - name: Download Opentofu plan from previous action
      uses: actions/download-artifact@v4
      with:
        name: tfplan-${{ inputs.environment }}
        path: ${{ inputs.working_directory }}

    - name: OpenTofu Apply
      shell: bash
      working-directory: ${{ inputs.working_directory }}
      run: tofu apply -input=false -lock-timeout=600s tf-${{ inputs.environment }}.plan
```

The hotfix workflow is the following:

```yaml
name: Hotflow CI/CD

on:
  workflow_dispatch:
    inputs:
      rollback_version:
        description: Version that should be used to rollback the application
        required: true

permissions:
  id-token: write
  contents: write

jobs:
  plan-prod:
    name: Plan prod infra deployment
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Rollback app_version
        env:
          VERSION: ${{ github.event.inputs.rollback_version }}
        run: sed -i -E 's/(app_version\s*=\s*").*"/\1'"${VERSION}"'"/' prod/prod.tfvars

      - name: Plan prod deployment
        uses: ./.github/actions/plan-infra
        with:
          environment: prod
          working_directory: prod
          aws_account_id: 654654203090

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    name: Deploy prod infra
    needs: [plan-prod]
    runs-on: ubuntu-latest
    environment:
      name: prod
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy prod deployment
        uses: ./.github/actions/deploy-infra
        with:
          environment: prod
          working_directory: prod
          aws_account_id: 654654203090

      - name: Set up Git
        run: |
 git config --global user.name 'github-actions[bot]'
 git config --global user.email 'github-actions[bot]@users.noreply.github.com'

      - name: Rollback app_version
        env:
          VERSION: ${{ github.event.inputs.rollback_version }}
        run: sed -i -E 's/(app_version\s*=\s*").*"/\1'"${VERSION}"'"/' prod/prod.tfvars

      - name: Push changes
        uses: ad-m/github-push-action@v0.8.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: main
```

#### Assets account
The assets account will only use the ECR module:

```hcl
# main.tf

module "this" {
  source      = "../modules/ecr"
  aws_region  = "us-east-1"
  environment = "assets"
}
```

#### Dev account
The dev account will use only the Lambda module.

```hcl
# main.tf

data "terraform_remote_state" "assets" {
  backend = "s3"
  config = {
    bucket = "terraform-states-730335516527"
    key    = "consistent-deployments.tfstate"
    region = "us-east-1"
  }
}

module "this" {
  source       = "../modules/lambda"
  aws_region   = "us-east-1"
  environment  = "dev"
  ecr_repo_url = data.terraform_remote_state.assets.outputs.ecr_repo_url
  deploy       = true
  app_version  = var.app_version
}
```

Notice that we are reading from the remote state in the assets environment of the ECR repository that was created.

```hcl
# dev.tfvars

app_version="fea18f2595ef250eee020aee633666f349a13973"
```

### Prod account
Prod account is exactly the same as the dev account.

```hcl
# main.tf

data "terraform_remote_state" "assets" {
  backend = "s3"
  config = {
    bucket = "terraform-states-730335516527"
    key    = "consistent-deployments.tfstate"
    region = "us-east-1"
  }
}

module "this" {
  source       = "../modules/lambda"
  aws_region   = "us-east-1"
  environment  = "prod"
  ecr_repo_url = data.terraform_remote_state.assets.outputs.ecr_repo_url
  deploy       = true
  app_version  = var.app_version
}
```

And the `prod.tfvars` is shown below:

```hcl
# dev.tfvars

app_version="fea18f2595ef250eee020aee633666f349a13973"
```

Notice that this value is managed by the PR created by the application CI/CD!

## Final flow
So, the final flow, based on this new proposed solution is:
1) The application developer opens a PR on the application repository to add new features to the code
2) Application PR is approved and merged
3) Docker image is created and pushed to ECR (tagged based on git commit hash) on the assets account
4) A pull request is created in the infrastructure repository to update `app_version` in the tfvars file to use the new image
5) If no infra changes are required, the application team can approve the update of the new Lambda version, otherwise, the infra team add changes to this PR
6) Infra PR is approved and merged
7) Deploy to assets account to create ECR repository (requires manual approval)
8) Deploy to the dev account to create a new Lambda version (requires manual approval)
9) Deploy to prod account to create new Lambda version (requires manual approval)
