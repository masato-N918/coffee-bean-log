"""抽出記録（brew_records）の API で受け取る・返すデータの形と入力チェック。

制約は docs/機能要件.md の「3.2 抽出記録の入力項目」に合わせる。
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, model_validator

from app.models.choices import BREW_METHODS, DOSE_UNITS, GRIND_SIZES, TEMPERATURES, WATER_UNITS
from app.schemas.common import INPUT_CONFIG, Text100, Text1000

# 選択肢は choices.py のタプルから作る（値を二重に書かない）
BrewMethod = Literal[*BREW_METHODS]
Temperature = Literal[*TEMPERATURES]
GrindSize = Literal[*GRIND_SIZES]
DoseUnit = Literal[*DOSE_UNITS]
WaterUnit = Literal[*WATER_UNITS]

# 量（DB は DECIMAL(5,1)）。小数第1位まで受け付け、JSON では文字列ではなく数値で返す
Amount = Annotated[
    Decimal,
    Field(gt=0, max_digits=5, decimal_places=1),
    PlainSerializer(float, return_type=float, when_used="json"),
]

# 単位ごとの量の範囲（下限, 上限）
DOSE_RANGES: dict[str, tuple[Decimal, Decimal]] = {
    "g": (Decimal("0.1"), Decimal("1000")),
    "cup": (Decimal("0.5"), Decimal("20")),
}
WATER_RANGES: dict[str, tuple[Decimal, Decimal]] = {
    "ml": (Decimal("1"), Decimal("5000")),
    "cup": (Decimal("1"), Decimal("20")),
}


def check_amount(
    label: str,
    amount: Decimal | None,
    unit: str | None,
    ranges: dict[str, tuple[Decimal, Decimal]],
) -> None:
    """量と単位はセットで入力し、量が単位ごとの範囲に収まっているかを確かめる。"""
    if amount is None and unit is None:
        return
    if amount is None or unit is None:
        raise ValueError(f"{label}は数値と単位をセットで入力してください")
    low, high = ranges[unit]
    if not low <= amount <= high:
        raise ValueError(f"{label}（{unit}）は {low}〜{high} の範囲で入力してください")


class BrewRecordBase(BaseModel):
    """抽出記録の入力項目（登録・編集で共通）。"""

    model_config = INPUT_CONFIG

    brewed_on: date
    method: BrewMethod
    temperature: Temperature = "hot"
    dose_amount: Amount | None = None
    dose_unit: DoseUnit | None = None
    water_amount: Amount | None = None
    water_unit: WaterUnit | None = None
    equipment: Text100 = None
    grind_size: GrindSize | None = None
    water_temp_c: int | None = Field(default=None, ge=50, le=100)
    brew_time_sec: int | None = Field(default=None, ge=1, le=3600)
    taste_memo: Text1000 = None

    @model_validator(mode="after")
    def check_amounts(self) -> Self:
        check_amount("豆の量", self.dose_amount, self.dose_unit, DOSE_RANGES)
        check_amount("湯量", self.water_amount, self.water_unit, WATER_RANGES)
        return self


class BrewRecordCreate(BrewRecordBase):
    """抽出記録の登録（POST）。"""


class BrewRecordUpdate(BrewRecordBase):
    """抽出記録の編集（PUT）。全項目を送る。"""


class BrewRecordRead(BrewRecordBase):
    """API が返す抽出記録。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    bean_id: int
    created_at: datetime
    updated_at: datetime
