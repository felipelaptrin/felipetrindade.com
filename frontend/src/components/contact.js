/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from "react"
import { useSendEmail } from "../hooks/email"
import { ClipLoader } from "react-spinners"

const ContactModal = () => {
  const { sendEmail, isLoading, error } = useSendEmail()

  return (
    <div className="contact">
      <form onSubmit={sendEmail}>
        <p>
          Or you can directly message above and I will reach you out via email
          😃
        </p>
        <div>
          <input
            id="from_name"
            type="text"
            name="name"
            placeholder="Your name"
            required
          />
          <input
            id="email_id"
            type="email"
            name="email"
            placeholder="Your email"
            required
          />
          <textarea
            id="message"
            name="message"
            placeholder="Your message"
            required
          ></textarea>
          <button
            className="hoverable-brightness"
            aria-label="Button to submit the contact form"
            type="submit"
          >
            {isLoading ? (
              <p>
                Sending <ClipLoader size="15" />{" "}
              </p>
            ) : (
              "Send Message"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContactModal
