"""DB のテーブル（モデル）。ここで import すると Base.metadata に登録される。"""

from app.models.bean import Bean
from app.models.brew_record import BrewRecord

__all__ = ["Bean", "BrewRecord"]
