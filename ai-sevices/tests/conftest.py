import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_confidence_ai.db"
os.environ["ENVIRONMENT"] = "testing"

import pytest
import asyncio
from app.db.session import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(init_db())
    except Exception:
        pass
    yield
    loop.close()
    if os.path.exists("./test_confidence_ai.db"):
        try:
            os.remove("./test_confidence_ai.db")
        except Exception:
            pass
