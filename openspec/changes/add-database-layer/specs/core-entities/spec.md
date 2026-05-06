## ADDED Requirements

### Requirement: Core user entity model
The system SHALL provide a User entity with essential fields for authentication and user management.

#### Scenario: User model fields
- **WHEN** User ORM model is used
- **THEN** system provides fields:
  - `id` (auto-increment primary key)
  - `email` (unique, not null)
  - `hashed_password` (not null)
  - `is_active` (boolean, default True)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, auto-update on change)

#### Scenario: User email validation
- **WHEN** new User is created
- **THEN** email must be unique across all users
- **AND** database enforces unique constraint (not just application logic)

#### Scenario: User creation timestamp
- **WHEN** User is first inserted
- **THEN** `created_at` is automatically set to current database timestamp
- **AND** developer does NOT need to set it explicitly

#### Scenario: User update timestamp
- **WHEN** User record is modified
- **THEN** `updated_at` is automatically updated to current timestamp
- **AND** this happens on database trigger or application logic

---

### Requirement: Core product entity model
The system SHALL provide a Product entity with catalog and availability information.

#### Scenario: Product model fields
- **WHEN** Product ORM model is used
- **THEN** system provides fields:
  - `id` (auto-increment primary key)
  - `name` (not null, required)
  - `description` (text, optional)
  - `price` (decimal with 2 places, not null)
  - `category_id` (foreign key to Category, not null)
  - `is_available` (boolean, default True)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, auto-update on change)

#### Scenario: Product price precision
- **WHEN** Product price is stored
- **THEN** system stores as DECIMAL(10, 2) (supports up to $99,999.99)
- **AND** no precision loss on decimal values

#### Scenario: Product category relationship
- **WHEN** Product is queried
- **THEN** `category_id` references existing Category record
- **AND** orphaned products (category deleted) are prevented by foreign key constraint

#### Scenario: Product availability flag
- **WHEN** Product `is_available` is False
- **THEN** system indicates product is out of stock or delisted
- **AND** frontend can filter queries by availability

---

### Requirement: Core category entity model
The system SHALL provide a Category entity for product classification.

#### Scenario: Category model fields
- **WHEN** Category ORM model is used
- **THEN** system provides fields:
  - `id` (auto-increment primary key)
  - `name` (unique, not null)
  - `description` (text, optional)
  - `created_at` (timestamp, server default)

#### Scenario: Category name uniqueness
- **WHEN** new Category is created
- **THEN** name must be unique
- **AND** database enforces unique constraint (case-sensitive)

#### Scenario: Category products relationship
- **WHEN** Category is queried with products relationship
- **THEN** relationship is available but NOT automatically loaded (lazy loading)
- **AND** developer must explicitly load with `selectinload` or `joinedload`

---

### Requirement: Core order entity model
The system SHALL provide an Order entity for managing customer purchases.

#### Scenario: Order model fields
- **WHEN** Order ORM model is used
- **THEN** system provides fields:
  - `id` (auto-increment primary key)
  - `user_id` (foreign key to User, not null)
  - `status` (enum: pending, confirmed, shipped, delivered, cancelled)
  - `total_amount` (decimal with 2 places, not null)
  - `created_at` (timestamp, server default)
  - `updated_at` (timestamp, auto-update on change)

#### Scenario: Order user relationship
- **WHEN** Order is created
- **THEN** `user_id` must reference existing User
- **AND** preventing orphaned orders

#### Scenario: Order status enum
- **WHEN** Order status is set
- **THEN** system only accepts: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`
- **AND** invalid status values are rejected at database level (constraint)

#### Scenario: Order total amount precision
- **WHEN** Order total is stored
- **THEN** system stores as DECIMAL(12, 2) (supports large orders)
- **AND** precision preserved across calculations

---

### Requirement: OrderItem entity for line items
The system SHALL provide an OrderItem entity to track individual items within an order.

#### Scenario: OrderItem model fields
- **WHEN** OrderItem ORM model is used
- **THEN** system provides fields:
  - `id` (auto-increment primary key)
  - `order_id` (foreign key to Order, not null)
  - `product_id` (foreign key to Product, not null)
  - `quantity` (integer, >= 1)
  - `unit_price` (decimal with 2 places, not null)

#### Scenario: OrderItem product reference
- **WHEN** OrderItem is created
- **THEN** `product_id` must reference existing Product
- **AND** unit_price is recorded (snapshot of product price at order time, not current price)

#### Scenario: OrderItem order reference
- **WHEN** OrderItem is created
- **THEN** `order_id` must reference existing Order
- **AND** deleting Order cascades to delete associated OrderItems

#### Scenario: OrderItem cascade delete
- **WHEN** Order is deleted
- **THEN** all associated OrderItems are automatically deleted
- **AND** database enforces this via foreign key CASCADE DELETE

#### Scenario: OrderItem quantity validation
- **WHEN** OrderItem quantity is set
- **THEN** quantity must be >= 1
- **AND** system rejects zero or negative quantities

---

### Requirement: Relationships between entities
The system SHALL define lazy-loaded relationships for navigation between entities (not resolved by default).

#### Scenario: Lazy relationship definition
- **WHEN** User model includes relationship: `orders = relationship("Order", lazy="select")`
- **THEN** `orders` property is available but NOT automatically populated
- **AND** accessing `user.orders` in a loop causes N+1 queries (solved in Phase 2 with eager loading)

#### Scenario: Foreign key integrity
- **WHEN** relationships are defined
- **THEN** foreign key constraints exist at database level
- **AND** referential integrity is enforced (no orphaned records)

#### Scenario: Cascade behavior
- **WHEN** cascade delete is configured on relationship
- **THEN** deleting parent (e.g., Order) automatically deletes children (OrderItems)
- **AND** cascade is configured in ORM, not just manually

---

### Requirement: Entity timestamp tracking
The system SHALL track creation and modification timestamps on all core entities.

#### Scenario: created_at on all entities
- **WHEN** entity is inserted
- **THEN** `created_at` is automatically set to current database timestamp
- **AND** developer cannot override (readonly)

#### Scenario: updated_at on all entities
- **WHEN** entity is modified
- **THEN** `updated_at` is automatically updated to current timestamp
- **AND** `updated_at` remains unchanged if no columns are actually modified

#### Scenario: Timestamp timezone handling
- **WHEN** timestamps are stored
- **THEN** system stores as UTC timezone-aware datetime
- **AND** all comparisons use UTC (no local timezone confusion)
