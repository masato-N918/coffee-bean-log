from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

# pool_pre_ping: 切れた接続を使う前に検知して張り直す
engine = create_engine(get_settings().database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    """すべてのテーブル（モデル）の親クラス。"""


def get_db() -> Generator[Session]:
    """API ごとに DB セッションを1つ作り、終わったら閉じる（FastAPI の Depends で使う）。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
