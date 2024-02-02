import { IFrontend } from './frontend'
import { IGitHubOidc } from './oidc'


export const frontendConfig: IFrontend = {
  domainName: "felipetrindade.com",
  lambdaAtEdgeLogGroupRetention: 3,
}

export const githubOidcConfig: IGitHubOidc = {
  roleName: "GithubActionsOidcWebsite",
  organization: "felipelaptrin",
  repository: "felipetrindade.com",
}