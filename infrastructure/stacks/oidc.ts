import { iam } from "@pulumi/aws"
import { accountId } from "../commons"
import { interpolate } from "@pulumi/pulumi"

export interface IGitHubOidc {
  roleName: string
  organization: string
  repository: string
}

export class GitHubOidc {
  id: string
  props: IGitHubOidc
  role: iam.Role

  constructor(id: string, props: IGitHubOidc) {
    this.id = id
    this.props = props
    this.setIdentityProvider()
    this.role = this.getOidcRole()
  }

  setIdentityProvider(): void {
    new iam.OpenIdConnectProvider(`${this.id}-identity-provider`, {
      url: "https://token.actions.githubusercontent.com",
      clientIdLists: ["sts.amazonaws.com"],
      thumbprintLists: [
        "1b511abead59c6ce207077c0bf0e0043b1382612"
      ]
    })
  }

  getOidcRole(): iam.Role {
    const trustRelationship = interpolate`{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "Federated": "arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com"
        },
        "Action": "sts:AssumeRoleWithWebIdentity",
        "Condition": {
          "StringEquals": {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          },
          "StringLike": {
            "token.actions.githubusercontent.com:sub": "repo:${this.props.organization}/${this.props.repository}:*"
          }
        }
      }]
    }`

    const role = new iam.Role(`${this.id}-role`, {
      name: this.props.roleName,
      description: "Role assumed by the GitHub Actions to deploy resources related to the website/blog",
      assumeRolePolicy: trustRelationship,
      managedPolicyArns: ["arn:aws:iam::aws:policy/AdministratorAccess"],
    })

    return role
  }
}