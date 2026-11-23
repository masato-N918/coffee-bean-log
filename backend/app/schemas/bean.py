"""豆（beans）の API で受け取る・返すデータの形と入力チェック。

制約は docs/機能要件.md の「3.1 豆の入力項目」に合わせる。
"""

from datetime import date, datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.choices import PROCESSES, ROAST_GROUPS, ROAST_LEVEL_TO_GROUP, ROAST_LEVELS
from app.schemas.common import INPUT_CONFIG, Text100, Text1000

# 選択肢は choices.py のタプルから作る（値を二重に書かない）
RoastGroup = Literal[*ROAST_GROUPS]
RoastLevel = Literal[*ROAST_LEVELS]
Process = Literal[*PROCESSES]

# 豆一覧の並び順（newest: 新しい順 / rating: 評価順）
BeanSort = Literal["newest", "rating"]


class BeanBase(BaseModel):
    """豆の入力項目（登録・編集で共通）。"""

    model_config = INPUT_CONFIG

    name: str = Field(min_length=1, max_length=100)
    shop: Text100 = None
    origin: Text100 = None
    roast_group: RoastGroup | None = None
    roast_level: RoastLevel | None = None
    process: Process | None = None
    purchased_on: date | None = None
    weight_g: int | None = Field(default=None, ge=1, le=10000)
    price: int | None = Field(default=None, ge=0, le=1000000)
    rating: int | None = Field(default=None, ge=1, le=5)
    memo: Text1000 = None

    @model_validator(mode="after")
    def fill_and_check_roast_group(self) -> Self:
        """8段階を選んだときは呼び方を自動で入れ、食い違っていればエラーにする。"""
        if self.roast_level is None:
            return self
        expected = ROAST_LEVEL_TO_GROUP[self.roast_level]
        if self.roast_group is None:
            self.roast_group = expected
        elif self.roast_group != expected:
            raise ValueError(
                f"roast_level '{self.roast_level}' と roast_group '{self.roast_group}' の"
                f"組み合わせが正しくありません（正しい roast_group は '{expected}'）"
            )
        return self


class BeanCreate(BeanBase):
    """豆の登録（POST）。"""


class BeanUpdate(BeanBase):
    """豆の編集（PUT）。全項目を送る。"""


class BeanRead(BeanBase):
    """API が返す豆。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
