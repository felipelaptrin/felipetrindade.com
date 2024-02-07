import { Frontend } from "./frontend"
import { frontendConfig, githubOidcConfig, emailConfig } from "./config"
import { GitHubOidc } from "./oidc"
import { Email } from "./email"

new GitHubOidc("oidc", githubOidcConfig)
const frontend = new Frontend("frontend", frontendConfig)
new Email("email", emailConfig)

// Export - Slack Outputs - Used during CI
export const cloudfrontDistribution = frontend.distribution.id
export const frontendS3Bucket = frontend.bucket.bucket
