import * as archive from "@pulumi/archive";
import { s3, acm, cloudfront, route53, lambda, iam, cloudwatch, Provider } from '@pulumi/aws'
import { interpolate, asset } from '@pulumi/pulumi'
import { ICommonProps } from "../commons"

export interface IFrontend {
  lambdaAtEdgeLogGroupRetention: number
  commonProps: ICommonProps
}


export class Frontend {
  id: string
  props: IFrontend
  domainName: string
  certificate: acm.Certificate
  distribution: cloudfront.Distribution
  bucket: s3.Bucket
  zoneId: Promise<string>
  lambda: lambda.Function
  provider: Provider

  constructor(id: string, props: IFrontend) {
    this.id = id
    this.props = props
    this.zoneId = props.commonProps.zoneId
    this.domainName = props.commonProps.domainName
    this.certificate = this.getCertificate()
    this.bucket = this.getS3Bucket()
    this.lambda = this.getLambdaAtEdge()
    this.distribution = this.getDistribution()
    this.provider = new Provider("us-east-1", { region: "us-east-1" })

    this.setBucketPolicy()
    this.setRoute53()
  }

  getCertificate(): acm.Certificate {
    const certificate = new acm.Certificate(`${this.id}-certificate`, {
      domainName: `${this.domainName}`,
      subjectAlternativeNames: [
        this.domainName,
        `*.${this.domainName}`,
      ],
      validationMethod: "DNS"
    }, { provider: this.provider })
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
        lambdaFunctionAssociations: [{
          eventType: "viewer-request",
          lambdaArn: this.lambda.qualifiedArn
        }]
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
      customErrorResponses: [{
        errorCode: 404,
        responsePagePath: "/404.html",
        responseCode: 404,
        errorCachingMinTtl: 3600,
      }, {
        errorCode: 403,
        responsePagePath: "/404.html",
        responseCode: 404,
        errorCachingMinTtl: 3600,
      }],
      defaultRootObject: "index.html",
      aliases: [
        this.domainName,
        `www.${this.domainName}`
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
              "AWS:SourceArn": "arn:aws:cloudfront::${this.props.commonProps.accountId}:distribution/${this.distribution.id}"
            }
          }
        }
      ]}`
    new s3.BucketPolicy(`${this.id}-bucket-policy`, {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument,
    })
  }



  setRoute53(): void {
    new route53.Record(`${this.id}-record`, {
      zoneId: this.zoneId,
      name: this.domainName,
      type: "A",
      aliases: [{
        name: this.distribution.domainName,
        zoneId: this.distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })

    new route53.Record(`${this.id}-record-www`, {
      zoneId: this.zoneId,
      name: `www.${this.domainName}`,
      type: "A",
      aliases: [{
        name: this.distribution.domainName,
        zoneId: this.distribution.hostedZoneId,
        evaluateTargetHealth: false
      }]
    })
  }

  archiveLambdaCode(): string {
    const archiveFile = "lambda/lambda_at_edge.zip"
    archive.getFile({
      type: "zip",
      sourceFile: "lambda/index.js",
      outputPath: archiveFile
    })

    return archiveFile
  }

  getLambdaAtEdge(): lambda.Function {
    const archiveFile = this.archiveLambdaCode()
    const trustRelationship = interpolate`{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "Service": [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
        ]},
        "Action": "sts:AssumeRole"
      }]
    }`

    const policy = new iam.Policy(`${this.id}-lambda-policy`, {
      policy: interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "VisualEditor0",
          "Effect": "Allow",
          "Action": ["s3:List", "s3:Get*"],
          "Resource": [
            "${this.bucket.arn}",
            "${this.bucket.arn}/*"
          ]
        }]
      }`
    })

    const role = new iam.Role(`${this.id}-lambda-at-edge`, {
      assumeRolePolicy: trustRelationship,
      managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole", policy.arn],
    })

    const logGroup = new cloudwatch.LogGroup(`${this.id}-lambda-at-edge-log-group`, {
      retentionInDays: this.props.lambdaAtEdgeLogGroupRetention,
    })

    const lambda_function = new lambda.Function(`${this.id}`, {
      description: "Runs at edge to add '/index.html' in every uri, allowing users to access paths",
      role: role.arn,
      code: new asset.FileArchive(archiveFile),
      runtime: lambda.Runtime.NodeJS22dX,
      handler: "index.handler",
      architectures: ["x86_64"],
      publish: true,
      loggingConfig: {
        logGroup: logGroup.name,
        logFormat: "Text"
      }
    }, { provider: this.provider })

    new lambda.Permission(`${this.id}-lambda-permission`, {
      action: "lambda:InvokeFunction",
      statementId: "AllowExecutionFromCloudFront",
      function: lambda_function,
      principal: "edgelambda.amazonaws.com",
    })

    return lambda_function
  }
}
