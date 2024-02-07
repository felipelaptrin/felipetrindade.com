/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const SocialMedia = () => {
  return (
    <div className="social-media">
      <p>You can find me in the following social medias</p>
      <ul>
        <li>
          <a
            className="hoverable-brightness"
            href="https://github.com/felipelaptrin"
          >
            <StaticImage
              layout="fixed"
              formats={["auto", "webp", "avif"]}
              src="../../static/github.png"
              width={50}
              height={50}
              quality={95}
              alt="GitHub Logo"
            />
          </a>
        </li>
        <li>
          <a
            className="hoverable-brightness"
            href="https://www.linkedin.com/in/trindade-felipe"
          >
            <StaticImage
              layout="fixed"
              formats={["auto", "webp", "avif"]}
              src="../../static/linkedin.png"
              width={50}
              height={50}
              quality={95}
              alt="LinkedIn Logo"
            />
          </a>
        </li>
      </ul>
    </div>
  )
}

export default SocialMedia
