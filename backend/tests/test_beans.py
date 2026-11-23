from datetime import date
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import BrewRecord

FULL_BEAN: dict[str, Any] = {
    "name": "エチオピア イルガチェフェ",
    "shop": "〇〇珈琲店",
    "origin": "エチオピア イルガチェフェ",
    "roast_group": "medium_dark",
    "roast_level": "city",
    "process": "washed",
    "purchased_on": "2026-11-18",
    "weight_g": 200,
    "price": 1500,
    "rating": 4,
    "memo": "店員さんのおすすめ",
}


def create_bean(client: TestClient, **fields: Any) -> dict[str, Any]:
    response = client.post("/api/beans", json={"name": "テスト豆", **fields})
    assert response.status_code == 201, response.text
    bean: dict[str, Any] = response.json()
    return bean


def test_create_and_get_bean(client: TestClient) -> None:
    response = client.post("/api/beans", json=FULL_BEAN)

    assert response.status_code == 201
    created = response.json()
    for key, value in FULL_BEAN.items():
        assert created[key] == value
    assert created["id"] > 0
    assert created["created_at"] and created["updated_at"]

    response = client.get(f"/api/beans/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_create_bean_with_name_only(client: TestClient) -> None:
    created = create_bean(client)

    assert created["name"] == "テスト豆"
    for key in FULL_BEAN.keys() - {"name"}:
        assert created[key] is None


def test_list_beans_newest_first(client: TestClient) -> None:
    first = create_bean(client, name="1つ目")
    second = create_bean(client, name="2つ目")

    response = client.get("/api/beans")

    assert response.status_code == 200
    ids = [bean["id"] for bean in response.json()]
    assert ids.index(second["id"]) < ids.index(first["id"])


def list_ids(client: TestClient, **params: Any) -> list[int]:
    response = client.get("/api/beans", params=params)
    assert response.status_code == 200, response.text
    return [bean["id"] for bean in response.json()]


def test_filter_by_origin_partial_match(client: TestClient) -> None:
    ethiopia = create_bean(client, origin="エチオピア イルガチェフェ")
    kenya = create_bean(client, origin="ケニア")

    ids = list_ids(client, origin="エチオピア")

    assert ethiopia["id"] in ids
    assert kenya["id"] not in ids


def test_filter_by_origin_escapes_wildcards(client: TestClient) -> None:
    bean = create_bean(client, origin="ブラジル")

    assert bean["id"] not in list_ids(client, origin="%")
    assert bean["id"] in list_ids(client, origin="")  # 空なら条件なし


def test_filter_by_roast_group_includes_roast_level(client: TestClient) -> None:
    high = create_bean(client, roast_level="high")
    group_only = create_bean(client, roast_group="medium")
    city = create_bean(client, roast_level="city")

    ids = list_ids(client, roast_group="medium")

    assert high["id"] in ids
    assert group_only["id"] in ids
    assert city["id"] not in ids


def test_filter_by_roast_level_exact(client: TestClient) -> None:
    high = create_bean(client, roast_level="high")
    group_only = create_bean(client, roast_group="medium")

    ids = list_ids(client, roast_level="high")

    assert high["id"] in ids
    assert group_only["id"] not in ids


def test_filter_by_roast_group_and_level_is_or(client: TestClient) -> None:
    light = create_bean(client, roast_group="light")
    city = create_bean(client, roast_level="city")
    french = create_bean(client, roast_level="french")

    ids = list_ids(client, roast_group=["light"], roast_level=["city"])

    assert light["id"] in ids
    assert city["id"] in ids
    assert french["id"] not in ids


def test_filter_by_min_rating(client: TestClient) -> None:
    beans = {rating: create_bean(client, rating=rating) for rating in (2, 3, 5)}
    unrated = create_bean(client)

    ids = list_ids(client, min_rating=3)

    assert beans[3]["id"] in ids
    assert beans[5]["id"] in ids
    assert beans[2]["id"] not in ids
    assert unrated["id"] not in ids


def test_filters_are_combined_with_and(client: TestClient) -> None:
    match = create_bean(client, origin="エチオピア", rating=4)
    low_rating = create_bean(client, origin="エチオピア", rating=2)
    other_origin = create_bean(client, origin="ケニア", rating=5)

    ids = list_ids(client, origin="エチオピア", min_rating=3)

    assert match["id"] in ids
    assert low_rating["id"] not in ids
    assert other_origin["id"] not in ids


def test_sort_by_rating(client: TestClient) -> None:
    unrated = create_bean(client)
    old_four = create_bean(client, rating=4)
    five = create_bean(client, rating=5)
    new_four = create_bean(client, rating=4)
    mine = {bean["id"] for bean in (unrated, old_four, five, new_four)}

    ids = [bean_id for bean_id in list_ids(client, sort="rating") if bean_id in mine]

    assert ids == [five["id"], new_four["id"], old_four["id"], unrated["id"]]


@pytest.mark.parametrize(
    "params",
    [
        {"roast_group": "unknown"},
        {"roast_level": "unknown"},
        {"min_rating": 0},
        {"min_rating": 6},
        {"sort": "unknown"},
        {"origin": "あ" * 101},
    ],
)
def test_list_beans_invalid_params(client: TestClient, params: dict[str, Any]) -> None:
    response = client.get("/api/beans", params=params)

    assert response.status_code == 422


def test_update_bean(client: TestClient) -> None:
    created = create_bean(client)

    response = client.put(f"/api/beans/{created['id']}", json=FULL_BEAN)

    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == created["id"]
    for key, value in FULL_BEAN.items():
        assert updated[key] == value


def test_delete_bean(client: TestClient) -> None:
    created = create_bean(client)

    response = client.delete(f"/api/beans/{created['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/beans/{created['id']}").status_code == 404


@pytest.mark.parametrize(
    ("method", "body"),
    [("get", None), ("put", {"name": "豆"}), ("delete", None)],
)
def test_not_found(client: TestClient, method: str, body: dict[str, Any] | None) -> None:
    response = client.request(method, "/api/beans/999999999", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "豆が見つかりません"}


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"name": ""},
        {"name": "   "},
        {"name": "あ" * 101},
        {"name": "豆", "rating": 0},
        {"name": "豆", "rating": 6},
        {"name": "豆", "weight_g": 0},
        {"name": "豆", "price": -1},
        {"name": "豆", "process": "unknown"},
        {"name": "豆", "roast_level": "unknown"},
        {"name": "豆", "memo": "あ" * 1001},
    ],
)
def test_create_bean_validation_error(client: TestClient, body: dict[str, Any]) -> None:
    response = client.post("/api/beans", json=body)

    assert response.status_code == 422


def test_text_is_stripped_and_blank_is_saved_as_null(client: TestClient) -> None:
    created = create_bean(client, name="  豆  ", shop=" 〇〇珈琲店 ", origin="", memo="   ")
    assert created["name"] == "豆"
    assert created["shop"] == "〇〇珈琲店"
    assert created["origin"] is None
    assert created["memo"] is None

    # 編集でも同じ扱いにする。取り直しても空文字ではなく null で保存されている
    response = client.put(f"/api/beans/{created['id']}", json={"name": "豆", "shop": "  "})
    assert response.status_code == 200
    assert client.get(f"/api/beans/{created['id']}").json()["shop"] is None


def test_roast_level_fills_roast_group(client: TestClient) -> None:
    created = create_bean(client, roast_level="city")

    assert created["roast_level"] == "city"
    assert created["roast_group"] == "medium_dark"


def test_roast_group_only(client: TestClient) -> None:
    created = create_bean(client, roast_group="medium")

    assert created["roast_group"] == "medium"
    assert created["roast_level"] is None


def test_roast_level_and_group_mismatch(client: TestClient) -> None:
    response = client.post(
        "/api/beans", json={"name": "豆", "roast_level": "city", "roast_group": "light"}
    )

    assert response.status_code == 422


def test_delete_bean_also_deletes_brew_records(client: TestClient, db: Session) -> None:
    created = create_bean(client)
    record = BrewRecord(bean_id=created["id"], brewed_on=date(2026, 11, 20), method="hand_drip")
    db.add(record)
    db.commit()
    record_id = record.id

    client.delete(f"/api/beans/{created['id']}")

    db.expire_all()
    assert db.get(BrewRecord, record_id) is None
