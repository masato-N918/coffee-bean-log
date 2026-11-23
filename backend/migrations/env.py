from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models  # noqa: F401  モデルを Base.metadata に登録するために読み込む
from app.config import get_settings
from app.database import Base

# alembic.ini の設定を読むためのオブジェクト
config = context.config

# DB の接続先は alembic.ini ではなく、backend/.env（DATABASE_URL）から読み込む
# （"%" は ini の書式で特別な意味を持つため "%%" にエスケープする）
config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))

# ログの設定（alembic.ini の [loggers] など）
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# autogenerate（モデルとDBの差分からマイグレーションを自動生成）で比べる対象。
# モデルは上の import app.models で Base.metadata に登録している。
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """DB に接続せず、実行する SQL を出力するモード（alembic upgrade --sql）。"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """DB に接続してマイグレーションを実行するモード（通常はこちら）。"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
