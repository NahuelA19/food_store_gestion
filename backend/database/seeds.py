"""Database seeds (idempotent). Uses raw SQL with ON CONFLICT DO NOTHING."""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.security.password import get_password_hash


async def seed_estados_pedido(session: AsyncSession) -> None:
    estados: list[tuple[str, str, bool]] = [
        ("PENDIENTE", "Pedido creado, esperando pago", False),
        ("CONFIRMADO", "Pago confirmado, pedido aceptado", False),
        ("EN_PREP", "En preparación", False),
        ("LISTO", "Preparación finalizada, listo para despachar", False),
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
        ("CAJERO", "Cajero", "Gestiona cobros, pagos en efectivo y estados de pedidos"),
        ("CHEF", "Chef", "Gestiona la cocina y el stock de productos"),
        ("COCINA", "Cocinero", "Operación de cocina: recibe pedidos confirmados y gestiona su preparación"),
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
            INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone, must_change_password, created_at, updated_at)
            VALUES (:email, :password, true, 'admin', 'Admin', 'FoodStore', '+5491112345678', false, :created_at, :updated_at)
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


async def seed_staff_users(session: AsyncSession) -> None:
    """Create staff users with must_change_password=True."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    hashed = get_password_hash("Staff123!")

    staff_users = [
        ("cajero@foodstore.com", "cajero", "Carlos", "Mendoza", "+5491123456789", "CAJERO"),
        ("chef@foodstore.com", "chef", "Luciana", "Torres", "+5491134567890", "CHEF"),
        ("cocina@foodstore.com", "cocina", "Diego", "García", "+5491145678901", "COCINA"),
    ]

    for email, role, first_name, last_name, phone, rol_codigo in staff_users:
        result = await session.execute(
            text("""
                INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone, must_change_password, created_at, updated_at)
                VALUES (:email, :password, true, :role, :first_name, :last_name, :phone, true, :created_at, :updated_at)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            """),
            {
                "email": email,
                "password": hashed,
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "created_at": now,
                "updated_at": now,
            },
        )
        row = result.fetchone()
        if row:
            await session.execute(
                text("""
                    INSERT INTO usuario_rol (usuario_id, rol_codigo)
                    VALUES (:uid, :rol)
                    ON CONFLICT (usuario_id, rol_codigo) DO NOTHING
                """),
                {"uid": row[0], "rol": rol_codigo},
            )


async def seed_client_users(session: AsyncSession) -> None:
    """Create sample client users."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    hashed = get_password_hash("Client123!")

    clients = [
        ("maria.gonzalez@gmail.com", "María", "González", "+5491145678901"),
        ("juan.perez@gmail.com", "Juan", "Pérez", "+5491156789012"),
        ("laura.martinez@gmail.com", "Laura", "Martínez", "+5491167890123"),
    ]

    for email, first_name, last_name, phone in clients:
        result = await session.execute(
            text("""
                INSERT INTO users (email, hashed_password, is_active, role, first_name, last_name, phone, must_change_password, created_at, updated_at)
                VALUES (:email, :password, true, 'client', :first_name, :last_name, :phone, false, :created_at, :updated_at)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            """),
            {
                "email": email,
                "password": hashed,
                "first_name": first_name,
                "last_name": last_name,
                "phone": phone,
                "created_at": now,
                "updated_at": now,
            },
        )
        row = result.fetchone()
        if row:
            await session.execute(
                text("""
                    INSERT INTO usuario_rol (usuario_id, rol_codigo)
                    VALUES (:uid, 'CLIENT')
                    ON CONFLICT (usuario_id, rol_codigo) DO NOTHING
                """),
                {"uid": row[0]},
            )


async def seed_categories(session: AsyncSession) -> None:
    """Seed product categories."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    categories = [
        ("Pizzas", "Pizzas artesanales y clásicas al horno de piedra"),
        ("Hamburguesas", "Hamburguesas gourmet con pan brioche"),
        ("Bebidas", "Bebidas frías, calientes y artesanales"),
        ("Postres", "Postres caseros y opciones dulces"),
        ("Ensaladas", "Ensaladas frescas y saludables"),
        ("Pastas", "Pastas frescas con salsas artesanales"),
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


async def seed_ingredientes(session: AsyncSession) -> None:
    """Seed ingredient catalog with allergen information."""
    ingredientes: list[tuple[str, bool]] = [
        ("Mozzarella", True),
        ("Tomate", False),
        ("Albahaca", False),
        ("Pepperoni", False),
        ("Harina de trigo", True),
        ("Huevo", True),
        ("Queso parmesano", True),
        ("Queso azul", True),
        ("Queso cheddar", True),
        ("Cebolla", False),
        ("Lechuga", False),
        ("Carne vacuna", False),
        ("Pollo", False),
        ("Panceta", False),
        ("Crema de leche", True),
        ("Manteca", True),
        ("Aceite de oliva", False),
        ("Ajo", False),
        ("Frutilla", False),
        ("Azúcar", False),
        ("Queso ricota", True),
        ("Espinaca", False),
        ("Tomate cherry", False),
        ("Pepino", False),
        ("Anchoa", True),
    ]
    for nombre, es_alergeno in ingredientes:
        await session.execute(
            text("""
                INSERT INTO ingredientes (nombre, es_alergeno)
                VALUES (:nombre, :es_alergeno)
                ON CONFLICT (nombre) DO NOTHING
            """),
            {"nombre": nombre, "es_alergeno": es_alergeno},
        )


async def seed_products(session: AsyncSession) -> None:
    """Seed products with realistic data."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    result = await session.execute(
        text("SELECT id, name FROM categories ORDER BY name")
    )
    categories = {row[1]: row[0] for row in result.fetchall()}

    # (name, description, price, category_name, image_url)
    products: list[tuple[str, str, float, str, str]] = [
        # Pizzas
        (
            "Pizza Margherita",
            "Salsa de tomate, mozzarella fresca y albahaca al horno de piedra",
            950.00, "Pizzas",
            "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500",
        ),
        (
            "Pizza Pepperoni",
            "Salsa de tomate, mozzarella y rodajas de pepperoni",
            1100.00, "Pizzas",
            "https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=500",
        ),
        (
            "Pizza Cuatro Quesos",
            "Mozzarella, cheddar, azul y parmesano sobre base de tomate",
            1250.00, "Pizzas",
            "https://images.unsplash.com/photo-1571407-918c092ce338?w=500",
        ),
        (
            "Fugazzeta Rellena",
            "Pan de pizza relleno de mozzarella, cubierto con cebolla caramelizada",
            1350.00, "Pizzas",
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
        ),

        # Hamburguesas
        (
            "Hamburguesa Clásica",
            "Medallón de res, lechuga, tomate, cebolla y salsa especial en pan brioche",
            800.00, "Hamburguesas",
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        ),
        (
            "Hamburguesa Gourmet",
            "Carne premium, queso azul, panceta crocante y cebolla caramelizada",
            1200.00, "Hamburguesas",
            "https://images.unsplash.com/photo-1550547990-d5d85c17bae9?w=500",
        ),
        (
            "Hamburguesa de Pollo Crispy",
            "Filet de pollo rebozado, lechuga, tomate y mayo de ajo",
            1050.00, "Hamburguesas",
            "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500",
        ),
        (
            "Doble Cheddar",
            "Doble medallón de res, doble cheddar, pickles y ketchup ahumado",
            1400.00, "Hamburguesas",
            "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500",
        ),

        # Bebidas
        (
            "Coca Cola 1.5L",
            "Refresco clásico - 1.5 litros bien fría",
            450.00, "Bebidas",
            "https://images.unsplash.com/photo-1554866585-38a11c213bba?w=500",
        ),
        (
            "Agua Mineral 500ml",
            "Agua mineral sin gas",
            200.00, "Bebidas",
            "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=500",
        ),
        (
            "Limonada Artesanal",
            "Limonada casera con menta y jengibre - 500ml",
            350.00, "Bebidas",
            "https://images.unsplash.com/photo-1562677041-7e4f6d91d4f1?w=500",
        ),

        # Postres
        (
            "Tiramisú Clásico",
            "Postre italiano de café, mascarpone y cacao en polvo",
            600.00, "Postres",
            "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500",
        ),
        (
            "Cheesecake de Frutilla",
            "Base de galletitas, crema de queso y coulis de frutilla",
            650.00, "Postres",
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500",
        ),

        # Ensaladas
        (
            "Ensalada César",
            "Lechuga romana, croutons, parmesano, anchoas y aderezo César",
            700.00, "Ensaladas",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
        ),
        (
            "Ensalada Caprese",
            "Tomate cherry, mozzarella fresca, albahaca y aceite de oliva",
            650.00, "Ensaladas",
            "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=500",
        ),

        # Pastas
        (
            "Fettuccine Carbonara",
            "Fettuccine fresco con panceta, crema, yema de huevo y parmesano",
            1100.00, "Pastas",
            "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500",
        ),
        (
            "Ravioles de Ricota",
            "Ravioles rellenos de ricota y espinaca con salsa de manteca y salvia",
            1050.00, "Pastas",
            "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500",
        ),
        (
            "Pasta Primavera",
            "Penne con vegetales de estación, aceite de oliva y ajo",
            900.00, "Pastas",
            "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500",
        ),
    ]

    for name, description, price, category_name, image_url in products:
        category_id = categories.get(category_name)
        if not category_id:
            continue

        exists = await session.execute(
            text("SELECT id FROM products WHERE name = :name AND deleted_at IS NULL"),
            {"name": name},
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


async def seed_product_ingredientes(session: AsyncSession) -> None:
    """Link products to their ingredients."""
    product_ingredients: dict[str, list[str]] = {
        "Pizza Margherita": ["Mozzarella", "Tomate", "Albahaca", "Harina de trigo"],
        "Pizza Pepperoni": ["Mozzarella", "Tomate", "Pepperoni", "Harina de trigo"],
        "Pizza Cuatro Quesos": ["Mozzarella", "Queso azul", "Queso parmesano", "Queso cheddar", "Harina de trigo"],
        "Fugazzeta Rellena": ["Mozzarella", "Cebolla", "Harina de trigo", "Aceite de oliva"],
        "Hamburguesa Clásica": ["Carne vacuna", "Lechuga", "Tomate", "Cebolla", "Huevo"],
        "Hamburguesa Gourmet": ["Carne vacuna", "Queso azul", "Panceta", "Cebolla"],
        "Hamburguesa de Pollo Crispy": ["Pollo", "Lechuga", "Tomate", "Huevo", "Harina de trigo"],
        "Doble Cheddar": ["Carne vacuna", "Queso cheddar", "Pepino"],
        "Fettuccine Carbonara": ["Harina de trigo", "Huevo", "Panceta", "Crema de leche", "Queso parmesano"],
        "Ravioles de Ricota": ["Harina de trigo", "Huevo", "Queso ricota", "Espinaca", "Manteca"],
        "Pasta Primavera": ["Harina de trigo", "Aceite de oliva", "Ajo", "Tomate cherry"],
        "Ensalada César": ["Lechuga", "Queso parmesano", "Anchoa", "Huevo"],
        "Ensalada Caprese": ["Tomate cherry", "Mozzarella", "Albahaca", "Aceite de oliva"],
        "Tiramisú Clásico": ["Huevo", "Crema de leche", "Azúcar"],
        "Cheesecake de Frutilla": ["Queso ricota", "Huevo", "Manteca", "Azúcar", "Frutilla"],
    }

    result = await session.execute(
        text("SELECT id, name FROM products WHERE deleted_at IS NULL")
    )
    products = {row[1]: row[0] for row in result.fetchall()}

    result = await session.execute(
        text("SELECT id, nombre FROM ingredientes")
    )
    ingredientes = {row[1]: row[0] for row in result.fetchall()}

    for product_name, ingredient_names in product_ingredients.items():
        product_id = products.get(product_name)
        if not product_id:
            continue
        for ing_name in ingredient_names:
            ing_id = ingredientes.get(ing_name)
            if not ing_id:
                continue
            await session.execute(
                text("""
                    INSERT INTO producto_ingredientes (producto_id, ingrediente_id)
                    VALUES (:product_id, :ing_id)
                    ON CONFLICT (producto_id, ingrediente_id) DO NOTHING
                """),
                {"product_id": product_id, "ing_id": ing_id},
            )


async def seed_inventory(session: AsyncSession) -> None:
    """Seed inventory for all products with varied stock levels."""
    from datetime import datetime, timezone
    import random

    now = datetime.now(timezone.utc)
    rng = random.Random(42)  # Isolated RNG — reproducible without affecting global state

    result = await session.execute(
        text("SELECT id FROM products WHERE deleted_at IS NULL ORDER BY id")
    )
    product_ids = [row[0] for row in result.fetchall()]

    for product_id in product_ids:
        stock = rng.randint(20, 120)
        threshold = rng.choice([5, 8, 10, 15])
        await session.execute(
            text("""
                INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold, created_at, updated_at)
                VALUES (:product_id, :stock, :threshold, :created_at, :updated_at)
                ON CONFLICT (product_id) DO UPDATE
                    SET stock_quantity = EXCLUDED.stock_quantity,
                        low_stock_threshold = EXCLUDED.low_stock_threshold
            """),
            {
                "product_id": product_id,
                "stock": stock,
                "threshold": threshold,
                "created_at": now,
                "updated_at": now,
            },
        )


async def seed_branches(session: AsyncSession) -> None:
    """Seed branches."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    branches = [
        ("Casa Central", "Av. Corrientes 1234, CABA", "+541112345678", "central@foodstore.com"),
        ("Sucursal Norte", "Av. Cabildo 2345, CABA", "+541187654321", "norte@foodstore.com"),
        ("Sucursal Sur", "Av. Boedo 890, CABA", "+541156789012", "sur@foodstore.com"),
        ("Sucursal Oeste", "Av. Rivadavia 5678, CABA", "+541134567890", "oeste@foodstore.com"),
    ]

    for name, address, phone, email in branches:
        exists = await session.execute(
            text("SELECT id FROM branches WHERE name = :name"),
            {"name": name},
        )
        if exists.fetchone():
            continue
        await session.execute(
            text("""
                INSERT INTO branches (name, address, phone, email, is_active, created_at, updated_at)
                VALUES (:name, :address, :phone, :email, true, :created_at, :updated_at)
            """),
            {
                "name": name,
                "address": address,
                "phone": phone,
                "email": email,
                "created_at": now,
                "updated_at": now,
            },
        )


async def seed_direcciones(session: AsyncSession) -> None:
    """Seed delivery addresses for client users."""
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    direcciones_por_email: dict[str, list[tuple[str, str, str]]] = {
        "maria.gonzalez@gmail.com": [
            ("Av. Santa Fe 2540, Piso 3 Depto A", "Buenos Aires", "C1425BGK"),
        ],
        "juan.perez@gmail.com": [
            ("Av. Cabildo 1200, Piso 1 Depto B", "Buenos Aires", "C1426BGR"),
        ],
        "laura.martinez@gmail.com": [
            ("Corrientes 4500, Planta Baja", "Buenos Aires", "C1195AAD"),
        ],
    }

    for email, dirs in direcciones_por_email.items():
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email},
        )
        row = result.fetchone()
        if not row:
            continue
        user_id = row[0]

        for direccion, ciudad, cp in dirs:
            exists = await session.execute(
                text("SELECT id FROM direcciones_entrega WHERE usuario_id = :uid AND direccion = :dir"),
                {"uid": user_id, "dir": direccion},
            )
            if exists.fetchone():
                continue
            await session.execute(
                text("""
                    INSERT INTO direcciones_entrega (usuario_id, direccion, ciudad, provincia, codigo_postal, created_at, updated_at)
                    VALUES (:uid, :dir, :ciudad, :provincia, :cp, :created_at, :updated_at)
                """),
                {
                    "uid": user_id,
                    "dir": direccion,
                    "ciudad": ciudad,
                    "provincia": "Buenos Aires",
                    "cp": cp,
                    "created_at": now,
                    "updated_at": now,
                },
            )


async def seed_orders(session: AsyncSession) -> None:
    """Seed demo orders for client users."""
    from datetime import datetime, timezone, timedelta
    import json

    result = await session.execute(text("SELECT COUNT(*) FROM orders"))
    if result.scalar() > 0:
        return

    now = datetime.now(timezone.utc)

    result = await session.execute(
        text("""
            SELECT id, email FROM users
            WHERE email IN ('maria.gonzalez@gmail.com', 'juan.perez@gmail.com', 'laura.martinez@gmail.com')
        """)
    )
    clients = {row[1]: row[0] for row in result.fetchall()}
    if not clients:
        return

    result = await session.execute(
        text("SELECT id, price, name FROM products WHERE deleted_at IS NULL ORDER BY id LIMIT 14")
    )
    products = result.fetchall()
    if len(products) < 6:
        return

    maria = clients.get("maria.gonzalez@gmail.com")
    juan = clients.get("juan.perez@gmail.com")
    laura = clients.get("laura.martinez@gmail.com")

    # status must match the native PostgreSQL orderstatus ENUM — values are UPPERCASE (.name, not .value)
    orders_spec = [
        (maria, "ENTREGADO", "ENTREGADO", "approved", "MERCADOPAGO", 5,
            [(products[0], 2), (products[3], 1)]),
        (juan, "ENTREGADO", "ENTREGADO", "approved", "EFECTIVO", 3,
            [(products[1], 1), (products[7], 1), (products[8], 2)]),
        (maria, "CONFIRMADO", "CONFIRMADO", "approved", "MERCADOPAGO", 1,
            [(products[2], 1), (products[10], 1)]),
        (laura, "EN_PREP", "EN_PREP", "approved", "TRANSFERENCIA", 1,
            [(products[4], 2), (products[11], 1)]),
        (juan, "PENDIENTE", "PENDIENTE", "pending", "EFECTIVO", 0,
            [(products[5], 1)]),
        (laura, "CANCELADO", "CANCELADO", "failed", "MERCADOPAGO", 2,
            [(products[6], 1), (products[9], 2)]),
    ]

    for user_id, status, estado_codigo, payment_status, payment_method, days_ago, items in orders_spec:
        if not user_id:
            continue

        created_at = now - timedelta(days=days_ago)
        paid_at = created_at if payment_status == "approved" else None
        total = sum(p[1] * qty for p, qty in items)

        result = await session.execute(
            text("""
                INSERT INTO orders (user_id, status, total_amount, created_at, updated_at,
                    payment_status, payment_method, paid_at, estado_codigo, status_history)
                VALUES (:user_id, :status, :total, :created_at, :created_at,
                    :payment_status, :payment_method, :paid_at, :estado_codigo, :status_history)
                RETURNING id
            """),
            {
                "user_id": user_id,
                "status": status,
                "total": str(total),
                "created_at": created_at,
                "payment_status": payment_status,
                "payment_method": payment_method,
                "paid_at": paid_at,
                "estado_codigo": estado_codigo,
                "status_history": json.dumps([{
                    "estado": estado_codigo,
                    "fecha": created_at.isoformat(),
                }]),
            },
        )
        order_id = result.fetchone()[0]

        for product, qty in items:
            await session.execute(
                text("""
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, nombre_snapshot, precio_snapshot)
                    VALUES (:order_id, :product_id, :quantity, :unit_price, :nombre, :precio)
                """),
                {
                    "order_id": order_id,
                    "product_id": product[0],
                    "quantity": qty,
                    "unit_price": str(product[1]),
                    "nombre": product[2],
                    "precio": str(product[1]),
                },
            )


async def seed_reviews(session: AsyncSession) -> None:
    """Seed product reviews from client users."""
    from datetime import datetime, timezone, timedelta

    result = await session.execute(text("SELECT COUNT(*) FROM reviews"))
    if result.scalar() > 0:
        return

    now = datetime.now(timezone.utc)

    result = await session.execute(
        text("""
            SELECT id, email FROM users
            WHERE email IN ('maria.gonzalez@gmail.com', 'juan.perez@gmail.com', 'laura.martinez@gmail.com')
        """)
    )
    clients = {row[1]: row[0] for row in result.fetchall()}

    result = await session.execute(
        text("SELECT id, name FROM products WHERE deleted_at IS NULL ORDER BY id")
    )
    products = {row[1]: row[0] for row in result.fetchall()}

    maria = clients.get("maria.gonzalez@gmail.com")
    juan = clients.get("juan.perez@gmail.com")
    laura = clients.get("laura.martinez@gmail.com")

    # (user_id, product_name, rating, title, comment, is_approved)
    reviews = [
        (maria, "Pizza Margherita", 5, "La mejor pizza",
         "Masa crocante, ingredientes frescos. La recomiendo totalmente.", True),
        (juan, "Hamburguesa Gourmet", 5, "Increíble",
         "El queso azul con la cebolla caramelizada es una combinación perfecta.", True),
        (laura, "Fettuccine Carbonara", 4, "Muy rica",
         "La salsa es cremosa y la pasta bien al dente. Un poco cara pero vale la pena.", True),
        (juan, "Pizza Cuatro Quesos", 4, "Buena combinación",
         "Quesos muy bien elegidos, aunque podría tener un poco más de base.", True),
        (maria, "Cheesecake de Frutilla", 5, "Postre espectacular",
         "El mejor cheesecake que probé. La base de galletitas es perfecta.", True),
        (laura, "Ensalada César", 3, "Correcta",
         "Está bien pero el aderezo no es tan casero como dice el menú.", False),
    ]

    for i, (user_id, product_name, rating, title, comment, is_approved) in enumerate(reviews):
        if not user_id:
            continue
        product_id = products.get(product_name)
        if not product_id:
            continue

        await session.execute(
            text("""
                INSERT INTO reviews (product_id, user_id, rating, title, comment, is_approved, created_at, updated_at)
                VALUES (:product_id, :user_id, :rating, :title, :comment, :is_approved, :created_at, :updated_at)
                ON CONFLICT (product_id, user_id) DO NOTHING
            """),
            {
                "product_id": product_id,
                "user_id": user_id,
                "rating": rating,
                "title": title,
                "comment": comment,
                "is_approved": is_approved,
                "created_at": now - timedelta(days=i),
                "updated_at": now,
            },
        )


async def run_seeds(session: AsyncSession) -> None:
    await seed_estados_pedido(session)
    await seed_formas_pago(session)
    await seed_roles(session)
    await seed_admin_user(session)
    await seed_staff_users(session)
    await seed_client_users(session)
    await seed_categories(session)
    await seed_ingredientes(session)
    await seed_products(session)
    await seed_product_ingredientes(session)
    await seed_inventory(session)
    await seed_branches(session)
    await seed_direcciones(session)
    await seed_orders(session)
    await seed_reviews(session)
