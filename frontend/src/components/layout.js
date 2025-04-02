import * as React from "react"
import { Link } from "gatsby"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  const navbar = (
    <nav>
      <Link to="/" className="title">
        {title}
      </Link>
      <ul className="nav-list">
        <li>
          <Link to="/about-me">About me</Link>
        </li>
        <li>
          <Link to="/portfolio">Portfolio</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
    </nav>
  )

  header = <div className="navbar">{navbar}</div>

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        © {new Date().getFullYear()}, Source code available on
        {` `}
        <a href="https://github.com/felipelaptrin/felipetrindade.com">GitHub</a>
      </footer>
    </div>
  )
}

export default Layout
