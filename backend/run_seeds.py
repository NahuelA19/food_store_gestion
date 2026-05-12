import asyncio
from database.session import get_async_session_local
from database.seeds import run_seeds

async def main():
    session_factory = get_async_session_local()
    async with session_factory() as session:
        print("Corriendo seeds...")
        await run_seeds(session)
        await session.commit()
        print("Seeds completados exitosamente.")

if __name__ == "__main__":
    asyncio.run(main())
