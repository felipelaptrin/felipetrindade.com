import { getCallerIdentity } from '@pulumi/aws'
import { route53 } from '@pulumi/aws'

export interface ICommonProps {
  domainName: string
  accountId: Promise<string>
  zoneId: Promise<string>
}

const getZone = (domainName: string): Promise<string> => {
  const zone = route53.getZone({
    name: domainName
  })
  const zoneId = zone.then(zone => zone.zoneId)

  return zoneId
}

const current = getCallerIdentity({});
export const accountId = current.then(current => current.accountId);

const domainName = "felipetrindade.com"

export const commonProps: ICommonProps = {
  domainName: domainName,
  accountId: accountId,
  zoneId: getZone(domainName)
}