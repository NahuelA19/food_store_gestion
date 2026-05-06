## ADDED Requirements

### Requirement: SQLAlchemy v2 async ORM model definition
The system SHALL provide SQLAlchemy v2 ORM models with async/await support and type hints for database entity representation.

#### Scenario: Define base ORM model class
- **WHEN** developers import from `backend.app.models.base`
- **THEN** system provides `Base` class with `async_create_all()` and async context support
- **AND** all ORM models inherit from this `Base`

#### Scenario: User ORM model with type hints
- **WHEN** user module is imported
- **THEN** system provides `User` model with fields: `id`, `email`, `hashed_password`, `is_active`, `created_at`
- **AND** email column has UNIQUE constraint
- **AND** created_at uses server default (current timestamp)

#### Scenario: Product ORM model with relationships
- **WHEN** product module is imported
- **THEN** system provides `Product` model with fields: `id`, `name`, `description`, `price`, `category_id`, `is_available`, `created_at`, `updated_at`
- **AND** category_id is a foreign key to Category table
- **AND** models use `Mapped[]` type hints for SQLAlchemy v2 compatibility

#### Scenario: Category ORM model
- **WHEN** category module is imported
- **THEN** system provides `Category` model with fields: `id`, `name`, `description`, `created_at`
- **AND** name column has UNIQUE constraint

#### Scenario: Order ORM model structure
- **WHEN** order module is imported
- **THEN** system provides `Order` model with fields: `id`, `user_id`, `status`, `total_amount`, `created_at`, `updated_at`
- **AND** user_id is foreign key to User table
- **AND** status is an enum with values: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`

#### Scenario: OrderItem ORM model for line items
- **WHEN** order_item module is imported
- **THEN** system provides `OrderItem` model with fields: `id`, `order_id`, `product_id`, `quantity`, `unit_price`
- **AND** both order_id and product_id are foreign keys

---

### Requirement: Type-safe SQLAlchemy models with Pydantic compatibility
The system SHALL provide ORM models that work seamlessly with Pydantic v2 for request/response validation.

#### Scenario: Pydantic ConfigDict from ORM
- **WHEN** Pydantic schema includes `ConfigDict(from_attributes=True)`
- **THEN** Pydantic can instantiate schema from ORM model instance
- **EXAMPLE**: `UserResponse.model_validate(orm_user_instance)` succeeds

#### Scenario: Exclude ORM internal fields in Pydantic serialization
- **WHEN** Pydantic schema serializes ORM model with `field_serializer` or similar
- **THEN** SQLAlchemy internal fields (e.g., `sa_instance_state`) are excluded
- **AND** only domain fields are included in JSON response

#### Scenario: Lazy-load relationships NOT resolved by default
- **WHEN** ORM model has relationship fields (e.g., `orders` on User)
- **THEN** relationships are NOT loaded by default (lazy loading deferred)
- **AND** explicitly loaded relationships use `selectinload` or similar pattern

---

### Requirement: Column constraints and indexes via ORM
The system SHALL define database constraints (unique, foreign key, not null) and indexes directly in ORM models for schema clarity.

#### Scenario: Primary key definition
- **WHEN** model is saved to database
- **THEN** system auto-increments primary key starting from 1

#### Scenario: Unique constraints
- **WHEN** attempt to insert duplicate email in users table
- **THEN** database raises unique violation error
- **AND** application translates to 409 Conflict HTTP response

#### Scenario: Foreign key constraints
- **WHEN** attempt to create Product with non-existent category_id
- **THEN** database raises foreign key violation error

#### Scenario: Not null constraints
- **WHEN** attempt to insert Product without required `name` field
- **THEN** database raises not null violation error
- **AND** application translates to 400 Bad Request

#### Scenario: Index on frequently-queried columns
- **WHEN** Product table is created
- **THEN** indexes are automatically created on: `email` (users), `product_id` (orders)
- **AND** query planner uses indexes for WHERE and JOIN conditions

---

### Requirement: Async session management and transaction handling
The system SHALL provide async-safe session management with proper transaction scoping.

#### Scenario: Session lifecycle in request handler
- **WHEN** HTTP request handler receives dependency `db: AsyncSession`
- **THEN** new async session is created for the request
- **AND** session is committed at end of successful handler
- **AND** session is rolled back if handler raises exception

#### Scenario: Nested transaction with savepoint
- **WHEN** code manually creates savepoint: `async with db.begin_nested():`
- **THEN** inner transaction creates a savepoint
- **AND** inner rollback does NOT rollback outer transaction

#### Scenario: Explicit transaction management
- **WHEN** code calls `await db.commit()`
- **THEN** current transaction is committed
- **AND** autoflush happens before commit

#### Scenario: Connection reuse with async context
- **WHEN** multiple database operations use same session in async context
- **THEN** operations share same connection
- **AND** no connection leaks occur
