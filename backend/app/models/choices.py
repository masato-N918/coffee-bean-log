"""選択肢の項目に保存するコード値（docs/データ設計書.md の「4. 選択肢の保存値」）。

DB の CHECK 制約と、API の入力チェックの両方でここの値を使う。
"""

from collections.abc import Iterable

# 焙煎度の呼び方（beans.roast_group）
ROAST_GROUPS = ("light", "medium", "medium_dark", "dark")

# 焙煎度 8段階（beans.roast_level）と、対応する呼び方
ROAST_LEVEL_TO_GROUP = {
    "light": "light",
    "cinnamon": "light",
    "medium": "medium",
    "high": "medium",
    "city": "medium_dark",
    "full_city": "medium_dark",
    "french": "dark",
    "italian": "dark",
}
ROAST_LEVELS = tuple(ROAST_LEVEL_TO_GROUP)

# 精製方法（beans.process）
PROCESSES = ("washed", "natural", "honey", "other")

# 抽出方法（brew_records.method）
BREW_METHODS = ("hand_drip", "machine", "french_press", "espresso", "other")

# ホット / アイス（brew_records.temperature）
TEMPERATURES = ("hot", "ice")

# 挽き目（brew_records.grind_size）
GRIND_SIZES = ("extra_fine", "fine", "medium_fine", "medium", "coarse")

# 単位（brew_records.dose_unit / water_unit）
DOSE_UNITS = ("g", "cup")
WATER_UNITS = ("ml", "cup")


def in_check(column: str, values: Iterable[str]) -> str:
    """CHECK 制約用の SQL を作る。例: in_check("process", ("washed", "natural"))
    → "process IN ('washed', 'natural')"
    """
    joined = ", ".join(f"'{value}'" for value in values)
    return f"{column} IN ({joined})"
