import { Frontend } from "./stacks/frontend"
import { frontendConfig, githubOidcConfig, emailConfig } from "./config"
import { GitHubOidc } from "./stacks/oidc"
import { Email } from "./stacks/email"

new GitHubOidc("oidc", githubOidcConfig)
const frontend = new Frontend("frontend", frontendConfig)
new Email("email", emailConfig)

// Export - Slack Outputs - Used during CI
export const cloudfrontDistribution = frontend.distribution.id
export const frontendS3Bucket = frontend.bucket.bucket
