/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from "react"

const Ability = ({ icon, title, description }) => {
  const imagePath = {
    "Infrastructure Management": "../../static/github.png",
    "Cloud Automation": "../../static/github.png",
    "Deployment": "../../static/github.png",
  }
  return (
    <div className="ability-container">
      <div className="ability-icon">
        <img
          src={icon}
          alt="GitHub Logo"
          width={50}
          height={50}
          quality={95}
        />
      </div>
      <div className="ability-text">
        <div className="ability-title">{title}</div>
        <div className="ability-description">{description}</div>
      </div>
    </div>
  )
}

export default Ability
