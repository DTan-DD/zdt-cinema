import dotenv from "dotenv";
dotenv.config();

export const sendEmail_V2 = async ({ to, subject, body }) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY, // Brevo API Key
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: process.env.SENDER_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: body,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Error sending email:", errText);
      throw new Error(`Failed to send email: ${errText}`);
    }

    const result = await response.json();
    console.log("✅ Email sent successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ sendEmail error:", error);
    throw error;
  }
};
