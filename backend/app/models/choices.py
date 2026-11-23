"""選択肢の項目に保存するコード値（docs/データ設計書.md の「4. 選択肢の保存値」）。

DB の CHECK 制約と、API の入力チェックの両方でここの値を使う。
値は Literal 型に一度だけ書き、CHECK 制約などで使うタプルは get_args() で Literal から作る
（Literal[*タプル] の書き方は、型チェッカー（mypy）が型として扱えないため）。
"""

from collections.abc import Iterable
from typing import Literal, get_args

# 焙煎度の呼び方（beans.roast_group）
RoastGroup = Literal["light", "medium", "medium_dark", "dark"]
ROAST_GROUPS: tuple[RoastGroup, ...] = get_args(RoastGroup)

# 焙煎度 8段階（beans.roast_level）と、対応する呼び方
RoastLevel = Literal[
    "light", "cinnamon", "medium", "high", "city", "full_city", "french", "italian"
]
ROAST_LEVELS: tuple[RoastLevel, ...] = get_args(RoastLevel)
ROAST_LEVEL_TO_GROUP: dict[RoastLevel, RoastGroup] = {
    "light": "light",
    "cinnamon": "light",
    "medium": "medium",
    "high": "medium",
    "city": "medium_dark",
    "full_city": "medium_dark",
    "french": "dark",
    "italian": "dark",
}

# 精製方法（beans.process）
Process = Literal["washed", "natural", "honey", "other"]
PROCESSES: tuple[Process, ...] = get_args(Process)

# 抽出方法（brew_records.method）
BrewMethod = Literal["hand_drip", "machine", "french_press", "espresso", "other"]
BREW_METHODS: tuple[BrewMethod, ...] = get_args(BrewMethod)

# ホット / アイス（brew_records.temperature）
Temperature = Literal["hot", "ice"]
TEMPERATURES: tuple[Temperature, ...] = get_args(Temperature)

# 挽き目（brew_records.grind_size）
GrindSize = Literal["extra_fine", "fine", "medium_fine", "medium", "coarse"]
GRIND_SIZES: tuple[GrindSize, ...] = get_args(GrindSize)

# 単位（brew_records.dose_unit / water_unit）
DoseUnit = Literal["g", "cup"]
DOSE_UNITS: tuple[DoseUnit, ...] = get_args(DoseUnit)
WaterUnit = Literal["ml", "cup"]
WATER_UNITS: tuple[WaterUnit, ...] = get_args(WaterUnit)


def in_check(column: str, values: Iterable[str]) -> str:
    """CHECK 制約用の SQL を作る。例: in_check("process", ("washed", "natural"))
    → "process IN ('washed', 'natural')"
    """
    joined = ", ".join(f"'{value}'" for value in values)
    return f"{column} IN ({joined})"
