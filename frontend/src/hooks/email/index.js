import * as emailjs from "emailjs-com"
import { useState } from "react"
import { toast } from "react-toastify"

export const useSendEmail = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendEmail = async event => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const { name, email, message } = event.target
    const params = {
      from_name: name.value,
      email_id: email.value,
      message: message.value,
    }

    try {
      await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        params,
        process.env.EMAILJS_USER_ID
      )
      toast.success("Email sent successfully 👌")
    } catch (error) {
      console.log(error)
      setError(error)
      toast.error("Email couldn't be delivered 😞")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    sendEmail,
    isLoading,
    error,
  }
}
