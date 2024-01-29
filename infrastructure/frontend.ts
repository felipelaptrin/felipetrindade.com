import { s3, acm, cloudfront, route53 } from '@pulumi/aws'
import { accountId } from "./commons"
import { interpolate } from '@pulumi/pulumi'

export interface IFrontend {
  domainName: string
}


export class Frontend {

  constructor(id: string, props: IFrontend) {


    const certificate = new acm.Certificate(`${id}-certificate`, {
      domainName: `${props.domainName}`,
      subjectAlternativeNames: [
        `*.${props.domainName}`
      ],
      validationMethod: "DNS"
    })

    const originAccessControl = new cloudfront.OriginAccessControl(`${id}-origin-access-control`, {
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4"
    })

    const bucket = new s3.Bucket(`${id}-bucket`, {
      website: {
        indexDocument: "index.html",
        errorDocument: "index.html",
      },
    })

    const distribution = new cloudfront.Distribution(`${id}-cloudfront-distribution`, {
      enabled: true,
      comment: "Cloudfront distribution of my personal website and blog",
      origins: [{
        domainName: bucket.bucketRegionalDomainName,
        originAccessControlId: originAccessControl.id,
        originId: "s3OriginId",
      }],
      priceClass: "PriceClass_All",
      defaultCacheBehavior: {
        allowedMethods: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
        ],
        cachedMethods: [
          "GET",
          "HEAD",
        ],
        targetOriginId: "s3OriginId",
        viewerProtocolPolicy: "redirect-to-https",
        cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6", // Managed-CachingOptimized
      },
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
          locations: [],
        }
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: false,
        acmCertificateArn: certificate.arn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
      },
      defaultRootObject: "index.html",
      aliases: [
        props.domainName,
        `www.${props.domainName}`
      ],
    })

    const bucketPolicyDocument = interpolate`{
      "Version": "2008-10-17",
      "Id": "PolicyForCloudFrontPrivateContent",
      "Statement": [
        {
          "Sid": "AllowCloudFrontServicePrincipal",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudfront.amazonaws.com"
          },
          "Action": "s3:GetObject",
          "Resource": "${bucket.arn}/*",
          "Condition": {
            "StringEquals": {
              "AWS:SourceArn": "arn:aws:cloudfront::${accountId}:distribution/${distribution.id}"
            }
          }
        }
      ]}`

    new s3.BucketPolicy(`${id}-bucket-policy`, {
      bucket: bucket.id,
      policy: bucketPolicyDocument,
    })

    const zone = route53.getZone({
      name: props.domainName
    })
    const zoneId = zone.then(zone => zone.zoneId)

    new route53.Record(`${id}-record`, {
      zoneId: zoneId,
      name: props.domainName,
      type: "A",
      aliases: [{
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })

    new route53.Record(`${id}-record-www`, {
      zoneId: zoneId,
      name: `www.${props.domainName}`,
      type: "A",
      aliases: [{
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })

  }
}