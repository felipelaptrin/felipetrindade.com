import { IFrontend } from './frontend'
import { IGitHubOidc } from './oidc'
import { IEmail } from './email'
import { commonProps } from './commons'


export const frontendConfig: IFrontend = {
  lambdaAtEdgeLogGroupRetention: 3,
  commonProps: commonProps
}

export const githubOidcConfig: IGitHubOidc = {
  roleName: "GithubActionsOidcWebsite",
  organization: "felipelaptrin",
  repository: "felipetrindade.com",
}

export const emailConfig: IEmail = {
  record: [{
    type: "TXT",
    value: [
      "zoho-verification=zb57142340.zmverify.zoho.com",
      "v=spf1 include:zoho.com ~all",
    ],
    },{
    type: "MX",
    value: [
      "10 mx.zoho.com",
      "20 mx2.zoho.com",
      "50 mx3.zoho.com",
    ],
    },{
    type: "TXT",
    subdomain: "zmail._domainkey",
    value: ["v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCnFUY1z6/mZNsJXDBic4c+lxD0HHAy/iKQybHKLcvxAGPKjoTGW/wtlH+ncsKtSV2QDbZinwXAVqP0j8eJtOKnpxewklr2y3IoC/MzrCzMk9ef3niDjXY8ktB6Ig5KKZGcmhn8GWFj+xXa/ezVc/7KSg58Sogwt0DDYZCE+QvK4wIDAQAB"]
  }],
  commonProps: commonProps,
}


