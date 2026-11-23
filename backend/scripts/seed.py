"""開発用のテストデータ（豆と抽出記録）を DB に入れる。

使い方（backend で実行）:
    uv run python -m scripts.seed          # テストデータを追加（同じ名前の豆があれば飛ばす）
    uv run python -m scripts.seed --reset  # 豆と抽出記録をすべて消してから入れ直す

絞り込み・並び替え・表示の確認がしやすいように、次のパターンをそろえている。
- 焙煎度：8段階あり / 呼び方だけ / 未入力
- 評価：★1〜5 / 未評価
- 産地：同じ国の豆が複数（部分一致の確認用）/ 未入力
- 抽出記録：複数ある豆 / ない豆、ホット / アイス、g・ml / 杯、詳細あり / なし
"""

import argparse
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select

from app.database import SessionLocal
from app.models import Bean, BrewRecord

# 豆。上から順に古い（「新しい順」で下から並ぶ）
BEANS: list[dict] = [
    {
        "name": "ブラジル ショコラ",
        "shop": "〇〇珈琲店",
        "origin": "ブラジル",
        "roast_group": "dark",
        "roast_level": "french",
        "process": "natural",
        "purchased_on": date(2026, 10, 20),
        "weight_g": 200,
        "price": 1100,
        "rating": 3,
        "memo": None,
    },
    {
        "name": "ケニア ニエリ",
        "shop": None,
        "origin": "ケニア ニエリ",
        "roast_group": "light",
        "roast_level": None,
        "process": None,
        "purchased_on": None,
        "weight_g": None,
        "price": None,
        "rating": 2,
        "memo": None,
    },
    {
        "name": "マンデリン G1",
        "shop": "△△ロースタリー",
        "origin": "インドネシア スマトラ",
        "roast_group": "dark",
        "roast_level": "italian",
        "process": "other",
        "purchased_on": date(2026, 10, 28),
        "weight_g": 200,
        "price": 1400,
        "rating": 5,
        "memo": "スマトラ式。どっしりした苦味",
    },
    {
        "name": "グアテマラ アンティグア",
        "shop": "△△ロースタリー",
        "origin": "グアテマラ アンティグア",
        "roast_group": "medium",
        "roast_level": "high",
        "process": "washed",
        "purchased_on": date(2026, 11, 2),
        "weight_g": 200,
        "price": 1300,
        "rating": 5,
        "memo": "チョコレートのような甘さ",
    },
    {
        "name": "コスタリカ ハニー",
        "shop": "〇〇珈琲店",
        "origin": "コスタリカ",
        "roast_group": "medium",
        "roast_level": "medium",
        "process": "honey",
        "purchased_on": date(2026, 11, 5),
        "weight_g": 100,
        "price": 900,
        "rating": None,
        "memo": None,
    },
    {
        "name": "ハウスブレンド",
        "shop": "近所のカフェ",
        "origin": None,
        "roast_group": None,
        "roast_level": None,
        "process": None,
        "purchased_on": date(2026, 11, 10),
        "weight_g": 500,
        "price": 2500,
        "rating": 3,
        "memo": "毎朝用",
    },
    {
        "name": "エチオピア グジ ナチュラル",
        "shop": "△△ロースタリー",
        "origin": "エチオピア グジ",
        "roast_group": "light",
        "roast_level": "cinnamon",
        "process": "natural",
        "purchased_on": date(2026, 11, 12),
        "weight_g": 150,
        "price": 1800,
        "rating": 4,
        "memo": "ベリーのような香り",
    },
    {
        "name": "パイクプレイス ロースト",
        "shop": "スーパー",
        "origin": "ラテンアメリカ",
        "roast_group": "medium_dark",
        "roast_level": None,
        "process": None,
        "purchased_on": date(2026, 11, 15),
        "weight_g": 250,
        "price": 1200,
        "rating": None,
        "memo": None,
    },
    {
        "name": "コロンビア スプレモ",
        "shop": "スーパー",
        "origin": "コロンビア",
        "roast_group": "medium_dark",
        "roast_level": "full_city",
        "process": "washed",
        "purchased_on": date(2026, 11, 16),
        "weight_g": 200,
        "price": 1000,
        "rating": 1,
        "memo": "少し焦げっぽかった",
    },
    {
        "name": "エチオピア イルガチェフェ",
        "shop": "〇〇珈琲店",
        "origin": "エチオピア イルガチェフェ",
        "roast_group": "medium_dark",
        "roast_level": "city",
        "process": "washed",
        "purchased_on": date(2026, 11, 18),
        "weight_g": 200,
        "price": 1500,
        "rating": 4,
        "memo": "店員さんのおすすめ",
    },
]

# 抽出記録（豆の名前で紐づける）
BREW_RECORDS: dict[str, list[dict]] = {
    "エチオピア イルガチェフェ": [
        {
            "brewed_on": date(2026, 11, 18),
            "method": "french_press",
            "temperature": "hot",
            "dose_amount": Decimal("18"),
            "dose_unit": "g",
            "water_amount": Decimal("300"),
            "water_unit": "ml",
            "grind_size": "coarse",
            "water_temp_c": 94,
            "brew_time_sec": 240,
            "taste_memo": "コクが出て、少し重め",
        },
        {
            "brewed_on": date(2026, 11, 19),
            "method": "machine",
            "temperature": "hot",
            "dose_amount": Decimal("2"),
            "dose_unit": "cup",
            "water_amount": Decimal("2"),
            "water_unit": "cup",
        },
        {
            "brewed_on": date(2026, 11, 20),
            "method": "hand_drip",
            "temperature": "hot",
            "dose_amount": Decimal("15"),
            "dose_unit": "g",
            "water_amount": Decimal("240"),
            "water_unit": "ml",
            "equipment": "ハリオ V60",
            "grind_size": "medium_fine",
            "water_temp_c": 90,
            "brew_time_sec": 180,
            "taste_memo": "酸味が明るく、後味がすっきり",
        },
    ],
    "グアテマラ アンティグア": [
        {
            "brewed_on": date(2026, 11, 10),
            "method": "machine",
            "temperature": "ice",
            "dose_amount": Decimal("3"),
            "dose_unit": "cup",
            "equipment": "〇〇社 全自動マシン",
            "taste_memo": "甘い香り",
        },
    ],
    "マンデリン G1": [
        {
            "brewed_on": date(2026, 11, 1),
            "method": "espresso",
            "temperature": "hot",
            "dose_amount": Decimal("18.5"),
            "dose_unit": "g",
            "water_amount": Decimal("36"),
            "water_unit": "ml",
            "grind_size": "extra_fine",
            "water_temp_c": 93,
            "brew_time_sec": 28,
            "taste_memo": "ラテにすると最高",
        },
        {
            "brewed_on": date(2026, 11, 8),
            "method": "hand_drip",
            "temperature": "ice",
            "dose_amount": Decimal("20"),
            "dose_unit": "g",
            "water_amount": Decimal("150"),
            "water_unit": "ml",
            "taste_memo": "急冷式のアイスコーヒー。苦味がまろやか",
        },
    ],
}


def main() -> None:
    parser = argparse.ArgumentParser(description="開発用のテストデータを入れる")
    parser.add_argument(
        "--reset", action="store_true", help="豆と抽出記録をすべて消してから入れ直す"
    )
    args = parser.parse_args()

    with SessionLocal() as db:
        if args.reset:
            db.execute(delete(BrewRecord))
            db.execute(delete(Bean))
            print("豆と抽出記録をすべて削除しました")

        existing = set(db.scalars(select(Bean.name)))
        # 登録日時を1時間ずつずらして、「新しい順」の並びを BEANS の順に固定する
        base_time = datetime.now().replace(microsecond=0) - timedelta(hours=len(BEANS))
        added = 0
        for i, data in enumerate(BEANS):
            if data["name"] in existing:
                print(f"スキップ（登録済み）: {data['name']}")
                continue
            created_at = base_time + timedelta(hours=i)
            bean = Bean(**data, created_at=created_at, updated_at=created_at)
            for record in BREW_RECORDS.get(data["name"], []):
                bean.brew_records.append(BrewRecord(**record))
            db.add(bean)
            added += 1

        db.commit()
        print(f"豆を {added} 件追加しました")


if __name__ == "__main__":
    main()
