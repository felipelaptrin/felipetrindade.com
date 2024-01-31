import { iam } from "@pulumi/aws"
import { accountId } from "./commons"

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
    this.role = this.getOidcRole()
  }

  getOidcRole(): iam.Role {
    const trustRelationship = {
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: {
          Federated: `arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com`
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${this.props.organization}/${this.props.repository}:*`
          }
        }
      }]
    }

    const role = new iam.Role(`${this.id}-role`, {
      name: this.props.roleName,
      description: "Role assumed by the GitHub Actions to deploy resources related to the website/blog",
      assumeRolePolicy: JSON.stringify(trustRelationship),
      managedPolicyArns: ["arn:aws:iam::aws:policy/AdministratorAccess"]
    })

    return role
  }
}