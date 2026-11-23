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
    return response.json()


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
