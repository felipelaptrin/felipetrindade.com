import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Ability from "../components/ability"
import Tools from "../components/tools"

const AboutMe = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <h1>A bit about myself</h1>
      <h3>Professionally</h3>
      <p>
        I'm a DevOps/SRE/Cloud Engineer (whatever you want to call it!) who
        loves to work with DevOps, Cloud, Networks, Automation, Containers...
        I'm based in Brazil (GMT-3 timezone), currently working as a DevOps
        Engineer for Loka, a top 1% AWS Advanced Consulting Partner for startus.
      </p>
      <p>
        Before working as a Cloud Engineer I was a Data Engineer working in the
        Data Governance team, responsible for managing a data infrastructure
        (EMR, S3, Glue, EC2, Lambda, Airflow...) deployed in AWS. Being so
        involved with infrastructure and cloud made me fall in love with the
        DevOps part of the job, that was the main reason why I decided to become
        a DevOps Engineer.
      </p>
      <h3>Personally</h3>
      <p>
        Spending time with loved ones is probably one of the things that I enjoy
        most in life. Traveling, hiking and enjoying nature is also something
        that refreshes the joy of life. Oh, and movies, I love watching movies.
      </p>
      <h1>What can I do?</h1>
      <Ability
        icon="../cloud.png"
        title="Infrastructure Management"
        description="Managing the creation and deletion of infrastructure in the Cloud in a declarative way"
      />
      <Ability
        icon="../gear.png"
        title="Cloud Automation"
        description="Coding and deploying scripts for automating manual tasks in the Cloud"
      />
      <Ability
        icon="../deploy.png"
        title="Deployment"
        description="Deploying and managing applications using Kubernetes, VMs, Containers, Serverless services"
      />
      <h1>Tools and techs</h1>
      <p>
        There are so many techs and tools that I've worked on during these years
        of work. Programming languages, tools for CI/CD, GitOps, infrastructure
        as code, Kubernetes addons...
      </p>
      <Tools
        tools={[
          {
            image: "../tools/docker.svg",
            alt: "AWS Logo",
            link: "https://www.docker.com/",
          },
          {
            image: "../tools/k8s.svg",
            alt: "Kubernetes Logo",
            link: "https://kubernetes.io/",
          },
          {
            image: "../tools/aws.svg",
            alt: "AWS Logo",
            link: "https://aws.amazon.com/",
          },
          {
            image: "../tools/cci.svg",
            alt: "CircleCI Logo",
            link: "https://circleci.com/",
          },
          {
            image: "../tools/terraform.svg",
            alt: "Terraform Logo",
            link: "https://www.terraform.io/",
          },
          {
            image: "../tools/python.svg",
            alt: "Python Logo",
            link: "https://www.python.org/",
          },
          {
            image: "../tools/argocd.svg",
            alt: "ArgoCD Logo",
            link: "https://argoproj.github.io/cd/",
          },
          {
            image: "../tools/githubactions.svg",
            alt: "GitHub Actions Logo",
            link: "https://github.com/features/actions",
          },
        ]}
      />
    </Layout>
  )
}

export const Head = () => <Seo title="About me" />

export default AboutMe

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
