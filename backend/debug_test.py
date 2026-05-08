import asyncio
from app.main import app
from database.client import init_engine, dispose_engine
from httpx import AsyncClient, ASGITransport

async def simulate_http():
    # Simulate lifespan startup
    print("Step 1: Starting lifespan...")
    await init_engine()
    print("Step 2: Engine initialized")
    
    # Simulate HTTP request
    print("Step 3: Making HTTP request...")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.post("/api/auth/register", json={
                "email": "newtestuser@test.com",
                "password": "TestPassword123",
                "first_name": "Test",
                "last_name": "User"
            })
            print(f"Step 4: Response status: {response.status_code}")
            print(f"Step 5: Response body: {response.text[:300]}")
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
    
    # Cleanup
    print("Step 6: Disposing engine...")
    await dispose_engine()
    print("Done!")

asyncio.run(simulate_http())
