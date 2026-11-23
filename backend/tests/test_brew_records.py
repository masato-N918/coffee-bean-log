from typing import Any

import pytest
from fastapi.testclient import TestClient

FULL_RECORD: dict[str, Any] = {
    "brewed_on": "2026-11-20",
    "method": "hand_drip",
    "temperature": "ice",
    "dose_amount": 15.0,
    "dose_unit": "g",
    "water_amount": 240.0,
    "water_unit": "ml",
    "equipment": "ハリオ V60",
    "grind_size": "medium_fine",
    "water_temp_c": 90,
    "brew_time_sec": 180,
    "taste_memo": "酸味が明るく、後味がすっきり",
}

MINIMUM_RECORD: dict[str, Any] = {"brewed_on": "2026-11-20", "method": "machine"}


@pytest.fixture
def bean_id(client: TestClient) -> int:
    response = client.post("/api/beans", json={"name": "テスト豆"})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_record(client: TestClient, bean_id: int, **fields: Any) -> dict[str, Any]:
    response = client.post(f"/api/beans/{bean_id}/brew-records", json={**MINIMUM_RECORD, **fields})
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_get_brew_record(client: TestClient, bean_id: int) -> None:
    response = client.post(f"/api/beans/{bean_id}/brew-records", json=FULL_RECORD)

    assert response.status_code == 201
    created = response.json()
    for key, value in FULL_RECORD.items():
        assert created[key] == value
    assert isinstance(created["dose_amount"], float)  # 文字列ではなく数値で返る
    assert created["bean_id"] == bean_id
    assert created["created_at"] and created["updated_at"]

    response = client.get(f"/api/brew-records/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_create_brew_record_with_required_only(client: TestClient, bean_id: int) -> None:
    created = create_record(client, bean_id)

    assert created["temperature"] == "hot"  # 省略時はホット
    for key in FULL_RECORD.keys() - {"brewed_on", "method", "temperature"}:
        assert created[key] is None


def test_create_brew_record_with_cups(client: TestClient, bean_id: int) -> None:
    created = create_record(
        client, bean_id, dose_amount=1.5, dose_unit="cup", water_amount=2, water_unit="cup"
    )

    assert created["dose_amount"] == 1.5
    assert created["water_amount"] == 2.0


def test_list_brew_records_newest_first(client: TestClient, bean_id: int) -> None:
    old = create_record(client, bean_id, brewed_on="2026-11-18")
    newest_day_first = create_record(client, bean_id, brewed_on="2026-11-20")
    newest_day_second = create_record(client, bean_id, brewed_on="2026-11-20")
    middle = create_record(client, bean_id, brewed_on="2026-11-19")

    response = client.get(f"/api/beans/{bean_id}/brew-records")

    assert response.status_code == 200
    ids = [record["id"] for record in response.json()]
    assert ids == [newest_day_second["id"], newest_day_first["id"], middle["id"], old["id"]]


def test_list_brew_records_only_for_the_bean(client: TestClient, bean_id: int) -> None:
    mine = create_record(client, bean_id)
    other_bean = client.post("/api/beans", json={"name": "別の豆"}).json()
    create_record(client, other_bean["id"])

    response = client.get(f"/api/beans/{bean_id}/brew-records")

    assert [record["id"] for record in response.json()] == [mine["id"]]


def test_update_brew_record(client: TestClient, bean_id: int) -> None:
    created = create_record(client, bean_id)

    response = client.put(f"/api/brew-records/{created['id']}", json=FULL_RECORD)

    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == created["id"]
    assert updated["bean_id"] == bean_id
    for key, value in FULL_RECORD.items():
        assert updated[key] == value


def test_delete_brew_record(client: TestClient, bean_id: int) -> None:
    created = create_record(client, bean_id)

    response = client.delete(f"/api/brew-records/{created['id']}")

    assert response.status_code == 204
    assert client.get(f"/api/brew-records/{created['id']}").status_code == 404
    assert client.get(f"/api/beans/{bean_id}").status_code == 200  # 豆は残る


@pytest.mark.parametrize(
    ("method", "body"),
    [("get", None), ("post", MINIMUM_RECORD)],
)
def test_bean_not_found(client: TestClient, method: str, body: dict[str, Any] | None) -> None:
    response = client.request(method, "/api/beans/999999999/brew-records", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "豆が見つかりません"}


@pytest.mark.parametrize(
    ("method", "body"),
    [("get", None), ("put", MINIMUM_RECORD), ("delete", None)],
)
def test_brew_record_not_found(
    client: TestClient, method: str, body: dict[str, Any] | None
) -> None:
    response = client.request(method, "/api/brew-records/999999999", json=body)

    assert response.status_code == 404
    assert response.json() == {"detail": "抽出記録が見つかりません"}


@pytest.mark.parametrize(
    "fields",
    [
        {"brewed_on": None},
        {"method": None},
        {"method": "unknown"},
        {"temperature": "warm"},
        {"grind_size": "unknown"},
        # 量と単位はセット
        {"dose_amount": 15},
        {"dose_unit": "g"},
        {"water_amount": 240},
        {"water_unit": "ml"},
        # 単位ごとの範囲
        {"dose_amount": 0.05, "dose_unit": "g"},
        {"dose_amount": 1000.1, "dose_unit": "g"},
        {"dose_amount": 0.4, "dose_unit": "cup"},
        {"dose_amount": 20.5, "dose_unit": "cup"},
        {"water_amount": 0.5, "water_unit": "ml"},
        {"water_amount": 5001, "water_unit": "ml"},
        {"water_amount": 0.5, "water_unit": "cup"},
        {"water_amount": 21, "water_unit": "cup"},
        {"dose_amount": 15.25, "dose_unit": "g"},  # 小数第2位
        {"dose_unit": "ml", "dose_amount": 15},  # 豆の量に ml は使えない
        {"water_temp_c": 49},
        {"water_temp_c": 101},
        {"brew_time_sec": 0},
        {"brew_time_sec": 3601},
        {"equipment": "あ" * 101},
        {"taste_memo": "あ" * 1001},
    ],
)
def test_create_brew_record_validation_error(
    client: TestClient, bean_id: int, fields: dict[str, Any]
) -> None:
    response = client.post(f"/api/beans/{bean_id}/brew-records", json={**MINIMUM_RECORD, **fields})

    assert response.status_code == 422


@pytest.mark.parametrize(
    "fields",
    [
        {"dose_amount": 0.1, "dose_unit": "g"},
        {"dose_amount": 1000, "dose_unit": "g"},
        {"dose_amount": 0.5, "dose_unit": "cup"},
        {"dose_amount": 20, "dose_unit": "cup"},
        {"water_amount": 1, "water_unit": "ml"},
        {"water_amount": 5000, "water_unit": "ml"},
        {"water_amount": 1, "water_unit": "cup"},
        {"water_amount": 20, "water_unit": "cup"},
    ],
)
def test_create_brew_record_amount_boundaries(
    client: TestClient, bean_id: int, fields: dict[str, Any]
) -> None:
    create_record(client, bean_id, **fields)


def test_text_is_stripped_and_blank_is_saved_as_null(client: TestClient, bean_id: int) -> None:
    created = create_record(client, bean_id, equipment=" ハリオ V60 ", taste_memo="   ")
    assert created["equipment"] == "ハリオ V60"
    assert created["taste_memo"] is None

    response = client.put(
        f"/api/brew-records/{created['id']}", json={**MINIMUM_RECORD, "equipment": ""}
    )
    assert response.status_code == 200
    assert response.json()["equipment"] is None
