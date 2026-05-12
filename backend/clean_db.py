import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def clean_db():
    engine = create_async_engine('postgresql+asyncpg://food_store_user:root@localhost:5433/food_store')
    async with engine.connect() as conn:
        print("Limpiando tablas y columnas conflictivas...")
        await conn.execute(text('DROP TABLE IF EXISTS ingredientes, formas_pago, estados_pedido, refresh_tokens, producto_ingredientes, historial_estados_pedido, pagos CASCADE'))
        
        # Intentar dropear columnas si existen (ignorar errores si no existen)
        tables_to_clean = {
            'products': ['deleted_at'],
            'categories': ['deleted_at'],
            'users': ['deleted_at', 'stripe_customer_id'],
            'order_items': ['nombre_snapshot', 'precio_snapshot'],
            'orders': ['stripe_payment_intent_id', 'stripe_customer_id', 'estado_codigo']
        }
        
        for table, cols in tables_to_clean.items():
            for col in cols:
                try:
                    await conn.execute(text(f'ALTER TABLE {table} DROP COLUMN IF EXISTS {col} CASCADE'))
                except Exception as e:
                    print(f"Error dropeando {table}.{col}: {e}")
        
        await conn.commit()
        print("Cancha limpia para la migración.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clean_db())
