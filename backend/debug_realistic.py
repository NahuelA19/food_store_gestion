import asyncio
import logging
from app.main import app
from httpx import AsyncClient, ASGITransport

logging.basicConfig(level=logging.DEBUG)

async def test():
    print("\n=== Simulating uvicorn lifespan and request ===\n")
    
    # Step 1: Get the lifespan from the app
    # In FastAPI 0.x, the lifespan is stored in app.router.lifespan_context  or app.lifespan
    lifespan_context = app.router.lifespan_context
    print(f"Lifespan context: {lifespan_context}")
    
    try:
        async with lifespan_context(app):
            print("Lifespan started")
            
            # Now make the request
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.post("/api/auth/register", json={
                    "email": "realistic@test.com",
                    "password": "TestPassword123",
                    "first_name": "Test",
                    "last_name": "User"
                })
                
                print(f"Response status: {response.status_code}")
                print(f"Response: {response.text[:500]}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test())
