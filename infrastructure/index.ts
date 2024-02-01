import { Frontend } from "./frontend"
import { frontendConfig, githubOidcConfig } from "./config"
import { GitHubOidc } from "./oidc"

new GitHubOidc("oidc", githubOidcConfig)
const frontend = new Frontend("frontend", frontendConfig)

// Export - Slack Outputs - Used during CI
export const cloudfrontDistribution = frontend.distribution.id
export const frontendS3Bucket = frontend.bucket.bucket
