"""Email service for sending transactional emails via SMTP."""

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

# Template directory
TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"

# Jinja2 environment (lazy-loaded)
_env: Environment | None = None


def _get_template_env() -> Environment:
    """Get or create the Jinja2 template environment."""
    global _env
    if _env is None:
        _env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    return _env


@dataclass
class EmailConfig:
    """SMTP configuration loaded from environment variables."""

    host: str = field(default_factory=lambda: os.getenv("SMTP_HOST", "smtp.mailtrap.io"))
    port: int = field(default_factory=lambda: int(os.getenv("SMTP_PORT", "587")))
    username: str = field(default_factory=lambda: os.getenv("SMTP_USERNAME", ""))
    password: str = field(default_factory=lambda: os.getenv("SMTP_PASSWORD", ""))
    from_email: str = field(default_factory=lambda: os.getenv("SMTP_FROM_EMAIL", "noreply@foodstore.com"))
    from_name: str = field(default_factory=lambda: os.getenv("SMTP_FROM_NAME", "Food Store"))
    use_tls: bool = field(default_factory=lambda: os.getenv("SMTP_USE_TLS", "true").lower() == "true")


def get_email_config() -> EmailConfig:
    """Load email configuration from environment variables."""
    return EmailConfig()


def render_template(template_name: str, context: dict) -> str:
    """Render an email template with the given context.

    Args:
        template_name: Template filename (e.g., 'order_confirmed.html')
        context: Template variables

    Returns:
        Rendered HTML string
    """
    env = _get_template_env()
    template = env.get_template(template_name)
    return template.render(**context)


async def send_email(
    to: str,
    subject: str,
    template_name: str,
    context: dict,
) -> None:
    """Send an email asynchronously via SMTP.

    This is a fire-and-forget operation. Errors are logged but not raised.

    Args:
        to: Recipient email address
        subject: Email subject line
        template_name: Jinja2 template filename
        context: Template variables
    """
    config = get_email_config()

    try:
        html_body = render_template(template_name, context)
    except Exception as e:
        logger.error("Failed to render email template '%s': %s", template_name, e)
        return

    try:
        import aiosmtplib

        message = (
            f"From: {config.from_name} <{config.from_email}>\r\n"
            f"To: {to}\r\n"
            f"Subject: {subject}\r\n"
            f"MIME-Version: 1.0\r\n"
            f"Content-Type: text/html; charset=utf-8\r\n"
            f"\r\n"
            f"{html_body}"
        )

        await aiosmtplib.send(
            message,
            hostname=config.host,
            port=config.port,
            username=config.username,
            password=config.password,
            use_tls=config.use_tls,
        )
        logger.info("Email sent to %s: %s", to, subject)
    except Exception as e:
        logger.error("Failed to send email to %s (subject: %s): %s", to, subject, e)
