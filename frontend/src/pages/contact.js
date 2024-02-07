import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SocialMedia from "../components/social-media"
import ContactModal from "../components/contact"
import { ToastContainer } from "react-toastify"

const Contact = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <ToastContainer />
      <SocialMedia />
      <ContactModal />
    </Layout>
  )
}

export const Head = () => <Seo title="Contact me" />

export default Contact

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
