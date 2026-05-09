## Context

Food Store has a complete e-commerce backend: products, cart, checkout, Stripe payments, order lifecycle, user preferences (with a `notifications` field supporting "email", "push", "off"), and a Topbar with a Bell icon placeholder. However, no actual notification delivery exists. Users never know when their order is confirmed, payment succeeds, or shipping status changes unless they manually check the order page.

The order lifecycle includes these statuses:
- `payment_pending` → `paid` → `confirmed` → `shipped` → `delivered`
- Error paths: `payment_failed`, `cancelled`

## Goals / Non-Goals

**Goals:**
- Email notifications for order events (payment confirmed, shipped, delivered, cancelled)
- In-app notifications stored in DB, fetched via REST API
- Bell icon in Topbar shows unread notification count + dropdown list
- Respect user's `notifications` preference (email/push/off)
- Trigger notifications automatically on order status changes
- Notification settings UI in Profile page

**Non-Goals:**
- Real-time push notifications (WebSocket) — postponed for future
- SMS notifications — out of scope
- Email marketing campaigns — only transactional emails
- Notification templates customization by users
- Push notifications to mobile devices

## Decisions

### Decision 1: Async email via `aiosmtplib` + Jinja2 templates
**Chosen**: `aiosmtplib` for async SMTP sending, `jinja2` for HTML email templates
**Alternatives considered**: `fastapi-mail` (too opinionated), `smtplib` (sync, blocks event loop)
**Rationale**: `aiosmtplib` is lightweight, async-native, works with FastAPI's event loop. Jinja2 allows clean HTML email templates with inline CSS. For production, swap SMTP config to SendGrid/Mailgun without code changes.

### Decision 2: Notification stored in DB with read/unread status
**Chosen**: New `Notification` model with fields: id, user_id, type, title, message, related_order_id, is_read, created_at
**Rationale**: Simple persistence, easy to query "unread count", works for both in-app display and audit trail.
**Trade-off**: DB storage means older notifications need cleanup. Add a soft retention policy (keep 90 days).

### Decision 3: Notification triggers as service-level calls, not DB triggers
**Chosen**: Call `notification_service.create_and_send()` from `order_service.update_order_status()`
**Alternatives considered**: PostgreSQL LISTEN/NOTIFY (too coupled), Celery task queue (too heavy for current stage)
**Rationale**: Simple direct call within the request-response cycle. Async email sending means the request isn't blocked. Can extract to background task queue later when needed.

### Decision 4: Dev email via Mailtrap (SMTP), configurable per environment
**Chosen**: SMTP config via env vars, default to Mailtrap for dev
**Rationale**: Mailtrap captures emails in dev without actually sending. Prod env vars can point to SendGrid, Mailgun, or any SMTP provider. No code changes needed between environments.

### Decision 5: Frontend uses existing Bell icon + dropdown pattern
**Chosen**: Extend Topbar Bell icon to fetch `/api/notifications?unread=true`, show count badge, dropdown with notification list
**Rationale**: Reuses existing Topbar pattern. No new navigation elements needed. The Bell already exists as a placeholder.

## Risks / Trade-offs

- [Sync notification creation in request path] → Mitigation: Email sending is async (fire-and-forget with `asyncio.create_task`), but notification DB write is synchronous. Acceptable because it's a single INSERT.
- [Email deliverability] → Mitigation: SMTP config is environment-agnostic. Dev uses Mailtrap, prod uses transactional email service. Add email error logging (never fail the request for email failure).
- [Notification volume growth] → Mitigation: Add retention policy (auto-delete after 90 days). Add pagination to list endpoint.
- [User marks notifications as read but they keep coming] → Mitigation: Respect user's `notifications` preference. If "off", skip creation entirely.

## Migration Plan

1. Add new Python dependencies (`aiosmtplib`, `jinja2`)
2. Add SMTP config env vars to `.env`
3. Create Alembic migration for `notifications` table
4. Implement `email_service.py` (SMTP client + templates)
5. Implement `notification_service.py` (CRUD + create_and_send)
6. Implement `routes/notifications.py` (list, mark_read, mark_all_read, unread_count)
7. Add notification triggers in `order_service.py` (on status change)
8. Frontend: notification types + API client
9. Frontend: `useNotifications` hook
10. Frontend: `NotificationDropdown` component
11. Frontend: Integrate in Topbar Bell icon
12. Frontend: Notification settings in PreferencesPanel
13. Tests

## Open Questions

- Should admin users get notifications too? (e.g., new order placed)
- Should we add email verification on registration as part of this change?
