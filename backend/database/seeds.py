"""Database seeds (idempotent). Uses raw SQL with ON CONFLICT DO NOTHING."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.security.password import get_password_hash


async def seed_estados_pedido(session: AsyncSession) -> None:
    estados: list[tuple[str, str, bool]] = [
        ("PENDIENTE", "Pedido creado, esperando pago", False),
        ("CONFIRMADO", "Pago confirmado, pedido aceptado", False),
        ("EN_PREP", "En preparación", False),
        ("EN_CAMINO", "En camino al cliente", False),
        ("ENTREGADO", "Entregado al cliente", True),
        ("CANCELADO", "Cancelado", True),
    ]
    await session.execute(
        text("""
            INSERT INTO estados_pedido (codigo, descripcion, es_terminal)
            VALUES (:codigo, :descripcion, :es_terminal)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "descripcion": d, "es_terminal": t} for (c, d, t) in estados],
    )


async def seed_formas_pago(session: AsyncSession) -> None:
    formas: list[tuple[str, str, bool]] = [
        ("MERCADOPAGO", "MercadoPago (tarjeta/débito)", True),
        ("EFECTIVO", "Pago en efectivo contra entrega", True),
        ("TRANSFERENCIA", "Transferencia bancaria", True),
    ]
    await session.execute(
        text("""
            INSERT INTO formas_pago (codigo, nombre, habilitado)
            VALUES (:codigo, :nombre, :habilitado)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "nombre": n, "habilitado": h} for (c, n, h) in formas],
    )


async def seed_roles(session: AsyncSession) -> None:
    roles: list[tuple[str, str, str]] = [
        ("ADMIN", "Administrador", "Acceso total al sistema"),
        ("STOCK", "Gestor de stock", "Gestiona productos e ingredientes"),
        ("PEDIDOS", "Gestor de pedidos", "Gestiona pedidos y entregas"),
        ("CLIENT", "Cliente", "Compra productos y consulta pedidos"),
    ]
    await session.execute(
        text("""
            INSERT INTO roles (codigo, nombre, descripcion)
            VALUES (:codigo, :nombre, :descripcion)
            ON CONFLICT (codigo) DO NOTHING
        """),
        [{"codigo": c, "nombre": n, "descripcion": d} for (c, n, d) in roles],
    )


async def seed_admin_user(session: AsyncSession) -> None:
    """Create admin user and assign ADMIN role."""
    from datetime import datetime, timezone
    
    hashed = get_password_hash("admin123")
    now = datetime.now(timezone.utc)
    result = await session.execute(
        text("""
            INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone, created_at, updated_at)
            VALUES (:email, :password, true, 'admin', 'Admin', 'FoodStore', '+5491112345678', :created_at, :updated_at)
            ON CONFLICT (email) DO UPDATE SET is_active = TRUE
            RETURNING id
        """),
        {
            "email": "admin@foodstore.com",
            "password": hashed,
            "created_at": now,
            "updated_at": now,
        },
    )
    row = result.fetchone()
    if row:
        admin_id = row[0]
        await session.execute(
            text("""
                INSERT INTO usuario_rol (usuario_id, rol_codigo)
                VALUES (:uid, 'ADMIN')
                ON CONFLICT (usuario_id, rol_codigo) DO NOTHING
            """),
            {"uid": admin_id},
        )


async def seed_categories(session: AsyncSession) -> None:
    """Seed product categories."""
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    categories = [
        ("Pizzas", "Pizzas tradicionales y especiales"),
        ("Hamburguesas", "Hamburguesas gourmet y clásicas"),
        ("Bebidas", "Bebidas frías y calientes"),
        ("Postres", "Postres y opciones dulces"),
        ("Ensaladas", "Ensaladas frescas y saludables"),
    ]
    
    for name, description in categories:
        await session.execute(
            text("""
                INSERT INTO categories (name, description, created_at, updated_at)
                VALUES (:name, :description, :created_at, :updated_at)
                ON CONFLICT (name) DO NOTHING
            """),
            {
                "name": name,
                "description": description,
                "created_at": now,
                "updated_at": now,
            },
        )


async def seed_products(session: AsyncSession) -> None:
    """Seed products with realistic data."""
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    
    # Get category IDs
    result = await session.execute(
        text("SELECT id, name FROM categories ORDER BY name")
    )
    categories = {row[1]: row[0] for row in result.fetchall()}
    
    products = [
        # Pizzas
        ("Pizza Margherita", "Pizza clásica con tomate, mozzarella y albahaca", 950, "Pizzas", 
         "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500"),
        ("Pizza Pepperoni", "Pizza con salsa de tomate, queso y pepperoni", 1100, "Pizzas",
         "https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=500"),
        ("Pizza Cuatro Quesos", "Mozzarella, cheddar, azul y parmesano", 1250, "Pizzas",
         "https://images.unsplash.com/photo-1571407-918c092ce338?w=500"),
        
        # Hamburguesas
        ("Hamburguesa Clásica", "Carne, lechuga, tomate, cebolla y salsa", 800, "Hamburguesas",
         "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"),
        ("Hamburguesa Gourmet", "Carne premium, queso azul, cebolla caramelizada", 1200, "Hamburguesas",
         "https://images.unsplash.com/photo-1550547990-d5d85c17bae9?w=500"),
        
        # Bebidas
        ("Coca Cola 2L", "Refesco clásico - 2 litros", 450, "Bebidas",
         "https://images.unsplash.com/photo-1554866585-38a11c213bba?w=500"),
        ("Cerveza Artesanal", "Cerveza IPA artesanal - 750ml", 650, "Bebidas",
         "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=500"),
        
        # Postres
        ("Tiramisú", "Postre italiano clásico", 550, "Postres",
         "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500"),
        ("Helado Artesanal", "Helado casero - 1kg", 800, "Postres",
         "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500"),
        
        # Ensaladas
        ("Ensalada César", "Lechuga romana, croutons, queso parmesano", 650, "Ensaladas",
         "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"),
    ]
    
    for name, description, price, category_name, image_url in products:
        category_id = categories.get(category_name)
        if not category_id:
            continue
        
        # Check if product already exists
        exists = await session.execute(
            text("SELECT id FROM products WHERE name = :name AND deleted_at IS NULL"),
            {"name": name}
        )
        if exists.fetchone():
            continue
            
        await session.execute(
            text("""
                INSERT INTO products (name, description, price, category_id, is_available, image_url, created_at, updated_at)
                VALUES (:name, :description, :price, :category_id, true, :image_url, :created_at, :updated_at)
            """),
            {
                "name": name,
                "description": description,
                "price": price,
                "category_id": category_id,
                "image_url": image_url,
                "created_at": now,
                "updated_at": now,
            },
        )


async def seed_inventory(session: AsyncSession) -> None:
    """Seed inventory for all products."""
    from datetime import datetime, timezone
    
    now = datetime.now(timezone.utc)
    
    # Get all products
    result = await session.execute(
        text("SELECT id FROM products WHERE deleted_at IS NULL ORDER BY id")
    )
    product_ids = [row[0] for row in result.fetchall()]
    
    for product_id in product_ids:
        await session.execute(
            text("""
                INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold, created_at, updated_at)
                VALUES (:product_id, :stock, :threshold, :created_at, :updated_at)
                ON CONFLICT (product_id) DO UPDATE SET stock_quantity = 100, low_stock_threshold = 10
            """),
            {
                "product_id": product_id,
                "stock": 100,
                "threshold": 10,
                "created_at": now,
                "updated_at": now,
            },
        )


async def seed_test_user(session: AsyncSession) -> None:
    """Create a test user for testing."""
    from datetime import datetime, timezone
    
    hashed = get_password_hash("test123456")
    now = datetime.now(timezone.utc)
    
    result = await session.execute(
        text("""
            INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone, created_at, updated_at)
            VALUES (:email, :password, true, 'client', 'Test', 'User', '+5491198765432', :created_at, :updated_at)
            ON CONFLICT (email) DO UPDATE SET is_active = TRUE
            RETURNING id
        """),
        {
            "email": "test@example.com",
            "password": hashed,
            "created_at": now,
            "updated_at": now,
        },
    )
    row = result.fetchone()
    if row:
        test_user_id = row[0]
        # Assign CLIENT role
        await session.execute(
            text("""
                INSERT INTO usuario_rol (usuario_id, rol_codigo)
                VALUES (:uid, 'CLIENT')
                ON CONFLICT (usuario_id, rol_codigo) DO NOTHING
            """),
            {"uid": test_user_id},
        )


async def run_seeds(session: AsyncSession) -> None:
    await seed_estados_pedido(session)
    await seed_formas_pago(session)
    await seed_roles(session)
    await seed_admin_user(session)
    await seed_categories(session)
    await seed_products(session)
    await seed_inventory(session)
    await seed_test_user(session)
