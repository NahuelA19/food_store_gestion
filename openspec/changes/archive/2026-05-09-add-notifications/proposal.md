## Why

Food Store needs a notification system to keep users informed about their orders, payments, and account activity. Currently there's no way to notify users when an order is confirmed, payment succeeds, shipping status changes, or when important account events happen. The Topbar already has a Bell icon placeholder, and user preferences already support a `notifications` field ("email", "push", "off") — but no actual notification delivery exists.

## What Changes

- Add email sending infrastructure with SMTP support (Mailtrap for dev, configurable for production)
- Add in-app notification model and service (stored in DB, fetched via API)
- Add notification triggers on order lifecycle events (payment succeeded, order confirmed, shipped, delivered, cancelled)
- Add notification API endpoints (list, mark as read, mark all read, preferences)
- Add notification preference integration (respect user's "email" / "push" / "off" setting)
- Add frontend notification dropdown (Bell icon in Topbar shows real notification count + dropdown list)
- Add notification settings UI in Profile/Settings page
- Add Alembic migration for notification tables

## Capabilities

### New Capabilities
- `email-service`: Email sending infrastructure — SMTP config, email templates, sendgrid/mailtrap integration
- `in-app-notifications`: In-app notification model, storage, API (list, mark read, mark all read)
- `notification-triggers`: Automatic notification creation on order lifecycle events (payment, shipping, cancellation)
- `notification-ui`: Frontend notification dropdown, badge count, notification list, settings

### Modified Capabilities
<!-- No existing spec requirements are changing — this is purely additive -->

## Impact

- **Backend**: New Python packages (smtplib, jinja2 for templates), new models (Notification), new service (email_service, notification_service), new routes (/api/notifications), new Alembic migration
- **Frontend**: Update Topbar Bell icon to show real notification data, new notification dropdown component, notification settings in PreferencesPanel
- **Config**: New SMTP env vars (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM)
- **Dependencies**: Add `jinja2` for email templates, `aiosmtplib` for async SMTP
