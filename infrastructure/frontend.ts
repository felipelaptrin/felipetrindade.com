import { s3, acm, cloudfront, route53 } from '@pulumi/aws'
import { interpolate } from '@pulumi/pulumi'

import { accountId } from "./commons"

export interface IFrontend {
  domainName: string
}


export class Frontend {
  id: string
  props: IFrontend
  certificate: acm.Certificate
  distribution: cloudfront.Distribution
  bucket: s3.Bucket
  zoneId: Promise<string>

  constructor(id: string, props: IFrontend) {
    this.id = id
    this.props = props
    this.zoneId = this.getZone()
    this.certificate = this.getCertificate()
    this.bucket = this.getS3Bucket()
    this.distribution = this.getDistribution()

    this.setBucketPolicy()
    this.setRoute53()
  }

  getCertificate(): acm.Certificate {
    const certificate = new acm.Certificate(`${this.id}-certificate`, {
      domainName: `${this.props.domainName}`,
      subjectAlternativeNames: [
        this.props.domainName,
        `*.${this.props.domainName}`,
      ],
      validationMethod: "DNS"
    })
    const certificateValidation = new route53.Record(`${this.id}-certificate`, {
      zoneId: this.zoneId,
      name: certificate.domainValidationOptions[0].resourceRecordName,
      records: [certificate.domainValidationOptions[0].resourceRecordValue],
      type: certificate.domainValidationOptions[0].resourceRecordType,
      ttl: 60
    })
    new acm.CertificateValidation(`${this.id}-certificate-validation`, {
      certificateArn: certificate.arn,
      validationRecordFqdns: [certificateValidation.fqdn]
    })

    return certificate
  }

  getS3Bucket(): s3.Bucket {
    const bucket = new s3.Bucket(`${this.id}-bucket`, {
      website: {
        indexDocument: "index.html",
        errorDocument: "index.html",
      },
    })

    return bucket
  }

  getDistribution(): cloudfront.Distribution {
    const originAccessControl = new cloudfront.OriginAccessControl(`${this.id}-origin-access-control`, {
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4"
    })
    const distribution = new cloudfront.Distribution(`${this.id}-cloudfront-distribution`, {
      enabled: true,
      comment: "Cloudfront distribution of my personal website and blog",
      origins: [{
        domainName: this.bucket.bucketRegionalDomainName,
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
        acmCertificateArn: this.certificate.arn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
      },
      defaultRootObject: "index.html",
      aliases: [
        this.props.domainName,
        `www.${this.props.domainName}`
      ],
    })

    return distribution
  }

  setBucketPolicy(): void {
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
          "Resource": "${this.bucket.arn}/*",
          "Condition": {
            "StringEquals": {
              "AWS:SourceArn": "arn:aws:cloudfront::${accountId}:distribution/${this.distribution.id}"
            }
          }
        }
      ]}`
    new s3.BucketPolicy(`${this.id}-bucket-policy`, {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument,
    })
  }

  getZone(): Promise<string> {
    const zone = route53.getZone({
      name: this.props.domainName
    })
    const zoneId = zone.then(zone => zone.zoneId)

    return zoneId
  }

  setRoute53(): void {
    new route53.Record(`${this.id}-record`, {
      zoneId: this.zoneId,
      name: this.props.domainName,
      type: "A",
      aliases: [{
        name: this.distribution.domainName,
        zoneId: this.distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })

    new route53.Record(`${this.id}-record-www`, {
      zoneId: this.zoneId,
      name: `www.${this.props.domainName}`,
      type: "A",
      aliases: [{
        name: this.distribution.domainName,
        zoneId: this.distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })
  }
}
