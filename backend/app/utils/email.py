import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_verification_email(to_email, full_name, code):
    """Sends a verification code email. If SMTP isn't configured (e.g. during
    local development), prints the code to the console instead so the app
    still works end-to-end without real email credentials."""

    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM", smtp_user)

    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        print("=" * 50)
        print("SMTP not configured — printing verification code instead.")
        print(f"To: {to_email}")
        print(f"Verification code: {code}")
        print("=" * 50)
        return

    subject = "Verify your Teacher's Companion account"
    body = (
        f"Hi {full_name},\n\n"
        f"Your verification code is: {code}\n\n"
        f"This code expires in 15 minutes. Enter it in the app to finish "
        f"setting up your account.\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— Best Brain Foundation Academy"
    )

    msg = MIMEMultipart()
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, to_email, msg.as_string())
