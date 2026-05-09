## ADDED Requirements

### Requirement: Topbar Bell icon SHALL show unread notification count
The existing Bell icon in the Topbar SHALL display the number of unread notifications as a badge. If unread count is 0, no badge SHALL be shown.

#### Scenario: Bell shows unread count
- **WHEN** the user has 3 unread notifications
- **THEN** the Bell icon SHALL display a badge with the number "3"

#### Scenario: Bell hides badge when no unread
- **WHEN** the user has 0 unread notifications
- **THEN** the Bell icon SHALL display without a badge

### Requirement: Bell icon SHALL open a notification dropdown on click
Clicking the Bell icon SHALL open a dropdown panel showing the 5 most recent notifications with their title, message preview, timestamp, and an unread indicator.

#### Scenario: Dropdown shows recent notifications
- **WHEN** the user clicks the Bell icon
- **THEN** a dropdown SHALL appear showing the 5 most recent notifications with icon, title, message preview (truncated to 80 chars), relative timestamp, and a blue dot for unread items

#### Scenario: Dropdown shows "No notifications" when empty
- **WHEN** the user has no notifications and clicks the Bell
- **THEN** the dropdown SHALL display "No notifications yet"

#### Scenario: Dropdown has "Mark all as read" action
- **WHEN** the user has unread notifications and opens the dropdown
- **THEN** the dropdown SHALL display a "Mark all as read" link at the bottom

### Requirement: Notification item SHALL be clickable
Clicking a notification in the dropdown SHALL mark it as read and navigate to the related order page (if applicable).

#### Scenario: Click notification navigates to order
- **WHEN** the user clicks a notification with a related_order_id
- **THEN** the system SHALL mark the notification as read and navigate to `/orders/{order_id}`

### Requirement: Dropdown SHALL have "View all" link
The dropdown SHALL include a "View all notifications" link at the bottom that navigates to a full notifications page.

#### Scenario: View all navigates to notifications page
- **WHEN** the user clicks "View all notifications"
- **THEN** the system SHALL navigate to `/notifications`

### Requirement: Notification page SHALL show full history
The `/notifications` page SHALL display all notifications paginated, with the ability to mark individual items as read or all as read.

#### Scenario: Notification page shows paginated list
- **WHEN** the user visits `/notifications`
- **THEN** the system SHALL display notifications in reverse chronological order with pagination (20 per page)

#### Scenario: User can mark individual notification as read
- **WHEN** the user clicks a mark-read button on a notification
- **THEN** the system SHALL mark that notification as read without page reload

### Requirement: Notification preferences SHALL be configurable in Profile
The existing PreferencesPanel SHALL include the notification preference setting ("email", "push", "off") affecting how notifications are delivered.

#### Scenario: User changes notification preference
- **WHEN** the user changes notification preference to "off"
- **THEN** the system SHALL stop creating notifications for that user on future events
