import { Frontend } from "./frontend"
import { frontendConfig, githubOidcConfig } from "./config"
import { GitHubOidc } from "./oidc"

new GitHubOidc("oidc", githubOidcConfig)
new Frontend("frontend", frontendConfig)
