# notification-triggers Specification

## Purpose
TBD - created by archiving change add-notifications. Update Purpose after archive.
## Requirements
### Requirement: System SHALL create notification on order status changes
When an order status changes, the system SHALL automatically create a notification for the order's user and send an email if the user's preference allows it.

#### Scenario: Payment succeeded triggers notification
- **WHEN** an order's payment status changes to "succeeded"
- **THEN** the system SHALL create a notification with type "payment_succeeded" and title "Payment Confirmed"

#### Scenario: Order shipped triggers notification
- **WHEN** an order status changes to "shipped"
- **THEN** the system SHALL create a notification with type "shipped" and title "Order Shipped"

#### Scenario: Order delivered triggers notification
- **WHEN** an order status changes to "delivered"
- **THEN** the system SHALL create a notification with type "delivered" and title "Order Delivered"

#### Scenario: Order cancelled triggers notification
- **WHEN** an order status changes to "cancelled"
- **THEN** the system SHALL create a notification with type "cancelled" and title "Order Cancelled"

#### Scenario: Duplicate status change does not create duplicate notification
- **WHEN** an order status is set to the same value it already has
- **THEN** the system SHALL NOT create a notification

### Requirement: System SHALL respect user notification preferences
Before creating a notification, the system SHALL check the user's `notifications` preference:
- "email": create in-app notification AND send email
- "push": create in-app notification only (no email)
- "off": skip notification entirely

#### Scenario: User with "email" preference receives both
- **WHEN** a notification event occurs and user preference is "email"
- **THEN** the system SHALL create an in-app notification AND send an email

#### Scenario: User with "push" preference receives in-app only
- **WHEN** a notification event occurs and user preference is "push"
- **THEN** the system SHALL create an in-app notification but SHALL NOT send an email

#### Scenario: User with "off" preference receives nothing
- **WHEN** a notification event occurs and user preference is "off"
- **THEN** the system SHALL NOT create any notification or email

### Requirement: Notification triggers SHALL be in order_service
The notification creation logic SHALL be called from `order_service.update_order_status()` method after the status is updated successfully.

#### Scenario: Trigger fires after successful update
- **WHEN** `order_service.update_order_status()` completes successfully
- **THEN** the system SHALL call the notification service to create and send the notification

#### Scenario: Trigger does not fire on failed update
- **WHEN** `order_service.update_order_status()` raises an exception
- **THEN** the system SHALL NOT create any notification

