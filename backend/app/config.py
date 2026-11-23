from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリの設定。環境変数、または backend/.env から読み込む。"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # 例: mysql+pymysql://app:password@127.0.0.1:3306/coffee_bean_log?charset=utf8mb4
    database_url: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
