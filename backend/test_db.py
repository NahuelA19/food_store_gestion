import asyncio
from database.client import init_engine, dispose_engine

async def test():
    try:
        engine = await init_engine()
        print(f"Engine created: {engine}")
        await dispose_engine()
        print("Engine disposed OK")
    except Exception as e:
        import traceback
        print(f"Error: {type(e).__name__}: {e}")
        traceback.print_exc()

asyncio.run(test())
