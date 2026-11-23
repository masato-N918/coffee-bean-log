from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.choices import (
    BREW_METHODS,
    DOSE_UNITS,
    GRIND_SIZES,
    TEMPERATURES,
    WATER_UNITS,
    in_check,
)

if TYPE_CHECKING:
    from app.models.bean import Bean


class BrewRecord(Base):
    """抽出記録（brew_records テーブル）。"""

    __tablename__ = "brew_records"
    __table_args__ = (
        CheckConstraint(in_check("method", BREW_METHODS), name="ck_brew_records_method"),
        CheckConstraint(in_check("temperature", TEMPERATURES), name="ck_brew_records_temperature"),
        CheckConstraint(in_check("dose_unit", DOSE_UNITS), name="ck_brew_records_dose_unit"),
        CheckConstraint(in_check("water_unit", WATER_UNITS), name="ck_brew_records_water_unit"),
        CheckConstraint(in_check("grind_size", GRIND_SIZES), name="ck_brew_records_grind_size"),
        CheckConstraint("water_temp_c BETWEEN 50 AND 100", name="ck_brew_records_water_temp_c"),
        CheckConstraint("brew_time_sec BETWEEN 1 AND 3600", name="ck_brew_records_brew_time_sec"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bean_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("beans.id", ondelete="CASCADE"), nullable=False
    )
    brewed_on: Mapped[date] = mapped_column(Date, nullable=False)
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    temperature: Mapped[str] = mapped_column(String(10), nullable=False, server_default="hot")
    dose_amount: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    dose_unit: Mapped[str | None] = mapped_column(String(10))
    water_amount: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    water_unit: Mapped[str | None] = mapped_column(String(10))
    equipment: Mapped[str | None] = mapped_column(String(100))
    grind_size: Mapped[str | None] = mapped_column(String(20))
    water_temp_c: Mapped[int | None] = mapped_column(Integer)
    brew_time_sec: Mapped[int | None] = mapped_column(Integer)
    taste_memo: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )

    bean: Mapped[Bean] = relationship(back_populates="brew_records")
