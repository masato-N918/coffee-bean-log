"""テスト共通の準備。

DB を使うテストは開発用の MySQL に接続し、テストごとにトランザクションを張って
最後にロールバックする（API 内の commit はセーブポイントになるので、開発データは残らない）。
前提: MySQL が起動していて、`uv run alembic upgrade head` 済みであること。
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app


@pytest.fixture
def db() -> Generator[Session]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
