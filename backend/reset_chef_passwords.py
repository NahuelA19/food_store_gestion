import asyncio
import os
import sys

async def reset_passwords():
    from app.security.password import get_password_hash
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    new_hash = get_password_hash("chef123")
    print(f"Generated hash: {new_hash[:20]}...")

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    engine = create_async_engine(url)
    async with engine.begin() as conn:
        result = await conn.execute(
            text("UPDATE users SET hashed_password = :h, must_change_password = false WHERE email IN ('chef@foodstore.com', 'cocina@foodstore.com') RETURNING id, email"),
            {"h": new_hash}
        )
        rows = result.fetchall()
        print(f"Updated {len(rows)} users:")
        for row in rows:
            print(f"  id={row[0]} email={row[1]}")
    print("Done!")

asyncio.run(reset_passwords())
