"""入力スキーマの空白の扱いのテスト（DB を使わない）。"""

import pytest
from pydantic import ValidationError

from app.schemas.bean import BeanCreate
from app.schemas.brew_record import BrewRecordCreate


def test_bean_strips_whitespace() -> None:
    bean = BeanCreate(
        name="  エチオピア  ", shop=" 〇〇珈琲店 ", origin="\tエチオピア\n", memo=" メモ "
    )
    assert bean.name == "エチオピア"
    assert bean.shop == "〇〇珈琲店"
    assert bean.origin == "エチオピア"
    assert bean.memo == "メモ"


@pytest.mark.parametrize("name", ["", "   ", "　"])
def test_bean_name_blank_is_error(name: str) -> None:
    # 全角スペースだけの名前も空として扱う
    with pytest.raises(ValidationError):
        BeanCreate(name=name)


@pytest.mark.parametrize("value", ["", "   "])
def test_bean_blank_optional_text_is_none(value: str) -> None:
    bean = BeanCreate(name="豆", shop=value, origin=value, memo=value)
    assert bean.shop is None
    assert bean.origin is None
    assert bean.memo is None


def test_bean_max_length_counts_after_strip() -> None:
    # 前後の空白は文字数に含めない
    assert BeanCreate(name=" " + "あ" * 100 + " ").name == "あ" * 100
    with pytest.raises(ValidationError):
        BeanCreate(name="あ" * 101)
    with pytest.raises(ValidationError):
        BeanCreate(name="豆", shop="あ" * 101)


def test_brew_record_strips_whitespace_and_blank_is_none() -> None:
    record = BrewRecordCreate(
        brewed_on="2026-11-20", method="hand_drip", equipment=" V60 ", taste_memo="   "
    )
    assert record.equipment == "V60"
    assert record.taste_memo is None
