from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, Integer, String, Text, text
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.choices import PROCESSES, ROAST_GROUPS, ROAST_LEVELS, in_check

if TYPE_CHECKING:
    from app.models.brew_record import BrewRecord


class Bean(Base):
    """豆（beans テーブル）。"""

    __tablename__ = "beans"
    __table_args__ = (
        CheckConstraint(in_check("roast_group", ROAST_GROUPS), name="ck_beans_roast_group"),
        CheckConstraint(in_check("roast_level", ROAST_LEVELS), name="ck_beans_roast_level"),
        CheckConstraint(in_check("process", PROCESSES), name="ck_beans_process"),
        CheckConstraint("weight_g BETWEEN 1 AND 10000", name="ck_beans_weight_g"),
        CheckConstraint("price BETWEEN 0 AND 1000000", name="ck_beans_price"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_beans_rating"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    shop: Mapped[str | None] = mapped_column(String(100))
    origin: Mapped[str | None] = mapped_column(String(100))
    roast_group: Mapped[str | None] = mapped_column(String(20))
    roast_level: Mapped[str | None] = mapped_column(String(20))
    process: Mapped[str | None] = mapped_column(String(20))
    purchased_on: Mapped[date | None] = mapped_column(Date)
    weight_g: Mapped[int | None] = mapped_column(Integer)
    price: Mapped[int | None] = mapped_column(Integer)
    rating: Mapped[int | None] = mapped_column(TINYINT)
    memo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )

    # 豆を削除すると抽出記録も削除する（DB 側の ON DELETE CASCADE に任せる）
    brew_records: Mapped[list[BrewRecord]] = relationship(
        back_populates="bean", cascade="all, delete-orphan", passive_deletes=True
    )
