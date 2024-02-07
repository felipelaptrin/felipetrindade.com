import emailjs, { EmailJSResponseStatus } from '@emailjs/nodejs'

const sendEmail = async (
  successCallback,
  failCallback,
) => {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {},
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    )

    successCallback()
  } catch (error) {
    failCallback('Something went wrong while sending the email.')
  }
};

export default sendEmail