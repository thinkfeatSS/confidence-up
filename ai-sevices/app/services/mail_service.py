import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logging import logger


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
    """
    Sends an email using SSL over SMTP to Hostinger mail server.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM_ADDRESS}>"
        msg["To"] = to_email

        if not text_content:
            text_content = html_content.replace("<br>", "\n").replace("</p>", "\n\n")

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        context = ssl.create_default_context()

        with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, context=context, timeout=15) as server:
            server.login(settings.MAIL_USER, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM_ADDRESS, to_email, msg.as_string())

        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
        return False


def send_verification_otp_email(to_email: str, name: str, otp_code: str) -> bool:
    subject = f"{otp_code} is your Truefluent AI verification code"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; }}
            .brand {{ font-size: 24px; font-weight: 800; color: #a855f7; margin-bottom: 24px; text-align: center; }}
            .otp-box {{ background: #1e293b; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 20px; font-size: 36px; font-weight: 900; letter-spacing: 8px; text-align: center; color: #38bdf8; margin: 24px 0; }}
            .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="brand">⚡ Truefluent AI</div>
            <h2>Verify Your Email</h2>
            <p>Hi {name or 'there'},</p>
            <p>Welcome to <strong>Truefluent AI</strong>! Enter the 6-digit code below to verify your email address and start building real-world vocal confidence.</p>
            <div class="otp-box">{otp_code}</div>
            <p style="font-size: 14px; color: #94a3b8;">This code expires in 15 minutes. If you did not create a Truefluent AI account, please ignore this email.</p>
            <div class="footer">
                &copy; {settings.MAIL_FROM_NAME} &bull; Voice & Speech Intelligence
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html)


def send_password_reset_email(to_email: str, otp_code: str) -> bool:
    subject = f"{otp_code} is your Truefluent AI password reset code"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }}
            .card {{ max-width: 520px; margin: 0 auto; background: #131b2e; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; }}
            .brand {{ font-size: 24px; font-weight: 800; color: #a855f7; margin-bottom: 24px; text-align: center; }}
            .otp-box {{ background: #1e293b; border: 2px dashed #f43f5e; border-radius: 12px; padding: 20px; font-size: 36px; font-weight: 900; letter-spacing: 8px; text-align: center; color: #f43f5e; margin: 24px 0; }}
            .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="brand">⚡ Truefluent AI</div>
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your Truefluent AI password. Use the verification code below to set a new password:</p>
            <div class="otp-box">{otp_code}</div>
            <p style="font-size: 14px; color: #94a3b8;">This code expires in 15 minutes. If you did not request a password reset, your account is secure and you can safely ignore this email.</p>
            <div class="footer">
                &copy; {settings.MAIL_FROM_NAME} &bull; Voice & Speech Intelligence
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, subject, html)


def send_contact_inquiry_email(name: str, email: str, subject: str, message: str) -> bool:
    mail_subject = f"[Truefluent AI Inquiry] {subject} - from {name}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 12px;">
            <h2 style="color: #38bdf8;">New Contact Inquiry Received</h2>
            <p><strong>From:</strong> {name} (&lt;{email}&gt;)</p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr style="border: 1px solid #334155; margin: 16px 0;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap; background: #0f172a; padding: 16px; border-radius: 8px;">{message}</p>
        </div>
    </body>
    </html>
    """
    return send_email(settings.MAIL_FROM_ADDRESS, mail_subject, html, message)

