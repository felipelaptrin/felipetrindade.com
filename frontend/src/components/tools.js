import * as React from "react"

const Tools = ({ tools }) => {
  return (
    <div>
      <ul className="tools">
        {tools.map(tool => (
          <li>
            <a
              className="hoverable-brightness"
              href={tool.link}
            >
              <img
                src={tool.image}
                alt={tool.alt}
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
