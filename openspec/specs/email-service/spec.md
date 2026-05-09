# email-service Specification

## Purpose
TBD - created by archiving change add-notifications. Update Purpose after archive.
## Requirements
### Requirement: System SHALL send transactional emails via SMTP
The system SHALL support sending transactional emails via SMTP protocol using configurable server settings. Email sending SHALL be async to avoid blocking the request-response cycle.

#### Scenario: Send email on order status change
- **WHEN** an order status changes to "shipped"
- **THEN** the system SHALL send an HTML email to the user's email address with order details and new status

#### Scenario: Async email sending does not block response
- **WHEN** the system sends an email
- **THEN** the HTTP response SHALL return immediately without waiting for email delivery

#### Scenario: Email sending failure is logged but does not fail the request
- **WHEN** the SMTP server is unreachable or returns an error
- **THEN** the system SHALL log the error and continue processing the request successfully

### Requirement: Email templates SHALL use Jinja2
The system SHALL use Jinja2 templating engine for rendering HTML email bodies. Templates SHALL support inline CSS for email client compatibility.

#### Scenario: Order confirmation email renders correctly
- **WHEN** the system sends an order confirmation email
- **THEN** the email SHALL include the order ID, item list, total amount, and estimated delivery date rendered from a Jinja2 template

### Requirement: SMTP config SHALL be environment-agnostic
The system SHALL read SMTP configuration from environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`.

#### Scenario: Dev environment uses Mailtrap
- **WHEN** `SMTP_HOST` is set to a Mailtrap host
- **THEN** the system SHALL send emails via Mailtrap SMTP without modifying any code

### Requirement: Email templates SHALL be stored on filesystem
Email templates SHALL live in `backend/app/templates/email/` directory as `.html` files.

#### Scenario: Template is loaded at send time
- **WHEN** an email needs to be sent
- **THEN** the system SHALL load the corresponding Jinja2 template from `backend/app/templates/email/`

