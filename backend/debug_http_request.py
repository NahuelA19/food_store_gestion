import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_http_direct():
    """
    Simulate HTTP request WITHOUT lifespan.
    This is different from uvicorn which runs lifespan.
    """
    print("=== Test 1: NO lifespan (like user testing directly) ===")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/register", json={
            "email": "direct@test.com",
            "password": "TestPassword123",
            "first_name": "Test",
            "last_name": "User"
        })
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("OK: Registered successfully")
        else:
            print(f"ERROR: {response.text}")

asyncio.run(test_http_direct())
