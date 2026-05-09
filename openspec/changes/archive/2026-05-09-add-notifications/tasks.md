## 1. Dependencies & Config

- [ ] 1.1 Add `aiosmtplib` and `jinja2` to `backend/requirements.txt`
- [ ] 1.2 Add SMTP env vars to `backend/.env` (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME) with Mailtrap defaults for dev
- [ ] 1.3 Create `backend/app/templates/email/` directory

## 2. Database — ORM Model + Migration

- [ ] 2.1 Create `backend/app/models/notification.py` with Notification model (id, user_id FK, type, title, message, related_order_id nullable FK, is_read, created_at) with indexes on user_id, is_read, created_at
- [ ] 2.2 Add Notification to `backend/app/models/__init__.py`
- [ ] 2.3 Create Alembic migration for notifications table

## 3. Backend — Email Service

- [ ] 3.1 Create `backend/app/services/email_service.py` with: SMTP config loader from env vars, async send_email function (to, subject, template_name, context), Jinja2 template renderer, error logging without failing the request
- [ ] 3.2 Create `backend/app/templates/email/order_confirmed.html` with order details template (inline CSS, order ID, items table, total, estimated delivery)
- [ ] 3.3 Create `backend/app/templates/email/order_shipped.html` with shipping update template
- [ ] 3.4 Create `backend/app/templates/email/order_delivered.html` with delivery confirmation template
- [ ] 3.5 Create `backend/app/templates/email/order_cancelled.html` with cancellation notice template
- [ ] 3.6 Create `backend/app/templates/email/payment_succeeded.html` with payment confirmation template

## 4. Backend — Notification Service

- [ ] 4.1 Create `backend/app/services/notification_service.py` with: create_notification (respect user preferences), get_user_notifications (paginated, with unread_only filter), get_unread_count, mark_as_read, mark_all_as_read, delete_old_notifications (90-day retention)
- [ ] 4.2 Add `create_and_send_notification` function that creates in-app notification and conditionally sends email based on user preference

## 5. Backend — Schemas + Routes

- [ ] 5.1 Create `backend/app/schemas/notification.py` with NotificationResponse (id, type, title, message, related_order_id, is_read, created_at), NotificationListResponse (items, total_count, unread_count, page, total_pages), UnreadCountResponse (unread_count)
- [ ] 5.2 Create `backend/app/routes/notifications.py` with: GET / (paginated list, ?unread=true filter), GET /unread-count, PATCH /{id}/read, PATCH /read-all — all requiring authentication
- [ ] 5.3 Register notification router in `backend/app/main.py`

## 6. Backend — Notification Triggers in Order Service

- [ ] 6.1 Modify `backend/app/services/order_service.py`: in `update_order_status`, after successful status change, call notification_service.create_and_send_notification with the appropriate type based on new status
- [ ] 6.2 Ensure trigger only fires on actual status changes (not no-op updates)
- [ ] 6.3 Ensure trigger does not fire on failed updates

## 7. Backend — Tests

- [ ] 7.1 Write tests for email_service: send_email (success, failure logged but not raised), template rendering
- [ ] 7.2 Write tests for notification_service: create (with email/push/off preferences), list (paginated, unread_only), unread_count, mark_as_read, mark_all_as_read
- [ ] 7.3 Write tests for notification routes: list (paginated, unread filter), unread_count, mark_read, mark_all_read, 401 without auth
- [ ] 7.4 Write tests for notification triggers: trigger fires on order status change, respects user preferences, no duplicate on same status

## 8. Frontend — Types + API + Hooks

- [ ] 8.1 Create `frontend/src/types/notification.ts` with Notification interface (id, type, title, message, related_order_id?, is_read, created_at), NotificationListResponse, UnreadCountResponse
- [ ] 8.2 Create `frontend/src/api/notificationApi.ts` with list (page, unread_only?), getUnreadCount, markAsRead, markAllAsRead
- [ ] 8.3 Create `frontend/src/hooks/useNotifications.ts` with useNotifications hook (items, unreadCount, isLoading, markAsRead, markAllAsRead, refresh)

## 9. Frontend — Components + Pages

- [ ] 9.1 Create `frontend/src/components/notifications/NotificationDropdown.tsx` with: 5 most recent notifications, unread indicator (blue dot), title + message preview, relative timestamp, "Mark all as read" link, "View all notifications" link, "No notifications" empty state
- [ ] 9.2 Create `frontend/src/pages/NotificationsPage.tsx` with full paginated notification list, mark individual as read, mark all as read

## 10. Frontend — Integration

- [ ] 10.1 Integrate NotificationDropdown in Topbar Bell icon: show unread count badge, open dropdown on click, close on outside click
- [ ] 10.2 Add route `/notifications` in App.tsx with ProtectedRoute
- [ ] 10.3 Notification preference in PreferencesPanel already exists — verify it's wired correctly (it already has "email", "push", "off" options)
- [ ] 10.4 TypeScript compilation passes with no errors
- [ ] 10.5 Vite production build succeeds
