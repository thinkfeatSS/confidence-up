import pytest
import asyncio
from app.db.session import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(init_db())
    yield
    loop.close()
