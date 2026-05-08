# -*- coding: utf-8 -*-
import asyncio
from contextlib import asynccontextmanager
from app.main import app
from httpx import AsyncClient, ASGITransport

async def test_with_uvicorn_lifespan():
    print("Step 1: Running app lifespan...")
    
    # Get the lifespan contextmanager from app
    lifespan_ctx = app.lifespan
    
    try:
        async with lifespan_ctx(app):
            print("Step 2: Lifespan entered, now making request...")
            
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post("/api/auth/register", json={
                    "email": "uvicorntest@test.com",
                    "password": "TestPassword123",
                    "first_name": "Test",
                    "last_name": "User"
                })
                print(f"Step 3: Response status: {response.status_code}")
                if response.status_code != 201:
                    print(f"ERROR Response: {response.text}")
                else:
                    print(f"Success: {response.json().get('email')}")
            
            print("Step 4: Request completed, lifespan cleanup...")
    except Exception as e:
        print(f"EXCEPTION: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    
    print("Step 5: Done!")

asyncio.run(test_with_uvicorn_lifespan())
