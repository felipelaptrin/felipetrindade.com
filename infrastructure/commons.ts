import { getCallerIdentity } from '@pulumi/aws'

const current = getCallerIdentity({});
export const accountId = current.then(current => current.accountId);
