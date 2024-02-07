import * as React from "react"

const Tools = ({ tools }) => {
  return (
    <div>
      <ul className="tools">
        {tools.map(tool => (
          <li>
            <a
              className="hoverable-brightness"
              href="https://argoproj.github.io/cd/"
            >
              <img
                src={tool.image}
                alt="GitHub Logo"
                width={80}
                height={80}
                quality={95}
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Tools
